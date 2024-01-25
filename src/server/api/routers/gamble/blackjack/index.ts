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
import { TransferMoney, waitFor } from "~/utils/shared";
import { deckDraw, deckNewShuffle, getScore } from "./api";
import { type BlackJack, type Events } from "./types";
import { calculateWallet } from "../../payments/utils";
import { prisma } from "~/server/db";

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
        bet: bet?.amount,
      })),
    })),
  };
}

export type PublicBlackJack = NonNullable<ReturnType<typeof gameAsPublic>>;

export const INTERNAL_CHANNEL = "gamble-internal:blackjack";
export const PUBLIC_CHANNEL = "gamble:blackjack";
export const MAX_SEAT_COUNT = 7;

// if we are low on qstash limit, we can use forceShort & await on vercel
const JOIN_WAIT = (forceShort = false) =>
  (env.NEXT_PUBLIC_VERCEL_ENV === "development" || forceShort ? 6 : 15) * 1000;

async function getGame() {
  const channel = ablyRest.channels.get(INTERNAL_CHANNEL);
  const message = await channel.history({ limit: 1 });
  const data: unknown = message.items[0]?.data;
  if (!data) return null;
  return superjson.parse<BlackJack>(data as string);
}

async function getGameWithId(gameId: string) {
  const game = await getGame();
  if (!game) throw new TRPCError({ code: "NOT_FOUND" });
  if (game.gameId !== gameId)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `gameId mismatch, curr=${game.gameId}`,
    });

  return game;
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
const bet = TransferMoney.or(z.literal(0));
const insertBet = z.object({ gameId, bet });

export const blackJackRouter = createTRPCRouter({
  state: protectedProcedure.query(async () => gameAsPublic(await getGame())),
  start: qstashProcedure.input(gameId).mutation(async ({ input }) => {
    const game = await getGameWithId(input);
    if (game.startingAt < new Date() || game.endedAt) {
      console.warn(`Blackjack Game (${game.gameId}) already started or ended`);
      console.debug({ game });
      return;
    }
    await backgroundTask(game); // since there is wait time, we can just call it (we must await on vercel)
  }),
  insertBet: protectedProcedure
    .input(insertBet)
    .mutation(async ({ ctx, input: { gameId, bet } }) => {
      const playerId = ctx.session.user.id;
      const game = await getGameWithId(gameId);

      if (game.startingAt < new Date() || game.endedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game already started or ended",
        });

      // TODO: seat index instead of first seat
      const seat = game.seats.find((p) => p.playerId === playerId);
      if (!seat)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Oyuna dahil değilsin",
        });

      if (seat.ready)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Oyuncu hazır",
        });

      const deck = seat.deck[0];
      if (!deck) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { balance } = await calculateWallet(playerId);
      if (balance < bet)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Yetersiz bakiye",
        });

      if (deck.bet) {
        if (deck.bet.amount === bet)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Same bet" });

        if (bet === 0) deck.bet = undefined;
        else deck.bet.amount = bet;
      } else if (bet !== 0) deck.bet = { amount: bet };

      await setGame(game);
      await publish("bet", { gameId, playerId, bet });
    }),
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

    await handleNextTurn(game);
    if (game.turn.playerId === "dealer") await playAsDealer(game);
  }),
  _delete: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session.user.discordId !== "223071656510357504")
      throw new TRPCError({ code: "BAD_REQUEST" });

    await setGame(null);
    await publish("ended", null);
  }),
  join: protectedProcedure
    .input(bet.optional())
    .mutation(async ({ ctx, input: bet }) => {
      let blackJack = await getGame();

      if (blackJack && blackJack.startingAt < new Date() && !blackJack.endedAt)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game already started",
        });

      const { balance } = await calculateWallet(ctx.session.user.id);
      const betAmount = Math.min(bet || 0, balance);

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
              deck: [
                {
                  cards: [],
                  busted: false,
                  bet: betAmount > 0 ? { amount: betAmount } : undefined,
                },
              ],
            },
          ],
          turn: { playerId: "dealer", seat: 0, deck: 0 },
        };
        await setGame(blackJack);

        await handleCreated(blackJack);
      } else {
        blackJack.seats.push({
          playerId: ctx.session.user.id,
          deck: [
            {
              cards: [],
              busted: false,
              bet: betAmount > 0 ? { amount: betAmount } : undefined,
            },
          ],
        });
        await setGame(blackJack);

        await publish("joined", {
          gameId: blackJack.gameId,
          playerId: ctx.session.user.id,
        });
      }
    }),
  ready: protectedProcedure.mutation(async ({ ctx }) => {
    const game = await getGame();

    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.startingAt < new Date() || game.endedAt)
      throw new TRPCError({ code: "BAD_REQUEST" });

    const seat = game.seats.find((p) => p.playerId === ctx.session.user.id);
    if (!seat) throw new TRPCError({ code: "FORBIDDEN" });

    if (seat.ready) throw new TRPCError({ code: "BAD_REQUEST" });
    seat.ready = true;

    if (game.seats.every((p) => p.ready)) {
      // TODO: delete qstash message
      game.startingAt = new Date();
      if (env.NEXT_PUBLIC_VERCEL_ENV === "development")
        // there is no way to cancel void promise, we cannot early start.
        throw new TRPCError({
          code: "METHOD_NOT_SUPPORTED",
          message: "early start is not supported on development env",
        });
      await setGame(game);
      await backgroundTask(game);
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

      await publish("bust", { gameId: game.gameId, ...bustTurn });
      await handleNextTurn(game);
    } else if (getScore(deck.cards) === 21) {
      await handleNextTurn(game);
    }

    if (game.turn.playerId === "dealer") await playAsDealer(game);
  }),
  stand: protectedProcedure.mutation(async ({ ctx }) => {
    const playerId = ctx.session.user.id;

    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.turn.playerId !== playerId)
      throw new TRPCError({ code: "BAD_REQUEST" });

    await handleNextTurn(game);

    if (game.turn.playerId === "dealer") await playAsDealer(game);
  }),
  split: protectedProcedure.mutation(async ({ ctx }) => {
    const playerId = ctx.session.user.id;

    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.turn.playerId !== playerId)
      throw new TRPCError({ code: "BAD_REQUEST" });

    const seat = currentPlayerSeat(game);
    const deck = currentPlayerDeck(game);

    if (
      deck.cards.length !== 2 ||
      getScore(deck.cards.slice(0, 1)) !== getScore(deck.cards.slice(1, 2))
    )
      throw new TRPCError({ code: "BAD_REQUEST", message: "Geçersiz split" });

    const { balance } = await calculateWallet(playerId);

    let splitBet;
    if (deck.bet) {
      if (balance < deck.bet.amount)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Yetersiz bakiye",
        });

      const { id } = await prisma.gambleResult.create({
        data: {
          transaction: {
            create: {
              operation: "deposit",
              amount: deck.bet.amount,
              referenceId: playerId,
            },
          },
        },
        select: { id: true },
      });

      splitBet = { id, amount: deck.bet.amount };
    }

    seat.deck.push({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      cards: [deck.cards.pop()!],
      busted: false,
      bet: splitBet,
    });

    await setGame(game);
    await publish("split", { gameId: game.gameId, ...game.turn });

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

