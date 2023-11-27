import { z } from "zod";
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
} from "../../trpc";
import { TRPCError } from "@trpc/server";
import { ThreadId } from "./types";

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
  setForumNotification: permissionProcedure
    .input(
      z.object({
        threadId: ThreadId,
        preference: Notif,
      })
    )
    .mutation(async ({ ctx, input: { threadId, preference } }) => {
      return await ctx.prisma.$transaction(async (prisma) => {
        const thread = await prisma.forumThread.findUniqueOrThrow({
          where: { id: threadId },
          select: { creatorId: true },
        });
        if (
          thread.creatorId !== ctx.session.user.id ||
          !ctx.verifiedPerms.includes("forumu yönet")
        )
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Forum bildirimi değiştirme yetkiniz yok",
          });

        await prisma.forumThread.update({
          where: { id: threadId },
          data: { defaultNotify: preference },
        });
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
