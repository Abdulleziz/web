import { createTRPCRouter, protectedProcedure } from "../../trpc";
import {
  getAbdullezizUser,
  getAbdullezizUsers,
  getGuildMemberWithRoles,
  getGuildMembersWithRoles,
} from "~/server/discord-api/trpc";
import { rolesRouter } from "./roles";

// api router
export const discordRouter = createTRPCRouter({
  getDiscordMembers: protectedProcedure.query(async () => {
    return await getGuildMembersWithRoles();
  }),
  getDiscordMember: protectedProcedure.query(async ({ ctx }) => {
    return await getGuildMemberWithRoles(ctx.session.user.discordId);
  }),
  getAbdullezizUser: protectedProcedure.query(async ({ ctx }) => {
    return await getAbdullezizUser(ctx.session.user.discordId);
  }),
  getAbdullezizUsers: protectedProcedure.query(async () => {
    return await getAbdullezizUsers();
  }),
  role: rolesRouter,
});
