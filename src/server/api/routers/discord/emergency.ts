import { triggerEmergency } from "~/server/discord-api/trpc";
import { createPermissionProcedure, createTRPCRouter } from "../../trpc";
import { TRPCError } from "@trpc/server";

const emergencyProcedure = createPermissionProcedure(["ohal başlat"]);

export const emergenciesRouter = createTRPCRouter({
  triggerEmergency: emergencyProcedure.mutation(async ({ ctx }) => {
    // TODO: check for unpaid with NOT BEFORE last emergency
    const unpaidLast = await ctx.prisma.bankSalary.findFirst({
      where: { paidAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (
      !unpaidLast ||
      unpaidLast.createdAt.getTime() + 1000 * 60 * 60 * 24 > Date.now()
    )
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Ohal başlatmak için ödenmemiş maaş olmalıdır",
      });

    return await triggerEmergency("USER");
  }),
});
