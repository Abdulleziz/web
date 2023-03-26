import { TRPCError } from "@trpc/server";
import { getGuildMember, getGuildRoles } from "~/server/discord-api/guild";
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
  getDiscordMember: protectedProcedure.query(async ({ ctx }) => {
    const discordId = ctx.session.user.discordId;

    const roles = sortRoles(await getGuildRoles());
    // en yüksek rolü belli edelim
    const abdullezizRoles = roles.map((role) => ({
      ...role,
      allah: roles.length === role.position + 1,
    }));
    const member = await getGuildMember(discordId);

    if (!member) throw new TRPCError({ code: "NOT_FOUND" });

    // normalde member.roles -> sadece id'leri döndürüyor
    // idleri komple rol objeleriyle değiştiriyoruz (role.name, role.color)
    return {
      ...member,
      roles: abdullezizRoles.filter((role) => member.roles.includes(role.id)),
      // tüm rollerden sadece kullanıcının rollerini alıyoruz
    };
  }),
  role: roleRouter,
});
