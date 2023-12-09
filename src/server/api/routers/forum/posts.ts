import { TRPCError } from "@trpc/server";
import { utapi } from "uploadthing/server";
import { z } from "zod";
import { env } from "~/env.mjs";
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { getDomainUrl } from "~/utils/api";
import { UserId } from "~/utils/zod-utils";
import { getForumNotificationListeners } from "./trpc";
import { PostId, ThreadId, ThreadMessage } from "./types";

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
      // const notifyUsers = await getForumNotificationListeners(
      //   ctx.prisma,
      //   mentions,
      //   post.thread
      // );
      // if (notifyUsers.length > 0)
      //   await ctx.pushNotification.publishToUsers(
      //     notifyUsers.map((u) => u.id),
      //     {
      //       web: {
      //         notification: {
      //           title: `Yeni Mesaj: ${post.thread.title.slice(0, 50)}`,
      //           body: `${ctx.session.user.name ?? ""}: ${message.slice(
      //             0,
      //             100
      //           )}`,
      //           deep_link: `${getDomainUrl()}/forum/threads/${threadId}`,
      //           hide_notification_if_site_has_focus: true,
      //           icon: ctx.session.user.image || `${getDomainUrl()}/favicon.ico`,
      //         },
      //         data: { tag: `new-thread-post-${post.id}` },
      //         time_to_live:
      //           env.NEXT_PUBLIC_VERCEL_ENV !== "production" ? 300 : undefined,
      //       },
      //     }
      //   );
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

      const del = await ctx.prisma.forumPost.delete({ where: { id } });

      // less than 28 days, clear notifications
      if (
        new Date().getTime() - post.createdAt.getTime() <
        1000 * 60 * 60 * 24 * 28
      ) {
        // const notifyUsers = await getForumNotificationListeners(
        //   ctx.prisma,
        //   [],
        //   post.thread
        // );
        // if (notifyUsers.length > 0)
        //   await ctx.pushNotification.publishToUsers(
        //     notifyUsers.map((u) => u.id),
        //     {
        //       web: {
        //         data: { tag: `new-thread-post-${id}`, delete: true },
        //         time_to_live:
        //           env.NEXT_PUBLIC_VERCEL_ENV !== "production" ? 300 : undefined,
        //       },
        //     }
        //   );
      }

      return del;
    }),
});
