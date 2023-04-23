import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserId } from "~/utils/zod-utils";
import { prisma } from "~/server/db";
import { getAbdullezizUser } from "~/server/discord-api/trpc";

export const profilesRouter = createTRPCRouter({
  getProfileById: publicProcedure.input(UserId).query(async ({ input: id }) => {
    // profiles are public!
    return await getUser(id);
  }),
  ["@me"]: protectedProcedure.query(async ({ ctx }) => {
    return await getUser(ctx.session.user.id);
  }),
});

async function getUser(id: UserId) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      accounts: { select: { providerAccountId: true } },
      _count: {
        select: {
          forumPosts: true,
          forumThreads: true,
          listenedCrons: true,
          paymentsRecieved: true,
          paymentsSent: true, // includes salary-sent(each-user)
          ForumPin: true,
          teaConsumer: true,
        },
      },
    },
  });
  if (!user) throw new TRPCError({ code: "NOT_FOUND" });
  const discordId = user.accounts[0]?.providerAccountId;
  if (!discordId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const member = await getAbdullezizUser(discordId);
  return { ...user, member, discordId };
}
