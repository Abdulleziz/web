import { type PublicBlackJack } from ".";
import { type Card } from "./api";

type DealerCard = Card & { hidden: boolean };

type PlayerDeck = {
  cards: Card[];
  busted: boolean;
  bet?: { id?: string; amount: number };
};

/**
 * @internal game type, public data is different!
 * @use RouterOutputs or PublicBlackJack instead
 */
export type BlackJack = {
  gameId: string;
  deckId: string;
  createdAt: Date;
  startingAt: Date;
  dealer: { cards: DealerCard[] };
  seats: [{ playerId: string; deck: PlayerDeck[] }];
  turn: // NOTE: if we remove playerId, how can we check for dealer?
  | { playerId: "dealer"; seat: 0; deck: 0 }
    | { playerId: string; seat: number; deck: number };
  endedAt?: Date;
};

type GameId = BlackJack["gameId"];
type Turn = { gameId: GameId; playerId: string; seat: number; deck: number };

export type Events = {
  win: Turn;
  tie: Turn;
  lose: Turn;
  turn: Turn;
  bust: Turn;
  split: Turn;
  draw: Turn & { card: Card };
  started: GameId;
  ended: GameId | null;
  bet: { gameId: GameId; playerId: string; bet: number };
  joined: { gameId: GameId; playerId: string };
  created: { gameId: GameId; waitFor: number; seats: PublicBlackJack["seats"] };
  "bust.dealer": GameId;
  "draw.dealer": { gameId: GameId; card: Card | null };
  "show.dealer": { gameId: GameId; card: DealerCard };
  "info.newDeck": { gameId?: GameId; deckCount: number; cardCount: number };
};

export type Event<TKey extends keyof Events> = [TKey, Events[TKey]];
