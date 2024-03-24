import { createTRPCRouter } from "../../trpc";
import { blackJackRouter } from "./blackjack";
import { rouletteRouter } from "./roulette";

export const gambleRouter = createTRPCRouter({
  roulette: rouletteRouter,
  blackjack: blackJackRouter,
});
