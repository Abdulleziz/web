import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CARD_BACK, type Card, deckNewShuffle, deckDraw } from "./api";
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
  players: { [playerId: string]: Card[] };
  turn: "dealer" | string;
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
  join: protectedProcedure.mutation(async ({ ctx }) => {
    let blackJack = await getGame();

    if (blackJack && blackJack.startingAt < new Date())
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Game already started",
      });

    const { deck_id } = await deckNewShuffle(6);

    blackJack = {
      gameId: "blackjack-" + Math.random().toString(36).slice(2),
      deckId: deck_id,
      createdAt: new Date(),
      startingAt: new Date(Date.now() + 1000 * 10),
      dealer: { cards: [] },
      players: {
        [ctx.session.user.id]: [],
      },
      turn: "dealer",
    };
    await setGame(blackJack);

    await announceCreated(blackJack);
  }),
  hit: protectedProcedure.mutation(() => ({})),
  stand: protectedProcedure.mutation(() => ({})),
  double: protectedProcedure.mutation(() => ({})),
  deal: protectedProcedure.mutation(() => ({})),
});

async function announceCreated(game: BlackJack) {
  const channel = ablyRest.channels.get("gamble:blackjack");
  await channel.publish("created", game.gameId);
  void backgroundTask(game);
}

async function backgroundTask(game: BlackJack) {
  await waitFor(game.startingAt.getTime() - Date.now()).promise;
  const player_ = Object.keys(game.players)[0];
  if (!player_) throw new Error("No player on Blackjack game");
  // TODO: on player leave, cancel task or handle it

  const channel = ablyRest.channels.get("gamble:blackjack");
  await channel.publish("started", game.gameId); // race condition (join/card draw)
  const { cards } = await deckDraw(game.deckId, 4);
  game.dealer.cards.push({ ...cards[0], hidden: false });
  await setGame(game);
  await channel.publish("draw.dealer", game.gameId);

  game.players[player_]?.push(cards[1]);
  await setGame(game);
  await channel.publish(`draw.${player_}`, game.gameId);

  game.dealer.cards.push({ ...cards[2], hidden: true });
  await setGame(game);
  await channel.publish("draw.dealer", game.gameId);

  game.players[player_]?.push(cards[3]);
  await setGame(game);
  await channel.publish(`draw.${player_}`, game.gameId);

  game.turn = player_;
  await setGame(game);
  await channel.publish(`turn.${player_}`, game.gameId);
}
