import { createTRPCRouter } from "~/server/api/trpc";
import { forumRouter } from "~/server/api/routers/forum";
import { discordRouter } from "./routers/discord";
import { cronRouter } from "./routers/cron";
import { paymentsRouter } from "./routers/payments";
import { consumableRouter } from "./routers/consumable";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  forum: forumRouter,
  discord: discordRouter,
  cron: cronRouter,
  payments: paymentsRouter,
  consumable: consumableRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
