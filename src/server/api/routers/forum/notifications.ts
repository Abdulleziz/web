import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { ThreadId } from "~/utils/zod-utils";
import { TRPCError } from "@trpc/server";

const vError = {
  invalid_type_error: "Bildirim ayar tipi geçersiz",
  required_error: "Bildirim ayar tipi boş olamaz",
};

const Notif = z.enum(["all", "mentions"], vError);
const AllNotif = Notif.or(z.literal("none", vError));

export const forumNotificationsRouter = createTRPCRouter({
  getUserNotification: protectedProcedure.query(async ({ ctx }) => {
    return (
      await ctx.prisma.user.findUniqueOrThrow({
        where: { id: ctx.session.user.id },
        select: { defaultThreadNotify: true },
      })
    ).defaultThreadNotify;
  }),
  setUserNotification: protectedProcedure
    .input(Notif)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { defaultThreadNotify: input },
      });
    }),
  setForumNotification: protectedProcedure
    .input(
      z.object({
        threadId: ThreadId,
        preference: Notif,
      })
    )
    .mutation(async ({ ctx, input: { threadId, preference } }) => {
      await ctx.prisma.forumThread.update({
        where: { id: threadId },
        data: { defaultNotify: preference },
      });
    }),
  setForumUserNotification: protectedProcedure
    .input(
      z.object({
        threadId: ThreadId,
        preference: AllNotif.or(z.literal("default", vError)).default(
          "default"
        ),
      })
    )
    .mutation(async ({ ctx, input: { threadId, preference } }) => {
      const where = {
        threadId_userId: { threadId, userId: ctx.session.user.id },
      };
      if (preference === "default") {
        const notify = await ctx.prisma.forumNotify.findUnique({ where });
        if (!notify)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Forum bildirim ayarı bulunamadı",
          });
        await ctx.prisma.forumNotify.delete({ where });
        return;
      }
      await ctx.prisma.forumNotify.upsert({
        where,
        create: { preference, threadId, userId: ctx.session.user.id },
        update: { preference },
      });
    }),
});
