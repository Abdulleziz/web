import { createTRPCRouter } from "~/server/api/trpc";
import { forumRouter } from "~/server/api/routers/forum";
import { discordRouter } from "./routers/discord";
import { cronRouter } from "./routers/cron";
import { paymentsRouter } from "./routers/payments";
import { consumableRouter } from "./routers/consumable";
import { profilesRouter } from "./routers/profiles";
import { notificationsRouter } from "./routers/notifications";
import { bankRouter } from "./routers/bank";
import { emergenciesRouter } from "./routers/discord/emergency";
import { qstashRouter } from "./routers/qstash";
import { gambleRouter } from "./routers/gamble";

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
  profile: profilesRouter,
  consumable: consumableRouter,
  notifications: notificationsRouter,
  bank: bankRouter,
  emergency: emergenciesRouter,
  qstash: qstashRouter,
  gamble: gambleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
