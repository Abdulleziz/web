import { TRPCError } from "@trpc/server";
import { getGuildMember, getGuildMembers } from "~/server/discord-api/guild";
import {
  fetchMembersWithRoles,
  getAbdullezizRoles,
} from "~/server/discord-api/utils";
import { appRouter } from "../../root";
import { roleRouter } from "./role";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { permissionDecider } from "~/utils/abdulleziz";

export const discordRouter = createTRPCRouter({
  getAbdullezizUser: protectedProcedure.query(async ({ ctx }) => {
    const internalCaller = appRouter.createCaller(ctx);
    const member = await internalCaller.discord.getDiscordMember();
    const verifiedRoles = getAbdullezizRoles(member.roles);
    const verifiedPerms = permissionDecider(verifiedRoles.map((r) => r.name));

    return { roles: verifiedRoles, perms: verifiedPerms };
  }),
  getDiscordMembers: protectedProcedure.query(async () => {
    const members = await getGuildMembers();
    if (!members) throw new TRPCError({ code: "NOT_FOUND" });

    return await fetchMembersWithRoles(members);
  }),
  getDiscordMember: protectedProcedure.query(async ({ ctx }) => {
    const discordId = ctx.session.user.discordId;

    const member = await getGuildMember(discordId);
    if (!member) throw new TRPCError({ code: "NOT_FOUND" });

    return (await fetchMembersWithRoles([member])).at(0)!;
  }),
  role: roleRouter,
});
