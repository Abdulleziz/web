import { TRPCError } from "@trpc/server";
import superjson from "superjson";
import { env } from "~/env.mjs";
import { ablyRest } from "~/server/ably";
import { waitFor } from "~/utils/shared";
import {
  createTRPCRouter,
  protectedProcedure,
  qstashProcedure,
} from "../../../trpc";
import { Client } from "@upstash/qstash";
import { getDomainUrl } from "~/utils/api";
import { z } from "zod";
import { type Wheel } from "./types";

type WheelRoulette = Wheel;

const WAIT_DURATION = 10_000;
const INTERNAL_CHANNEL = "gamble-internal:roulette-wheel";
const PUBLIC_CHANNEL = "gamble:roulette-wheel";

async function getGame() {
  const channel = ablyRest.channels.get(INTERNAL_CHANNEL);
  const message = await channel.history({ limit: 1 });
  const data: unknown = message.items[0]?.data;
  if (!data) return null;
  return superjson.parse<WheelRoulette>(data as string);
}

async function setGame(game: WheelRoulette | null) {
  const channel = ablyRest.channels.get(INTERNAL_CHANNEL);
  await channel.publish("update", game && superjson.stringify(game));
}

const startSchema = z.string().min(1); // gameId

export const rouletteWheelRouter = createTRPCRouter({
  state: protectedProcedure.query(async () => await getGame()),
  start: qstashProcedure.input(startSchema).mutation(async ({ input }) => {
    const game = await getGame();
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    if (game.gameId !== input) throw new TRPCError({ code: "BAD_REQUEST" });

    await backgroundTask(game); // since there is wait time, we can just call it (we must await on vercel)
  }),
  join: protectedProcedure.mutation(async ({ ctx }) => {
    let game = await getGame();

    const channel = ctx.ablyRest.channels.get(PUBLIC_CHANNEL);

    if (!game || (game && game.endedAt)) {
      game = {
        gameId: game?.gameId ? String(Number(game.gameId) + 1) : "1",
        createdAt: new Date(),
        players: [ctx.session.user.id],
      } as WheelRoulette;
      await setGame(game);

      await handleCreated(game);
    } else {
      if (game.players.includes(ctx.session.user.id))
        throw new TRPCError({ code: "BAD_REQUEST", message: "already joined" });
      game.players.push(ctx.session.user.id);
      await setGame(game);

      await channel.publish(
        "joined",
        superjson.stringify({
          gameId: game.gameId,
          userId: ctx.session.user.id,
        })
      );
    }
  }),
});

async function handleCreated(game: WheelRoulette) {
  const channel = ablyRest.channels.get(PUBLIC_CHANNEL);
  await channel.publish("created", game.gameId);

  if (env.NEXT_PUBLIC_VERCEL_ENV === "development") {
    // local pc, wait for task instead of qstash
    void backgroundTask(game);
  } else {
    // vercel, use qstash
    const c = new Client({ token: env.QSTASH_TOKEN });
    const url = getDomainUrl() + "/api/trpc/gamble.roulette.wheel.start";
    await c.publish({
      url,
      delay: WAIT_DURATION / 1000 - 4, // 4 seconds for qstash delay
      body: superjson.stringify(
        game.gameId satisfies z.input<typeof startSchema>
      ),
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function backgroundTask(game: WheelRoulette) {
  await waitFor(game.createdAt.getTime() + WAIT_DURATION - Date.now()).promise;
  const channel = ablyRest.channels.get(PUBLIC_CHANNEL);
  game = await endRoulette();
  await channel.publish("done", game.gameId);
  console.log("roulette game ended");
}

async function endRoulette() {
  const game = await getGame();
  if (!game) throw new Error("game not created yet");
  game.endedAt = new Date();
  (game.options = Array.from({ length: 12 }, () => ({
    option: String(Math.floor(Math.random() * 100)),
  }))),
    (game.resultIndex = Math.floor(Math.random() * game.options.length));

  await setGame(game);
  return game;
}
