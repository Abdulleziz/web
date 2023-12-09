import { env } from "~/env.mjs";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PushSubscription } from "~/utils/shared";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = createTRPCRouter({
  testSubscriptions: protectedProcedure.mutation(async ({ ctx }) => {
    if (env.NEXT_PUBLIC_VERCEL_ENV === "production")
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Test subscriptions are not allowed in production!",
      });

    const subs = await ctx.prisma.pushSubscription.findMany({
      where: { userId: ctx.session.user.id },
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const res = await ctx.webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                auth: sub.auth,
                p256dh: sub.p256dh,
              },
            },
            JSON.stringify({
              title: "Triggered Notification",
              body: `This notification was triggered by the test subscription from ${
                ctx.session.user.name || "Admin"
              }`,
              icon: "/android-chrome-192x192.png",
            })
          );
          console.log(res);
        } catch (error) {
          console.error(error);
        }
      })
    );
  }),
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
