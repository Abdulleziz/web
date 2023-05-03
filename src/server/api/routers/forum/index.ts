import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { nonEmptyString, ThreadId } from "~/utils/zod-utils";
import { forumPostsRouter } from "./posts";
import { getEnv } from "~/lib/pusher/notifications";
import { getDomainUrl } from "~/utils/api";
import { env } from "~/env.mjs";

const managePinsProcedure = createPermissionProcedure(["forum thread pinle"]);
const deleteThreadsProcedure = createPermissionProcedure(["forum thread sil"]);

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
        notify: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input: { title, tags, message, notify } }) => {
      const thread = await ctx.prisma.forumThread.create({
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
      if (notify)
        await ctx.pushNotification.publishToInterests([`${getEnv()}-all`], {
          web: {
            notification: {
              title: `Yeni Thread: ${title.slice(0, 50)}`,
              body: `${ctx.session.user.name ?? ""}: ${message.slice(0, 100)}`,
              deep_link: `${getDomainUrl()}/forum/threads/${thread.id}`,
              hide_notification_if_site_has_focus: true,
              icon: ctx.session.user.image || `${getDomainUrl()}/favicon.ico`,
            },
            time_to_live:
              env.NEXT_PUBLIC_VERCEL_ENV !== "production" ? 300 : undefined,
          },
        });
      return thread;
    }),
  deleteThreadById: deleteThreadsProcedure
    .input(ThreadId)
    .mutation(({ ctx, input: id }) => {
      return ctx.prisma.forumThread.delete({
        where: { id },
      });
    }),
});
