import { TRPCError } from "@trpc/server";
import { utapi } from "uploadthing/server";
import { z } from "zod";
import { env } from "~/env.mjs";
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { UserId } from "~/utils/zod-utils";
import { getForumNotificationListeners } from "./trpc";
import { PostId, ThreadId, ThreadMessage } from "./types";
import { notificationMessage } from "~/utils/forumThread";

export const forumPostsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        threadId: ThreadId,
        cursor: PostId.optional(),
        limit: z.number().min(1).max(25).default(10),
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
  create: permissionProcedure
    .input(
      z.object({
        threadId: ThreadId,
        message: ThreadMessage,
        mentions: UserId.array().default([]),
      })
    )
    .mutation(async ({ ctx, input: { threadId, message, mentions } }) => {
      const post = await ctx.prisma.$transaction(async (prisma) => {
        const thread = await prisma.forumThread.findUnique({
          where: { id: threadId },
          select: { locked: true },
        });
        if (!thread)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Thread bulunamadı!",
          });

        if (
          thread.locked &&
          !ctx.verifiedPerms.includes("forum thread kilitle")
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Thread kilitli!",
          });
        return await prisma.forumPost.create({
          data: {
            message,
            thread: { connect: { id: threadId } },
            creator: { connect: { id: ctx.session.user.id } },
          },
          include: {
            thread: {
              select: { title: true, notifications: true, defaultNotify: true },
            },
          },
        });
      });
      const notifyUsers = await getForumNotificationListeners(
        ctx.prisma,
        mentions,
        post.thread
      );
      await ctx.sendNotification(
        notifyUsers,
        {
          title: `Yeni Mesaj: ${post.thread.title.slice(0, 50)}`,
          body: notificationMessage(
            `${ctx.session.user.name ?? ""}: ${message}`,
            { slice: 130 }
          ),
          tag: `new-thread-post-${post.id}`,
          icon: ctx.session.user.image ?? undefined,
          actions: [{ action: `/forum/threads/${threadId}`, title: "Git" }],
        },
        { TTL: env.NEXT_PUBLIC_VERCEL_ENV !== "production" ? 300 : undefined }
      );
      return post;
    }),
  deleteAttachments: protectedProcedure
    .input(z.object({ fileKeys: z.array(z.string()) }))
    .mutation(async ({ input: { fileKeys: attachments } }) => {
      const { success } = await utapi.deleteFiles(attachments);
      if (!success)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Thread Post dosya ekleri silinemedi!",
        });
    }),
  deleteById: protectedProcedure
    .input(PostId)
    .mutation(async ({ ctx, input: id }) => {
      const post = await ctx.prisma.forumPost.findUnique({
        where: { id },
        select: {
          createdAt: true,
          creatorId: true,
          thread: { select: { notifications: true, defaultNotify: true } },
        },
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
 