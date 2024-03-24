import { type ConstructTuple } from "~/utils/zod-utils";

const HOST = "https://deckofcardsapi.com";

export const CARD_BACK = `${HOST}/static/img/back.png`;

export const cardImage = (codeOrHidden: { code: string } | { hidden: true }) =>
  `${HOST}/static/img/${
    "code" in codeOrHidden ? codeOrHidden.code : "back"
  }.png`;

export type Card = {
  // image: string; // https://deckofcardsapi.com/static/img/5S.png
  // images: { svg: string; png: string }[]; //{ "svg": "https://deckofcardsapi.com/static/img/6H.svg", "png": "https://deckofcardsapi.com/static/img/6H.png"}
  value:
    | "ACE"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "0"
    | "JACK"
    | "QUEEN"
    | "KING";
  suit: "SPADES" | "HEARTS" | "DIAMONDS" | "CLUBS";
  code: string; // 6H, 0D, AS, KC
};

export function deckNewShuffle(deck_count = 1) {
  return fetch(`${HOST}/api/deck/new/shuffle/?deck_count=${deck_count}`).then(
    (response) =>
      response.json() as Promise<{
        success: true;
        deck_id: string;
        shuffled: true;
        remaining: number;
      }>
  );
}

export function deckDraw<TLen extends number = 1>(
  deckId: string,
  count?: TLen
): Promise<{
  success: true;
  deck_id: string;
  cards: ConstructTuple<Card, TLen>;
  remaining: number;
}>;

export function deckDraw<TLen extends number>(
  deckId: string,
  count: TLen = 1 as TLen
) {
  return fetch(`${HOST}/api/deck/${deckId}/draw/?count=${count}`)
    .then(
      (response) =>
        response.json() as Promise<{
          success: true;
          deck_id: string;
          cards: (Card & {
            image?: string;
            images?: { svg: string; png: string }[];
          })[];
          remaining: number;
        }>
    )
    .then((data) => {
      data.cards.forEach((card) => {
        delete card.image;
        delete card.images;
      });
      return data;
    });
}

/**
 * Don't throw away a deck when all you want to do is shuffle. Include the deck_id on your call to shuffle your cards. Don't worry about reminding us how many decks you are playing with. Adding the remaining=true parameter will only shuffle those cards remaining in the main stack, leaving any piles or drawn cards alone.
 */
export function deckReShuffle(deckId: string, remaining: boolean) {
  return fetch(
    `${HOST}/api/deck/${deckId}/shuffle/?remaining=${String(remaining)}`
  ).then(
    (response) =>
      response.json() as Promise<{
        success: true;
        deck_id: string;
        shuffled: true;
        remaining: number;
      }>
  );
}

export function deckNew() {
  return fetch(`${HOST}/api/deck/new/`).then(
    (response) =>
      response.json() as Promise<{
        success: true;
        deck_id: string;
        shuffled: false;
        remaining: number;
      }>
  );
}

export function listCardsInPile(deckId: string, pileName: string) {
  return fetch(`${HOST}/api/deck/${deckId}/pile/${pileName}/list/`).then(
    (response) =>
      response.json() as Promise<{
        success: true;
        deck_id: string;
        remaining: number;
        piles: Record<string, { remaining: number; cards?: Card[] }>;
      }>
  );
}

export function returnCardToDeck(deckId: string, cards?: Card[]) {
  const url = new URL(`${HOST}/api/deck/${deckId}/return/`);
  if (cards)
    url.searchParams.append("cards", cards.map((card) => card.code).join(","));
  return fetch(url.toString()).then(
    (response) =>
      response.json() as Promise<{
        success: true;
        deck_id: string;
        remaining: number;
      }>
  );
}

export function drawPileBottom(deckId: string) {
  return fetch(`${HOST}/api/deck/${deckId}/draw/bottom/`).then(
    (response) =>
      response.json() as Promise<{
        success: true;
        deck_id: string;
        cards: Card[];
        piles: { discard: { remaining: number; cards?: Card[] } };
        remaining: number;
      }>
  );
}

export function getScore(cards?: Card[]) {
  if (!cards) return 0;
  return (
    [...cards]
      // NOTE: toSorted supported in node 20+
      .sort((_, b) => (b.value === "ACE" ? -1 : 0)) // calculate aces last
      .reduce((score, card) => {
        if (
          card.value === "JACK" ||
          card.value === "QUEEN" ||
          card.value === "KING"
        )
          return score + 10;
        if (card.value === "ACE") return score < 11 ? score + 11 : score + 1;
        return score + Number(card.value);
      }, 0)
  );
}
