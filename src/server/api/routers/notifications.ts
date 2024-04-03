import { nonEmptyString } from "~/utils/zod-utils";
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
  lecturePostJoin: protectedProcedure
    .input(nonEmptyString)
    .mutation(async ({ ctx, input: lectureName }) => {
      // TODO: custom notification for student
      const subs = await ctx.prisma.pushSubscription.findMany();
      const res = await ctx.sendNotification(subs, {
        title: "Yoklama Alındı",
        body: `${lectureName} dersine yoklama alındı.`,
      });
      return res.map((r) =>
        r === undefined ? "errored" : r === "expired" ? r : "success"
      );
    }),
});
