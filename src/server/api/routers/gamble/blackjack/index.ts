import {
  createTRPCRouter,
  protectedProcedure,
  qstashProcedure,
} from "~/server/api/trpc";
import {
  CARD_BACK,
  type Card,
  deckNewShuffle,
  deckDraw,
  getScore,
} from "./api";
import { TRPCError } from "@trpc/server";
import { ablyRest } from "~/server/ably";
import superjson from "superjson";
import { waitFor } from "~/utils/shared";
import { env } from "~/env.mjs";
import { z } from "zod";
import { Client } from "@upstash/qstash/.";
import { getDomainUrl } from "~/utils/api";

type BlackJack = {
  gameId: string;
  deckId: string;
  createdAt: Date;
  startingAt: Date;
  dealer: { cards: (Card & { hidden: boolean })[] };
  players: { [playerId: string]: { cards: Card[]; busted: boolean } };
  turn: "dealer" | string;
  endedAt?: Date;
};

function gameAsPublic(game: BlackJack | null) {
  if (!game) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deckId, dealer, ...rest } = game;
  return {
    ...rest,
    dealer: {
      cards: dealer.cards.map((card) =>
        card.hidden
          ? { image: CARD_BACK, hidden: true as const }
          : { ...card, hidden: false as const }
      ),
    },
  };
}

async function getGame() {
  const channel = ablyRest.channels.get("gamble-internal:blackjack");
  const message = await channel.history({ limit: 1 });
  const data: unknown = message.items[0]?.data;
  if (!data) return null;
  return superjson.parse<BlackJack>(data as string);
}

async function setGame(game: BlackJack | null) {
  const channel = ablyRest.channels.get("gamble-internal:blackjack");
  await channel.publish("update", game && superjson.stringify(game));
}

const startSchema = z.string().length(21, { message: "gameId must be 21 len" }); // blackjack-svu231w2vnq

// if we are low on qstash limit, we can use forceShort & await on vercel
const JOIN_WAIT = (forceShort = false) =>
  (env.NEXT_PUBLIC_VERCEL_ENV === "development" || forceShort ? 6 : 15) * 1000;

export const blackJackRouter = createTRPCRouter({
  state: protectedProcedure.query(async () => gameAsPublic(await getGame())),
  start: qstashProcedure.input(startSchema).mutation(async ({ input }) => {
    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.gameId !== input) throw new TRPCError({ code: "BAD_REQUEST" });

    await backgroundTask(game); // since there is wait time, we can just call it (we must await on vercel)
  }),
  _delete: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session.user.discordId !== "223071656510357504")
      throw new TRPCError({ code: "BAD_REQUEST" });

    const channel = ablyRest.channels.get("gamble:blackjack");
    await setGame(null);
    await channel.publish("ended", null);
  }),
  join: protectedProcedure.mutation(async ({ ctx }) => {
    let blackJack = await getGame();

    if (blackJack && blackJack.startingAt < new Date() && !blackJack.endedAt)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Game already started",
      });

    if (!blackJack || blackJack.endedAt) {
      const { deck_id } = await deckNewShuffle(6);

      // TODO: get qstash limit

      blackJack = {
        gameId: "blackjack-" + Math.random().toString(36).slice(2),
        deckId: deck_id,
        createdAt: new Date(),
        startingAt: new Date(Date.now() + JOIN_WAIT()),
        dealer: { cards: [] },
        players: {
          [ctx.session.user.id]: { cards: [], busted: false },
        },
        turn: "dealer",
      };
      await setGame(blackJack);

      await handleCreated(blackJack);
    } else {
      blackJack.players[ctx.session.user.id] = { cards: [], busted: false };
      await setGame(blackJack);

      await announceJoin(blackJack, ctx.session.user.id);
    }
  }),
  hit: protectedProcedure.mutation(async ({ ctx }) => {
    const channel = ablyRest.channels.get("gamble:blackjack");
    const playerId = ctx.session.user.id;

    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.turn !== playerId) throw new TRPCError({ code: "BAD_REQUEST" });

    {
      const { cards } = await deckDraw(game.deckId, 1);
      game.players[playerId]?.cards.push(cards[0]);
      await setGame(game);
      await channel.publish(
        `draw.${playerId}`,
        superjson.stringify({ gameId: game.gameId, card: cards[0] })
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const player = game.players[playerId]!;

    if (getScore(player.cards) > 21) {
      player.busted = true;
      game.turn = nextTurn(game);
      await setGame(game);
      await channel.publish(`bust.${playerId}`, game.gameId);
      await channel.publish(`turn.${game.turn}`, game.gameId);
    } else if (getScore(player.cards) === 21) {
      game.turn = nextTurn(game);
      await setGame(game);
      await channel.publish(`turn.${game.turn}`, game.gameId);
    }

    if (game.turn === "dealer") await playAsDealer(game);
  }),
  stand: protectedProcedure.mutation(async ({ ctx }) => {
    const channel = ablyRest.channels.get("gamble:blackjack");
    const playerId = ctx.session.user.id;

    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.turn !== playerId) throw new TRPCError({ code: "BAD_REQUEST" });

    game.turn = nextTurn(game);
    await setGame(game);
    await channel.publish(`turn.${game.turn}`, game.gameId);

    if (game.turn === "dealer") await playAsDealer(game);
  }),
  double: protectedProcedure.mutation(() => ({})),
  deal: protectedProcedure.mutation(() => ({})),
});

