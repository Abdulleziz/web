import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
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

export const blackJackRouter = createTRPCRouter({
  state: protectedProcedure.query(async () => gameAsPublic(await getGame())),
  _delete: protectedProcedure.mutation(async () => {
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

    const { deck_id } = await deckNewShuffle(6);

    blackJack = {
      gameId: "blackjack-" + Math.random().toString(36).slice(2),
      deckId: deck_id,
      createdAt: new Date(),
      startingAt: new Date(Date.now() + 1000 * 6),
      dealer: { cards: [] },
      players: {
        [ctx.session.user.id]: { cards: [], busted: false },
      },
      turn: "dealer",
    };
    await setGame(blackJack);

    await announceCreated(blackJack);
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
      await channel.publish(`draw.${playerId}`, game.gameId);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const player = game.players[playerId]!;

    if (getScore(player.cards) > 21) {
      player.busted = true;
      game.turn = nextTurn(game);
      await setGame(game);
      await channel.publish(`bust.${playerId}`, game.gameId);
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
  const players = Object.keys(game.players).concat("dealer");
  const playerIndex = players.indexOf(game.turn);
  const nextTurn = players[playerIndex + 1];
  return nextTurn || "dealer";
}

async function playAsDealer(game: BlackJack) {
  const channel = ablyRest.channels.get("gamble:blackjack");
  if (game.turn !== "dealer") throw new Error("Not dealer turn");

  const hiddenCard = game.dealer.cards[1];
  if (!hiddenCard) throw new Error("Dealer has no cards");
  hiddenCard.hidden = false;
  await setGame(game);
  await channel.publish("show.dealer", game.gameId);

  let dealerScore = getScore(game.dealer.cards);

  while (dealerScore < 17) {
    const { cards } = await deckDraw(game.deckId, 1);
    game.dealer.cards.push({ ...cards[0], hidden: false });
    await setGame(game);
    await channel.publish("draw.dealer", game.gameId);
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

async function announceCreated(game: BlackJack) {
  const channel = ablyRest.channels.get("gamble:blackjack");
  await channel.publish("created", game.gameId);
  await backgroundTask(game);
}

async function backgroundTask(game: BlackJack) {
  await waitFor(game.startingAt.getTime() - Date.now()).promise;
  const players = Object.keys(game.players);
  const player_ = players[0];
  if (!player_) throw new Error("No player on Blackjack game");
  // TODO: on player leave, cancel task or handle it

  const channel = ablyRest.channels.get("gamble:blackjack");
  await channel.publish("started", game.gameId); // race condition (join/card draw)
  const { cards } = await deckDraw(game.deckId, players.length * 2 + 2);

  for (const player of players) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    game.players[player]?.cards.push(cards.shift()!);
    await setGame(game);
    await channel.publish(`draw.${player}`, game.gameId);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  game.dealer.cards.push({ ...cards.shift()!, hidden: false });
  await setGame(game);
  await channel.publish("draw.dealer", game.gameId);

  for (const player of players) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    game.players[player]?.cards.push(cards.shift()!);
    await setGame(game);
    await channel.publish(`draw.${player}`, game.gameId);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  game.dealer.cards.push({ ...cards.shift()!, hidden: true });
  await setGame(game);
  await channel.publish("draw.dealer", game.gameId);

  game.turn = player_;
  await setGame(game);
  await channel.publish(`turn.${player_}`, game.gameId);
}
