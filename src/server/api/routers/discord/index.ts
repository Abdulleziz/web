import { TRPCError } from "@trpc/server";
import { getGuildMember, getGuildRoles } from "~/server/discord-api/guild";
import { sortRoles } from "~/server/discord-api/utils";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { roleRouter } from "./role";

export const discordRouter = createTRPCRouter({
  getAbdullezizMember: protectedProcedure.query(async ({ ctx }) => {
    const discordId = ctx.session.user.discordId;

    const roles = sortRoles(await getGuildRoles());
    // en yüksek rolü belli edelim
    const abdullezizRoles = roles.map((role) => ({
      ...role,
      allah: roles.length === role.position + 1,
    }));
    const member = await getGuildMember(discordId);

    if (!member) throw new TRPCError({ code: "NOT_FOUND" });
    console.log(roles)
    // normalde member.roles -> sadece id'leri döndürüyor
    // idleri komple rol objeleriyle değiştiriyoruz (role.name, role.color)
    return {
      ...member,
      roles: abdullezizRoles.filter((role) => member.roles.includes(role.id)),
      // tüm rollerden sadece kullanıcının rollerini alıyoruz
    };
  }),

  role: roleRouter,
  getAbdullezizRoles: protectedProcedure.query(async ({ ctx }) => {
    const discordId = ctx.session.user.discordId;

    const roles = sortRoles(await getGuildRoles());
    // en yüksek rolü belli edelim
    const abdullezizRoles = roles.map((role) => ({
      ...role,
      allah: roles.length === role.position + 1,
    }));
    const member = await getGuildMember(discordId);

    if (!member) throw new TRPCError({ code: "NOT_FOUND" });
    console.log(roles)
    // normalde member.roles -> sadece id'leri döndürüyor
    // idleri komple rol objeleriyle değiştiriyoruz (role.name, role.color)
    return {
      ...member,
      roles: abdullezizRoles.filter((role) => {
        if(member.roles.includes(role.id) === false){
          return role;
      }}),
      // tüm rollerden sadece kullanıcının rollerini alıyoruz
    };
  }),

  
});