function nextTurn(game: BlackJack) {
  const players = ["dealer"].concat(Object.keys(game.players));
  const currentTurn = players.indexOf(game.turn);
  const nextTurn = players[currentTurn + 1];
  return nextTurn || "dealer";
}

async function playAsDealer(game: BlackJack) {
  const channel = ablyRest.channels.get("gamble:blackjack");
  if (game.turn !== "dealer") throw new Error("Not dealer turn");

  const hiddenCard = game.dealer.cards[1];
  if (!hiddenCard) throw new Error("Dealer has no cards");
  hiddenCard.hidden = false;
  await setGame(game);
  await channel.publish(
    "show.dealer",
    superjson.stringify({ gameId: game.gameId, card: hiddenCard })
  );

  let dealerScore = getScore(game.dealer.cards);

  while (dealerScore < 17) {
    const { cards } = await deckDraw(game.deckId, 1);
    game.dealer.cards.push({ ...cards[0], hidden: false });
    await setGame(game);
    await channel.publish(
      "draw.dealer",
      superjson.stringify({ gameId: game.gameId, card: cards[0] })
    );
    dealerScore = getScore(game.dealer.cards);
  }

  if (dealerScore > 21) {
    await channel.publish("bust.dealer", game.gameId);
  }

  for (const [playerId, player] of Object.entries(game.players).filter(
    ([, player]) => !player.busted
  )) {
    const playerScore = getScore(player.cards);

    if (dealerScore > 21 || playerScore > dealerScore) {
      await channel.publish("win." + playerId, game.gameId);
    } else if (playerScore === dealerScore) {
      await channel.publish("tie." + playerId, game.gameId);
    } else {
      await channel.publish("lose." + playerId, game.gameId);
    }
  }

  game.endedAt = new Date();
  await setGame(game);
  await channel.publish("ended", game.gameId);
}

async function announceJoin(game: BlackJack, playerId: string) {
  const channel = ablyRest.channels.get("gamble:blackjack");
  await channel.publish(`joined.${playerId}`, game.gameId);
}

async function handleCreated(game: BlackJack, forceLocalShort = false) {
  const channel = ablyRest.channels.get("gamble:blackjack");
  await channel.publish(
    "created",
    superjson.stringify({
      gameId: game.gameId,
      waitFor: game.startingAt.getTime() - game.createdAt.getTime(),
      players: game.players,
    })
  );

  if (env.NEXT_PUBLIC_VERCEL_ENV === "development" || forceLocalShort) {
    // on vercel, we can't use qstash, so we wait for low wait time
    if (forceLocalShort) await backgroundTask(game);
    // local pc, wait for task instead of qstash
    else void backgroundTask(game);
  } else {
    // vercel, use qstash
    const c = new Client({ token: env.QSTASH_TOKEN });
    const url = getDomainUrl() + "/api/trpc/gamble.blackjack.start";
    await c.publish({
      url,
      delay: (game.startingAt.getTime() - Date.now()) / 1000,
      body: superjson.stringify(
        game.gameId satisfies z.input<typeof startSchema>
      ),
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function backgroundTask(game: BlackJack) {
  await waitFor(game.startingAt.getTime() - Date.now()).promise;
  game = (await getGame()) as BlackJack;
  if (!game) throw new Error("Game not found");
  const players = Object.keys(game.players);
  if (!players.length) throw new Error("No player on Blackjack game");
  // TODO: on player leave, cancel task or handle it
  // or client report for player timeout

  const channel = ablyRest.channels.get("gamble:blackjack");
  await channel.publish("started", game.gameId); // race condition (join/card draw)
  const { cards } = await deckDraw(game.deckId, players.length * 2 + 2);

  for (const player of players) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = cards.shift()!;
    game.players[player]?.cards.push(card);
    await setGame(game);
    await channel.publish(
      `draw.${player}`,
      superjson.stringify({ gameId: game.gameId, card })
    );
  }

  {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = cards.shift()!;
    game.dealer.cards.push({ ...card, hidden: false });
    await setGame(game);
    await channel.publish(
      "draw.dealer",
      superjson.stringify({ gameId: game.gameId, card })
    );
  }
  for (const player of players) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = cards.shift()!;
    game.players[player]?.cards.push(card);
    await setGame(game);
    await channel.publish(
      `draw.${player}`,
      superjson.stringify({ gameId: game.gameId, card })
    );
  }

  {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = cards.shift()!;
    game.dealer.cards.push({ ...card, hidden: true });
    await setGame(game);
    await channel.publish(
      "draw.dealer",
      superjson.stringify({ gameId: game.gameId, card: null })
    );
  }

  let playerCards;

  do {
    game.turn = nextTurn(game);
    playerCards = game.players[game.turn]?.cards;
  } while (getScore(playerCards) == 21);
  await setGame(game);
  await channel.publish(`turn.${game.turn}`, game.gameId);

  if (game.turn === "dealer") await playAsDealer(game);
}
