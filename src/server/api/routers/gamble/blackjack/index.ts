import { TRPCError } from "@trpc/server";
import { Client } from "@upstash/qstash";
import superjson from "superjson";
import { z } from "zod";
import { env } from "~/env.mjs";
import { ablyRest } from "~/server/ably";
import {
  createTRPCRouter,
  protectedProcedure,
  qstashProcedure,
} from "~/server/api/trpc";
import { getDomainUrl } from "~/utils/api";
import { waitFor } from "~/utils/shared";
import { deckDraw, deckNewShuffle, getScore } from "./api";
import { type BlackJack, type Events } from "./types";

function gameAsPublic(game: BlackJack | null) {
  if (!game) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deckId, dealer, seats, ...rest } = game;
  return {
    ...rest,
    dealer: {
      cards: dealer.cards.map((card) =>
        card.hidden
          ? { hidden: true as const }
          : { ...card, hidden: false as const }
      ),
    },
    seats: seats.map((seat) => ({
      ...seat,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      deck: seat.deck.map(({ bet, ...deck }) => ({
        ...deck,
      })),
    })),
  };
}

export const INTERNAL_CHANNEL = "gamble-internal:blackjack";
export const PUBLIC_CHANNEL = "gamble:blackjack";
export const MAX_SEAT_COUNT = 7;

async function getGame() {
  const channel = ablyRest.channels.get(INTERNAL_CHANNEL);
  const message = await channel.history({ limit: 1 });
  const data: unknown = message.items[0]?.data;
  if (!data) return null;
  return superjson.parse<BlackJack>(data as string);
}

async function setGame(game: BlackJack | null) {
  const channel = ablyRest.channels.get(INTERNAL_CHANNEL);
  await channel.publish("update", game && superjson.stringify(game));
}

export async function publish<TKey extends keyof Events>(
  key: TKey,
  data: Events[TKey]
) {
  const channel = ablyRest.channels.get(PUBLIC_CHANNEL);
  await channel.publish(key, superjson.stringify(data));
}

const gameId = z.string().startsWith("blackjack-");

// if we are low on qstash limit, we can use forceShort & await on vercel
const JOIN_WAIT = (forceShort = false) =>
  (env.NEXT_PUBLIC_VERCEL_ENV === "development" || forceShort ? 6 : 15) * 1000;

