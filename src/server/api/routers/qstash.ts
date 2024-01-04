import { z } from "zod";
import { createTRPCRouter, qstashProcedure } from "../trpc";

export const qstashRouter = createTRPCRouter({
  test: qstashProcedure.input(z.number()).mutation(({ input }) => {
    // body: { json: 3 } -> input = 3
    console.warn("qstash", { input });
  }),
});
