import { TRPCError } from "@trpc/server";
import { Client } from "@upstash/qstash/nodejs";
import { z } from "zod";
import { env } from "~/env.mjs";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cronRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const crons = await ctx.prisma.cronJob.findMany({
      where: {
        AND: [
          { listeners: { some: { listenerId: ctx.session.user.id } } },
          { isGlobal: true },
        ],
      },
      include: { listeners: { include: { listener: true } } },
    });
    return crons;
  }),
  create: protectedProcedure
    .input(
      z.object({
        cron: z.string(),
        title: z.string(),
        isGlobal: z.literal(false).default(false),
      })
    )
    .mutation(async ({ ctx, input: { cron, title, isGlobal } }) => {
      if (env.NODE_ENV !== "production")
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cron is disabled in development",
        });

      const count = await ctx.prisma.cronListener.count({
        where: { listenerId: ctx.session.user.id },
      });
      if (count >= 5)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "You can only listen to 5 crons",
        });

      const dbCron = await ctx.prisma.cronJob.findUnique({
        where: { cron },
        select: { listeners: { select: { listenerId: true } } },
      });

      if (dbCron?.listeners.find((l) => l.listenerId === ctx.session.user.id))
        throw new Error("You are already listening that cron");

      if (dbCron)
        return await ctx.prisma.cronJob.update({
          where: { cron },
          data: {
            listeners: {
              connect: { id: ctx.session.user.id },
            },
          },
        });

      const c = new Client({ token: env.QSTASH_TOKEN });
      const res = await c.publishJSON({
        url: env.NEXTAUTH_URL + "/api/cron",
        cron,
        body: { cron },
      });

      await ctx.prisma.cronJob.create({
        data: {
          cron,
          title,
          isGlobal,
          jobId: res.scheduleId,
          listeners: {
            create: {
              listener: { connect: { id: ctx.session.user.id } },
            },
          },
        },
      });
    }),
});