export const blackJackRouter = createTRPCRouter({
  state: protectedProcedure.query(async () => gameAsPublic(await getGame())),
  start: qstashProcedure.input(gameId).mutation(async ({ input }) => {
    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.gameId !== input)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `gameId mismatch, curr=${game.gameId}`,
      });

    await backgroundTask(game); // since there is wait time, we can just call it (we must await on vercel)
  }),
  // updateBet: protectedProcedure.input(gameId).mutation(async ({ input }) => {
  // }),
  reportTurn: protectedProcedure.input(gameId).mutation(async ({ input }) => {
    const channel = ablyRest.channels.get(INTERNAL_CHANNEL);
    const lastMsg = (await channel.history({ limit: 1 })).items[0];
    if (!lastMsg) throw new TRPCError({ code: "NOT_FOUND" });

    const game = superjson.parse<BlackJack>(lastMsg.data as string);
    if (game.gameId !== input)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `gameId mismatch, curr=${game.gameId}`,
      });

    const date = new Date(lastMsg.timestamp);
    if (date.getTime() > Date.now() - 30 * 1000)
      throw new TRPCError({ code: "BAD_REQUEST", message: "Game is fresh" });

    if (game.turn.playerId === "dealer")
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Dealer turn took more than expected.",
      });

    game.turn = nextTurn(game);
    await setGame(game);
    await publish("turn", { gameId: game.gameId, ...game.turn });
    if (game.turn.playerId === "dealer") await playAsDealer(game);
  }),
  _delete: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session.user.discordId !== "223071656510357504")
      throw new TRPCError({ code: "BAD_REQUEST" });

    await setGame(null);
    await publish("ended", null);
  }),
  join: protectedProcedure.mutation(async ({ ctx }) => {
    let blackJack = await getGame();

    if (blackJack && blackJack.startingAt < new Date() && !blackJack.endedAt)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Game already started",
      });

    if (!blackJack || blackJack.endedAt) {
      if (blackJack && blackJack?.seats.length >= MAX_SEAT_COUNT)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game is full",
        });

      // resume to deck
      const deck_id =
        blackJack && blackJack.endedAt
          ? blackJack.deckId
          : (await createNewDeck()).deck_id;
      // TODO: get qstash limit

      blackJack = {
        gameId: "blackjack-" + Math.random().toString(36).slice(2),
        deckId: deck_id,
        createdAt: new Date(),
        startingAt: new Date(Date.now() + JOIN_WAIT()),
        dealer: { cards: [] },
        seats: [
          {
            playerId: ctx.session.user.id,
            deck: [{ cards: [], busted: false, bet: 0 }],
          },
        ],
        turn: { playerId: "dealer", seat: 0, deck: 0 },
      };
      await setGame(blackJack);

      await handleCreated(blackJack);
    } else {
      blackJack.seats.push({
        playerId: ctx.session.user.id,
        deck: [{ cards: [], busted: false, bet: 0 }],
      });
      await setGame(blackJack);

      await publish("joined", {
        gameId: blackJack.gameId,
        playerId: ctx.session.user.id,
      });
    }
  }),
  hit: protectedProcedure.mutation(async ({ ctx }) => {
    const playerId = ctx.session.user.id;

    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.turn.playerId !== playerId)
      // if we remove playerId, how can we check for dealer?
      throw new TRPCError({ code: "BAD_REQUEST" });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const player = game.seats.find((p) => p.playerId === playerId)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const deck = player.deck[game.turn.deck]!;

    {
      const { cards } = await deckDraw(game.deckId, 1);
      deck.cards.push(cards[0]);
      await setGame(game);
      await publish("draw", {
        gameId: game.gameId,
        playerId,
        card: cards[0],
        seat: game.turn.seat,
        deck: game.turn.deck,
      });
    }

    if (getScore(deck.cards) > 21) {
      deck.busted = true;
      const bustTurn = { ...game.turn };
      game.turn = nextTurn(game);
      await setGame(game);
      await publish("bust", { gameId: game.gameId, ...bustTurn });
      await publish("turn", { gameId: game.gameId, ...game.turn });
    } else if (getScore(deck.cards) === 21) {
      game.turn = nextTurn(game);
      await setGame(game);
      await publish("turn", { gameId: game.gameId, ...game.turn });
    }

    if (game.turn.playerId === "dealer") await playAsDealer(game);
  }),
  stand: protectedProcedure.mutation(async ({ ctx }) => {
    const playerId = ctx.session.user.id;

    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.turn.playerId !== playerId)
      throw new TRPCError({ code: "BAD_REQUEST" });

    game.turn = nextTurn(game);
    await setGame(game);
    await publish("turn", { gameId: game.gameId, ...game.turn });

    if (game.turn.playerId === "dealer") await playAsDealer(game);
  }),
  split: protectedProcedure.mutation(async ({ ctx }) => {
    const playerId = ctx.session.user.id;

    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.turn.playerId !== playerId)
      throw new TRPCError({ code: "BAD_REQUEST" });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const seat = game.seats[game.turn.seat]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const deck = seat.deck[game.turn.deck]!;

    if (
      deck.cards.length !== 2 ||
      deck.cards[0]?.value !== deck.cards[1]?.value
    )
      throw new TRPCError({ code: "BAD_REQUEST" });

    // check for deck.bet * 2 on wallet

    seat.deck.push({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      cards: [deck.cards.pop()!],
      busted: false,
      bet: deck.bet,
    });

    await setGame(game);
    await publish("split", { gameId: game.gameId, ...game.turn });
  }),
  double: protectedProcedure.mutation(() => ({})),
  deal: protectedProcedure.mutation(() => ({})),
});

async function createNewDeck(game: BlackJack | null = null) {
  const deck = await deckNewShuffle(6);

  await publish("info.newDeck", {
    gameId: game?.gameId,
    deckCount: 6,
    cardCount: deck.remaining,
  });

  return deck;
}

