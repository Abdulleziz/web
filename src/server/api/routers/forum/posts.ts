import { z } from "zod";
import { nonEmptyString, PostId, ThreadId } from "~/utils/zod-utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const forumPostsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        threadId: ThreadId,
        message: nonEmptyString,
      })
    )
    .mutation(async ({ ctx, input: { threadId, message } }) => {
      return ctx.prisma.forumPost.create({
        data: {
          message,
          thread: {
            connect: { id: threadId },
          },
          creator: {
            connect: { id: ctx.session.user.id },
          },
        },
      });
    }),
  deletePostById: protectedProcedure
    .input(PostId)
    .mutation(async ({ ctx, input: id }) => {
      return ctx.prisma.forumPost.delete({
        where: { id },
      });
    }),
});
