import { z } from "zod";
import { modifyGuildMemberRole } from "~/server/discord-api/guild";
import { getVerifiedAbdullezizRoles } from "~/server/discord-api/utils";
import { appRouter } from "../../root";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const roleRouter = createTRPCRouter({
  removeAbdullezizRole: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: roleId }) => {
      const discordId = ctx.session.user.discordId;

      await modifyGuildMemberRole(discordId, roleId, "DELETE");
    }),
  getVerifiedAbdullezizRoles: protectedProcedure.query(async ({ ctx }) => {
    const internalCaller = appRouter.createCaller(ctx);
    const member = await internalCaller.discord.getAbdullezizMember();
    const verifiedRoles = getVerifiedAbdullezizRoles(member.roles);

    return verifiedRoles;
  }),
});