function currentPlayerSeat(game: BlackJack) {
  const seat = game.seats[game.turn.seat];
  if (!seat) throw new Error("Seat not found");
  return seat;
}

function currentPlayerDeck(game: BlackJack) {
  const deck = currentPlayerSeat(game).deck[game.turn.deck];
  if (!deck) throw new Error("Deck not found");
  return deck;
}

async function handleNextTurn(game: BlackJack) {
  game.turn = nextTurn(game);
  let publishDraw;
  if (game.turn.playerId !== "dealer") {
    const deck = currentPlayerDeck(game);
    if (deck.cards.length < 2) {
      const { cards } = await deckDraw(game.deckId, 1);
      console.error("handleNextTurn", { cards });
      deck.cards.push(cards[0]);
      publishDraw = publish("draw", {
        gameId: game.gameId,
        playerId: game.turn.playerId,
        card: cards[0],
        seat: game.turn.seat,
        deck: game.turn.deck,
      });
    }
  }
  if (publishDraw) await publishDraw;
  await setGame(game);
  await publish("turn", { gameId: game.gameId, ...game.turn });
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
      // TODO: blackjack win 1.25x
    } else if (playerScore === dealerScore) {
      result = "tie";
    } else {
      result = "lose";
    }

    if (turn.bet) {
      if (!turn.bet.id) throw new Error("Bet id not found");

      if (result === "win")
        await prisma.gambleResult.update({
          where: { id: turn.bet.id },
          data: { transaction: { update: { operation: "withdraw" } } },
        });
      else if (result === "tie")
        await prisma.bankTransaction.deleteMany({
          where: { gamble: { id: turn.bet.id } },
        });
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const blackJack = gameAsPublic(game)!;
  await publish("created", {
    gameId: blackJack.gameId,
    waitFor: blackJack.startingAt.getTime() - blackJack.createdAt.getTime(),
    seats: blackJack.seats,
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
  await handleBetsCreated(game);

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

async function handleBetsCreated(game: BlackJack) {
  const turns = game.seats.flatMap((p, seat) =>
    p.deck.map((d, deck) => ({ ...d, playerId: p.playerId, seat, deck }))
  );

  try {
    await prisma.$transaction(async (prisma) => {
      for (const turn of turns) {
        if (!turn.bet?.amount) continue;
        const { id } = await prisma.gambleResult.create({
          data: {
            transaction: {
              create: {
                operation: "deposit",
                amount: turn.bet.amount,
                referenceId: turn.playerId,
              },
            },
          },
          select: { id: true },
        });
        turn.bet.id = id;
      }
    });
  } catch (error) {
    console.error("Bets are not created: ", error);
    await setGame(null);
    await publish("ended", null);
    throw error;
  }
}
