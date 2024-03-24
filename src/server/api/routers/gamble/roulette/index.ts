import { createTRPCRouter } from "../../../trpc";
import { rouletteWheelRouter } from "./wheel";
import { rouletteClassicalRouter } from "./classical";

export const rouletteRouter = createTRPCRouter({
  wheel: rouletteWheelRouter,
  classical: rouletteClassicalRouter,
});
