import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env.mjs";
import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { UserId } from "~/utils/zod-utils";
import { forumNotificationsRouter } from "./notifications";
import { forumPostsRouter } from "./posts";
import { getForumNotificationListeners } from "./trpc";
import { ThreadId, ThreadMessage, ThreadTag, ThreadTitle } from "./types";

const managePinsProcedure = createPermissionProcedure(["forum thread pinle"]);
const deleteThreadsProcedure = createPermissionProcedure(["forum thread sil"]);
const lockThreadsProcedure = createPermissionProcedure([
  "forum thread kilitle",
]);

export const forumRouter = createTRPCRouter({
  posts: forumPostsRouter,
  notifications: forumNotificationsRouter,
  getThreads: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.forumThread.findMany({
      include: {
        creator: true,
        tags: true,
        pin: { include: { pinnedBy: true } },
        notifications: { where: { userId: ctx.session.user.id } },
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
      return ctx.prisma.forumPin.delete({
        where: { id },
        select: { thread: { select: { id: true } } },
      });
    }),
  toggleLockThread: lockThreadsProcedure
    .input(ThreadId)
    .mutation(async ({ ctx, input: id }) => {
      return await ctx.prisma.$transaction(async (prisma) => {
        const thread = await prisma.forumThread.findUnique({
          where: { id },
          select: { locked: true },
        });
        if (!thread) throw new TRPCError({ code: "NOT_FOUND" });
        await prisma.forumThread.update({
          where: { id },
          data: { locked: !thread.locked },
        });
      });
    }),
  createThread: protectedProcedure
    .input(
      z.object({
        title: ThreadTitle,
        tags: ThreadTag.array().default([]),
        message: ThreadMessage,
        mentions: UserId.array().default([]),
        notify: z.boolean().default(true),
      })
    )
    .mutation(
      async ({ ctx, input: { title, tags, message, notify, mentions } }) => {
        const thread = await ctx.prisma.forumThread.create({
          data: {
            title,
            defaultNotify: notify ? "all" : "mentions",
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
          include: { notifications: true },
        });
        const notifyUsers = await getForumNotificationListeners(
          ctx.prisma,
          mentions,
          thread
        );
        await ctx.sendNotification(
          notifyUsers,
          {
            title: `Yeni Thread: ${title.slice(0, 50)}`,
            body: `${ctx.session.user.name ?? ""}: ${message.slice(0, 100)}`,
            tag: `new-thread-${thread.id}`,
            icon: ctx.session.user.image ?? undefined,
            actions: [{ action: `/forum/threads/${thread.id}`, title: "Git" }],
          },
          { TTL: env.NEXT_PUBLIC_VERCEL_ENV !== "production" ? 300 : undefined }
        );
        return thread;
      }
    ),
  deleteThreadById: deleteThreadsProcedure
    .input(ThreadId)
    .mutation(async ({ ctx, input: id }) => {
      return await ctx.prisma.forumThread.delete({ where: { id } });
    }),
});
