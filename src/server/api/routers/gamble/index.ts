import { createTRPCRouter } from "../../trpc";
import { blackJackRouter } from "./blackjack";
import { rouletteRouter } from "./roulette/roulette-1";

export const gambleRouter = createTRPCRouter({
  roulette: rouletteRouter,
  blackjack: blackJackRouter,
});
