import { z } from "zod";
import { modifyGuildMemberRole } from "~/server/discord-api/guild";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const roleRouter = createTRPCRouter({
  removeDiscordRole: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: roleId }) => {
      const discordId = ctx.session.user.discordId;

      await modifyGuildMemberRole(discordId, roleId, "DELETE");
    }),
});
