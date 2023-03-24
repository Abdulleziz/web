import { TRPCError } from "@trpc/server";
import { Client } from "@upstash/qstash/nodejs";
import { z } from "zod";
import { env } from "~/env.mjs";
import { nonEmptyString } from "~/utils/zod-utils";
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
  leave: protectedProcedure
    .input(nonEmptyString)
    .mutation(async ({ ctx, input: cron }) => {
      const dbCron = await ctx.prisma.cronJob.findUnique({
        where: { cron },
        select: { jobId: true, listeners: { select: { listenerId: true } } },
      });
      if (!dbCron) throw new TRPCError({ code: "NOT_FOUND" });
      if (!dbCron.listeners.find((l) => l.listenerId === ctx.session.user.id))
        throw new TRPCError({ code: "FORBIDDEN" });
      if (dbCron.listeners.length === 1) {
        const c = new Client({ token: env.QSTASH_TOKEN });
        await c.schedules.delete({ id: dbCron.jobId });
        return await ctx.prisma.cronJob.delete({ where: { cron } });
      }
      return await ctx.prisma.cronJob.update({
        where: { cron },
        data: {
          listeners: {
            disconnect: { id: ctx.session.user.id },
          },
        },
      });
    }),
  createOrJoin: protectedProcedure
    .input(
      z.object({
        cron: nonEmptyString,
        title: nonEmptyString,
        isGlobal: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input: { cron, title, isGlobal } }) => {
      if (env.NODE_ENV !== "production")
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cron is disabled in development",
        });

      const LIMIT = 10;
      const count = await ctx.prisma.cronListener.count({
        where: { listenerId: ctx.session.user.id },
      });
      if (count >= LIMIT)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `You can only listen to ${LIMIT} crons`,
        });

      const dbCron = await ctx.prisma.cronJob.findUnique({
        where: { cron },
        select: { listeners: { select: { listenerId: true } } },
      });

      if (dbCron?.listeners.find((l) => l.listenerId === ctx.session.user.id))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already listening that cron",
        });

      if (dbCron && !isGlobal)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "That cron is taken by someone else, please slightly change the cron",
        });

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
      const url = (process.env.VERCEL ? "https://" : "") + env.NEXTAUTH_URL;

      const res = await c.publishJSON({
        url: url + "/api/cron",
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
