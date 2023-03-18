import { z } from "zod";
import { modifyGuildMemberRole } from "~/server/discord-api/guild";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const roleRouter = createTRPCRouter({
  removeAbdullezizRole: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: roleId }) => {
      const discordId = ctx.session.user.discordId;
      console.log("discordId", discordId, "roleId", roleId);
      await modifyGuildMemberRole(discordId, roleId, "DELETE");
    }),
});
