import { getAbdullezizRoles } from "~/server/discord-api/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { roleRouter } from "./role";
import { permissionDecider } from "~/utils/abdulleziz";
import {
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
    const members = await getGuildMembersWithRoles();
    const verifiedRoles = members.map((m) => getAbdullezizRoles(m.roles));
    const verifiedPerms = verifiedRoles.map((r) =>
      permissionDecider(r.map((r) => r.name))
    );
    const verifiedMembers = members.map((m, i) => ({
      ...m,
      user: m.user!,
      roles: verifiedRoles[i]!,
      perms: verifiedPerms[i]!,
    }));
    return verifiedMembers;
  }),
  role: roleRouter,
});
