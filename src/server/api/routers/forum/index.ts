import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { nonEmptyString, ThreadId } from "~/utils/zod-utils";
import { forumPostsRouter } from "./posts";

const managePinsProcedure = createPermissionProcedure(["forum thread pinle"]);

export const forumRouter = createTRPCRouter({
  posts: forumPostsRouter,
  getThreads: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.forumThread.findMany({
      include: {
        creator: true,
        tags: true,
        pin: { include: { pinnedBy: true } },
      },
    });
  }),
  getThreadById: protectedProcedure
    .input(ThreadId)
    .query(({ ctx, input: id }) => {
      return ctx.prisma.forumThread.findUnique({
        where: { id },
        include: { creator: true, tags: true },
      });
    }),
  createPin: managePinsProcedure
    .input(ThreadId)
    .mutation(async ({ ctx, input: id }) => {
      const MAX_PIN = 3;
      const pins = await ctx.prisma.forumPin.count();
      if (pins >= MAX_PIN)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `You can only pin ${MAX_PIN} threads at a time.`,
        });

      await ctx.prisma.forumPin.create({
        data: {
          thread: { connect: { id } },
          pinnedBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),
  deletePin: managePinsProcedure
    .input(ThreadId)
    .mutation(({ ctx, input: id }) => {
      return ctx.prisma.forumPin.delete({ where: { id } });
    }),
  createThread: protectedProcedure
    .input(
      z.object({
        title: nonEmptyString,
        tags: nonEmptyString.array(),
        message: nonEmptyString,
      })
    )
    .mutation(({ ctx, input: { title, tags, message } }) => {
      return ctx.prisma.forumThread.create({
        data: {
          title,
          tags: {
            connectOrCreate: tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
          creator: {
            connect: { id: ctx.session.user.id },
          },
          posts: {
            create: {
              message,
              creator: { connect: { id: ctx.session.user.id } },
            },
          },
        },
      });
    }),
  deleteThreadById: protectedProcedure
    .input(ThreadId)
    .mutation(({ ctx, input: id }) => {
      return ctx.prisma.forumThread.delete({
        where: { id },
      });
    }),
});
