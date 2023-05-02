import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nonEmptyString, PostId, ThreadId } from "~/utils/zod-utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { getEnv } from "~/lib/pusher/notifications";
import { getDomainUrl } from "~/utils/api";

export const forumPostsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        threadId: ThreadId,
        cursor: PostId.optional(),
        limit: z.number().min(1).max(25).default(5),
      })
    )
    .query(async ({ ctx, input: { limit, threadId, cursor } }) => {
      // server side pagination
      // 2000 post varsa database'i ve kullanıcıyı ağlatmayalım 🤣
      const posts = await ctx.prisma.forumPost.findMany({
        where: { threadId },
        include: { creator: true },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });
      const hasNext = posts.length > limit;
      const next = hasNext ? posts.pop()?.id : undefined;
      return { posts, next };
    }),
  create: protectedProcedure
    .input(
      z.object({
        threadId: ThreadId,
        message: nonEmptyString.and(z.string().max(1000)),
      })
    )
    .mutation(async ({ ctx, input: { threadId, message } }) => {
      const post = await ctx.prisma.forumPost.create({
        data: {
          message,
          thread: { connect: { id: threadId } },
          creator: { connect: { id: ctx.session.user.id } },
        },
        include: { thread: { select: { title: true } } },
      });
      await ctx.pushNotification.publishToInterests([`${getEnv()}-all`], {
        web: {
          notification: {
            title: `Yeni Mesaj: ${post.thread.title.slice(0, 50)}`,
            body: `${ctx.session.user.name ?? ""}: ${message.slice(0, 100)}`,
            deep_link: `${getDomainUrl()}/forum/threads/${threadId}`,
            hide_notification_if_site_has_focus: true,
            icon: `${getDomainUrl()}/favicon.ico`,
          },
        },
      });
      return post;
    }),
  deleteById: protectedProcedure
    .input(PostId)
    .mutation(async ({ ctx, input: id }) => {
      const post = await ctx.prisma.forumPost.findUnique({
        where: { id },
        select: { creatorId: true },
      });
      if (!post)
        throw new TRPCError({ code: "NOT_FOUND", message: "Post bulunamadı!" });
      if (post.creatorId !== ctx.session.user.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Post'un sahibi değilsin!",
        });
      return await ctx.prisma.forumPost.delete({ where: { id } });
    }),
});
