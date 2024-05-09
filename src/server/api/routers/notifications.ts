import { DiscordId, nonEmptyString } from "~/utils/zod-utils";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PushSubscription } from "~/utils/shared";
import { z } from "zod";
import { connectMembersWithIds } from "~/server/discord-api/utils";

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
    .input(z.object({ lectureName: nonEmptyString, userDiscordIds: DiscordId.array().min(1) }))
    .mutation(async ({ ctx, input: { lectureName, userDiscordIds } }) => {

      const ids = await connectMembersWithIds(ctx.prisma, userDiscordIds.map(id => ({ user: { id } })));
      const subs = await ctx.prisma.pushSubscription.findMany({ where: { userId: { in: ids.map(i => i.id) } } });

      const res = await ctx.sendNotification(subs, ({
        title: "Yoklama Alındı",
        body: `${ctx.session.user.name ?? "Biri"} tarafından ${lectureName} dersine yoklama alındı.`,
      }));
      return res.map((r) =>
        r === undefined ? "errored" : r === "expired" ? r : "success"
      );
    }),
});
