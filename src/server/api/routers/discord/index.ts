import { createTRPCRouter, protectedProcedure } from "../../trpc";
import {
  getAbdullezizUser,
  getAbdullezizUsers,
  getGuildMemberWithRoles,
  getGuildMembersWithRoles,
} from "~/server/discord-api/trpc";
import { rolesRouter } from "./roles";
import { DiscordId } from "~/utils/zod-utils";

// api router
export const discordRouter = createTRPCRouter({
  getDiscordMembers: protectedProcedure.query(async () => {
    return await getGuildMembersWithRoles();
  }),
  getDiscordMember: protectedProcedure
    .input(DiscordId.optional())
    .query(async ({ ctx, input }) => {
      return await getGuildMemberWithRoles(input || ctx.session.user.discordId);
    }),
  getAbdullezizUser: protectedProcedure
    .input(DiscordId.optional())
    .query(async ({ ctx, input }) => {
      return await getAbdullezizUser(input || ctx.session.user.discordId);
    }),
  getAbdullezizUsers: protectedProcedure.query(async () => {
    return await getAbdullezizUsers();
  }),
  role: rolesRouter,
});