function nextTurn(game: BlackJack) {
  const players = [{ playerId: "dealer", seat: 0, deck: 0 }].concat(
    game.seats.flatMap((p, seat) =>
      p.deck.map((_, deck) => ({ playerId: p.playerId, seat, deck }))
    )
  );
  const currentTurn = players.findIndex(
    (p) =>
      p.playerId === game.turn.playerId &&
      p.seat === game.turn.seat &&
      p.deck === game.turn.deck
  );
  const nextTurn = players[currentTurn + 1];
  return nextTurn || { playerId: "dealer", seat: 0, deck: 0 };
}

async function playAsDealer(game: BlackJack) {
  if (game.turn.playerId !== "dealer") throw new Error("Not dealer turn");

  const hiddenCard = game.dealer.cards[1];
  if (!hiddenCard) throw new Error("Dealer has no cards");
  hiddenCard.hidden = false;
  await setGame(game);
  await publish("show.dealer", { gameId: game.gameId, card: hiddenCard });

  let dealerScore = getScore(game.dealer.cards);

  while (dealerScore < 17) {
    const { cards } = await deckDraw(game.deckId, 1);
    game.dealer.cards.push({ ...cards[0], hidden: false });
    await setGame(game);
    await publish("draw.dealer", { gameId: game.gameId, card: cards[0] });
    dealerScore = getScore(game.dealer.cards);
  }

  if (dealerScore > 21) {
    await publish("bust.dealer", game.gameId);
  }

  const turns = game.seats.flatMap((p, seat) =>
    p.deck.map((d, deck) => ({ ...d, playerId: p.playerId, seat, deck }))
  );

  for (const turn of turns.filter((turn) => !turn.busted)) {
    const playerScore = getScore(turn.cards);

    let result: "win" | "tie" | "lose";

    if (dealerScore > 21 || playerScore > dealerScore) {
      result = "win";
    } else if (playerScore === dealerScore) {
      result = "tie";
    } else {
      result = "lose";
    }

    await publish(result, {
      gameId: game.gameId,
      playerId: turn.playerId,
      seat: turn.seat,
      deck: turn.deck,
    });
  }

  const { remaining } = await deckDraw(game.deckId);
  if (remaining < 150) game.deckId = (await createNewDeck()).deck_id;
  game.endedAt = new Date();
  await setGame(game);
  await publish("ended", game.gameId);
}

async function handleCreated(game: BlackJack, forceLocalShort = false) {
  await publish("created", {
    gameId: game.gameId,
    waitFor: game.startingAt.getTime() - game.createdAt.getTime(),
    seats: game.seats,
  });

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
      delay: (game.startingAt.getTime() - Date.now()) / 1000 - 4, // -4 for qstash spin up delay
      body: superjson.stringify(game.gameId satisfies z.input<typeof gameId>),
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function backgroundTask(game: BlackJack) {
  await waitFor(game.startingAt.getTime() - Date.now()).promise;
  game = (await getGame()) as BlackJack;
  if (!game) throw new Error("Game not found");
  if (!game.seats.length) throw new Error("No player on Blackjack game");

  await publish("started", game.gameId);
  const { cards } = await deckDraw(game.deckId, game.seats.length * 2 + 2);

  for (const [seat, player] of game.seats.entries()) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = cards.shift()!;
    player.deck[0]?.cards.push(card);
    await setGame(game);
    await publish("draw", {
      gameId: game.gameId,
      playerId: player.playerId,
      card,
      seat,
      deck: 0,
    });
  }

  {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = { ...cards.shift()!, hidden: false };
    game.dealer.cards.push(card);
    await setGame(game);
    await publish("draw.dealer", { gameId: game.gameId, card });
  }

  for (const [seat, player] of game.seats.entries()) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = cards.shift()!;
    player.deck[0]?.cards.push(card);
    await setGame(game);
    await publish("draw", {
      gameId: game.gameId,
      playerId: player.playerId,
      card,
      seat,
      deck: 0,
    });
  }

  {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const card = { ...cards.shift()!, hidden: true };
    game.dealer.cards.push(card);
    await setGame(game);
    await publish("draw.dealer", { gameId: game.gameId, card: null });
  }

  let playerCards;

  do {
    game.turn = nextTurn(game);
    playerCards = game.seats.find((p) => p.playerId === game.turn.playerId)
      ?.deck[0]?.cards;
  } while (getScore(playerCards) == 21);
  await setGame(game);
  await publish("turn", { gameId: game.gameId, ...game.turn });

  if (game.turn.playerId === "dealer") await playAsDealer(game);
}
