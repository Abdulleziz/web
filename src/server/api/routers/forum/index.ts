import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { nonEmptyString, ThreadId } from "~/utils/zod-utils";
import { forumPostsRouter } from "./posts";

export const forumRouter = createTRPCRouter({
  posts: forumPostsRouter,
  getThreads: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.forumThread.findMany({
      include: { creator: true, posts: true, tags: true },
    });
  }),
  getThreadById: protectedProcedure
    .input(ThreadId)
    .query(({ ctx, input: id }) => {
      return ctx.prisma.forumThread.findUnique({
        where: { id },
        include: {
          creator: true,
          posts: { include: { creator: true } },
          tags: true,
        },
      });
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
