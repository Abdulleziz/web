import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PushSubscription } from "~/utils/shared";

export const notificationsRouter = createTRPCRouter({
  syncSubscription: protectedProcedure
    .input(PushSubscription)
    .mutation(async ({ ctx, input: push }) => {
      await ctx.prisma.pushSubscription.upsert({
        where: { endpoint: push.endpoint, userId: ctx.session.user.id },
        update: {},
        create: {
          endpoint: push.endpoint,
          p256dh: push.keys.p256dh,
          auth: push.keys.auth,
          userId: ctx.session.user.id,
        },
      });
      // only include last 10 subscriptions for the user
      const include = await ctx.prisma.pushSubscription.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { endpoint: true },
      });
      await ctx.prisma.pushSubscription.deleteMany({
        where: {
          userId: ctx.session.user.id,
          NOT: { endpoint: { in: include.map((s) => s.endpoint) } },
        },
      });
    }),
});
