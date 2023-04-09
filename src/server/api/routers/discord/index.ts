import { getAbdullezizRoles } from "~/server/discord-api/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { roleRouter } from "./role";
import { permissionDecider } from "~/utils/abdulleziz";
import {
  getAbdullezizUsers,
  getGuildMemberWithRoles,
  getGuildMembersWithRoles,
} from "~/server/discord-api/trpc";

// api router
export const discordRouter = createTRPCRouter({
  getDiscordMembers: protectedProcedure.query(async () => {
    return await getGuildMembersWithRoles();
  }),
  getDiscordMember: protectedProcedure.query(async ({ ctx }) => {
    return await getGuildMemberWithRoles(ctx.session.user.discordId);
  }),
  getAbdullezizUser: protectedProcedure.query(async ({ ctx }) => {
    const member = await getGuildMemberWithRoles(ctx.session.user.discordId);
    const verifiedRoles = getAbdullezizRoles(member.roles);
    const verifiedPerms = permissionDecider(verifiedRoles.map((r) => r.name));

    return { roles: verifiedRoles, perms: verifiedPerms };
  }),
  getAbdullezizUsers: protectedProcedure.query(async () => {
    return await getAbdullezizUsers();
  }),
  role: roleRouter,
});
