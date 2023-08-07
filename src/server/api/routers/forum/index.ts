import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { nonEmptyString, ThreadId, UserId } from "~/utils/zod-utils";
import { getDomainUrl } from "~/utils/api";
import { env } from "~/env.mjs";
import { forumPostsRouter } from "./posts";
import { forumNotificationsRouter } from "./notifications";
import { getForumNotificationListeners } from "./trpc";

const _28DAYS = 1000 * 60 * 60 * 24 * 28;

const ThreadTitle = z
  .string({ required_error: "Thread başlığı boş olamaz" })
  .trim()
  .min(1, "Thread başlığı en az 1 karakter olmalıdır")
  .max(100, "Thread başlığı en fazla 100 karakter olmalıdır");

const ThreadMessage = z
  .string({ required_error: "Thread mesajı boş olamaz" })
  .trim()
  .min(1, "Thread mesajı en az 1 karakter olmalıdır")
  .max(1000, "Thread mesajı en fazla 1000 karakter olmalıdır");

const managePinsProcedure = createPermissionProcedure(["forum thread pinle"]);
const deleteThreadsProcedure = createPermissionProcedure(["forum thread sil"]);

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
      return ctx.prisma.forumPin.delete({ where: { id } });
    }),
  createThread: protectedProcedure
    .input(
      z.object({
        title: ThreadTitle,
        tags: nonEmptyString.array(),
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
        if (notifyUsers.length > 0)
          await ctx.pushNotification.publishToUsers(
            notifyUsers.map((u) => u.id),
            {
              web: {
                notification: {
                  title: `Yeni Thread: ${title.slice(0, 50)}`,
                  body: `${ctx.session.user.name ?? ""}: ${message.slice(
                    0,
                    100
                  )}`,
                  deep_link: `${getDomainUrl()}/forum/threads/${thread.id}`,
                  hide_notification_if_site_has_focus: true,
                  icon:
                    ctx.session.user.image || `${getDomainUrl()}/favicon.ico`,
                },
                data: { tag: `new-thread-${thread.id}` },
                time_to_live:
                  env.NEXT_PUBLIC_VERCEL_ENV !== "production" ? 300 : undefined,
              },
            }
          );
        return thread;
      }
    ),
  deleteThreadById: deleteThreadsProcedure
    .input(ThreadId)
    .mutation(async ({ ctx, input: id }) => {
      const thread = await ctx.prisma.forumThread.findUniqueOrThrow({
        where: { id },
        select: {
          notifications: true,
          defaultNotify: true,
          createdAt: true,
          posts: {
            skip: 1,
            where: {
              createdAt: {
                gt: new Date(new Date().getTime() - _28DAYS),
              },
            },
          },
        },
      });
      const del = await ctx.prisma.forumThread.delete({ where: { id } });

      const notifyUsers = await getForumNotificationListeners(
        ctx.prisma,
        [],
        thread
      );

      if (notifyUsers.length > 0) {
        // less than 28 days, clear notifications
        if (new Date().getTime() - thread.createdAt.getTime() < _28DAYS) {
          await ctx.pushNotification.publishToUsers(
            notifyUsers.map((u) => u.id),
            {
              web: {
                data: { tag: `new-thread-${id}`, delete: true },
                time_to_live:
                  env.NEXT_PUBLIC_VERCEL_ENV !== "production" ? 300 : undefined,
              },
            }
          );
        }

        const publish = thread.posts
          .filter(
            (post) => new Date().getTime() - post.createdAt.getTime() < _28DAYS
          )
          .map((post) =>
            ctx.pushNotification.publishToUsers(
              notifyUsers.map((u) => u.id),
              {
                web: {
                  data: { tag: `new-thread-post-${post.id}`, delete: true },
                  time_to_live:
                    env.NEXT_PUBLIC_VERCEL_ENV !== "production"
                      ? 300
                      : undefined,
                },
              }
            )
          );
        await Promise.all(publish);
      }

      return del;
    }),
});
