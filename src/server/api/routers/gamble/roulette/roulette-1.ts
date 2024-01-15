import { waitFor } from "~/utils/shared";
import { createTRPCRouter, protectedProcedure } from "../../../trpc";
import { env } from "~/env.mjs";
import { TRPCError } from "@trpc/server";
import { ablyRest } from "~/server/ably";

type Roulette = { gameId: string; startedAt: Date; players: string[] } & (
  | {
      resultIndex: undefined;
      options: undefined;
      endedAt: undefined;
    }
  | {
      options: { option: string }[];
      resultIndex: number;
      endedAt: Date;
    }
);

let game: Roulette | null = null;

export const rouletteRouter = createTRPCRouter({
  state: protectedProcedure.query(() => game),
  join: protectedProcedure.mutation(({ ctx }) => {
    if (env.NEXT_PUBLIC_VERCEL_ENV !== "development")
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Sadece Development ortamında çalışır",
      });

    if (!game || (game && game.endedAt)) {
      game = {
        gameId: game?.gameId ? String(Number(game.gameId) + 1) : "1",
        startedAt: new Date(),
        players: [ctx.session.user.id],
      } as Roulette;
    } else {
      if (game.players.includes(ctx.session.user.id))
        throw new TRPCError({ code: "BAD_REQUEST", message: "already joined" });
      game.players.push(ctx.session.user.id);
    }

    console.log("game started");
    const channel = ctx.ablyRest.channels.get("gamble:roulette-1");

    void channel.publish("started", game.gameId);
    void backgroundTask();
  }),
});

async function backgroundTask() {
  await waitFor(10000).promise;
  const channel = ablyRest.channels.get("gamble:roulette-1");
  const game = endRoulette();
  await channel.publish("done", game.gameId);
  console.log("game ended");
}

function endRoulette() {
  if (!game) throw new Error("game not started");
  game.endedAt = new Date();
  (game.options = Array.from({ length: 12 }, () => ({
    option: String(Math.floor(Math.random() * 100)),
  }))),
    (game.resultIndex = Math.floor(Math.random() * game.options.length));
  return game;
}
