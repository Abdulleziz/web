import { TRPCError } from "@trpc/server";
import { getGuildMember } from "~/server/discord-api/guild";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { roleRouter } from "./role";

export const discordRouter = createTRPCRouter({
  getAbdullezizMember: protectedProcedure.query(async ({ ctx }) => {
    const discordId = ctx.session.user.discordId;

    const member = await getGuildMember(discordId);
    if (!member) throw new TRPCError({ code: "NOT_FOUND" });

    return member;
  }),

  role: roleRouter,
});
