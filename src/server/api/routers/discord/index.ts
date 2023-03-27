import { TRPCError } from "@trpc/server";
import {
  getGuildMember,
  getGuildMembers,
  getGuildRoles,
} from "~/server/discord-api/guild";
import { getAbdullezizRoles, sortRoles } from "~/server/discord-api/utils";
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

    const roles = sortRoles(await getGuildRoles());
    // en yüksek rolü belli edelim

    // normalde member.roles -> sadece id'leri döndürüyor
    // idleri komple rol objeleriyle değiştiriyoruz (role.name, role.color)
    return members.map((member) => ({
      ...member,
      roles: roles.filter((role) => member.roles.includes(role.id)),
      // tüm rollerden sadece kullanıcının rollerini alıyoruz
    }));
  }),
  getDiscordMember: protectedProcedure.query(async ({ ctx }) => {
    const discordId = ctx.session.user.discordId;

    const roles = sortRoles(await getGuildRoles());
    const member = await getGuildMember(discordId);

    if (!member) throw new TRPCError({ code: "NOT_FOUND" });

    // normalde member.roles -> sadece id'leri döndürüyor
    // idleri komple rol objeleriyle değiştiriyoruz (role.name, role.color)
    return {
      ...member,
      roles: roles.filter((role) => member.roles.includes(role.id)),
      // tüm rollerden sadece kullanıcının rollerini alıyoruz
    };
  }),
  role: roleRouter,
});
