import { type PublicBlackJack } from "~/server/api/routers/gamble/blackjack";
import { type BlackJack } from "~/server/api/routers/gamble/blackjack/types";

export const MAX_SEAT_COUNT = 7;

export function currentPlayerSeat<Game extends BlackJack | PublicBlackJack>(
  game: Game
): Game["seats"][number] {
  const seat = game.seats[game.turn.seat];
  if (!seat) throw new Error("Seat not found");
  return seat;
}

export function currentPlayerDeck<Game extends BlackJack | PublicBlackJack>(
  game: Game
): Game["seats"][number]["deck"][number] {
  const deck = currentPlayerSeat(game).deck[game.turn.deck];
  if (!deck) throw new Error("Deck not found");
  return deck;
}
