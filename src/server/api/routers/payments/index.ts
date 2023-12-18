import { TRPCError } from "@trpc/server";
import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { parseExpression } from "cron-parser";
import { getSalaryTakers } from "~/server/discord-api/trpc";
import {
  calculateEntitiesPrice,
  calculateWallet,
  ensurePayment,
  poolPayments,
} from "./utils";
import {
  CreateEntities,
  CreateSalary,
  SendMoneySchema,
} from "~/utils/usePayments";
// TODO: utils import
import { ONE_WEEK_OR_ONE_DAY } from "../discord/roles";

const takeSalaryProcedure = createPermissionProcedure(["maaş al"]);
const manageEmployeesProcedure = createPermissionProcedure([
  "çalışanları yönet",
]);

// api router
export const paymentsRouter = createTRPCRouter({
  nextSalaryDate: takeSalaryProcedure.query(() => {
    const i = parseExpression("0 9,21 * * *", { utc: true });
    return i.next().getTime();
  }),
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    return await calculateWallet(ctx.session.user.id);
  }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const payments = (
      await ctx.prisma.payment.findMany({
        include: { from: true, to: true },
      })
    ).map(ensurePayment);

    return poolPayments(payments);
  }),
  sendMoney: protectedProcedure
    .input(SendMoneySchema)
    .mutation(async ({ ctx, input: { toId, amount } }) => {
      const target = await ctx.prisma.user.findUnique({ where: { id: toId } });
      if (!target)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Kullanıcı bulunamadı",
        });

      return await ctx.prisma.$transaction(async (prisma) => {
        const { balance } = await calculateWallet(ctx.session.user.id);
        if (balance < amount)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Yetersiz bakiye",
          });

        return await prisma.payment.create({
          data: {
            type: "transfer",
            fromId: ctx.session.user.id,
            toId,
            amount,
          },
        });
      });
    }),
  buyEntities: protectedProcedure
    .input(CreateEntities)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (prisma) => {
        const { balance } = await calculateWallet(ctx.session.user.id, prisma);
        const totalPrice = calculateEntitiesPrice(input);

        if (balance < totalPrice)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Yetersiz bakiye",
          });

        return await ctx.prisma.payment.createMany({
          data: input.map(({ id: entityId, amount }) => ({
            type: "invoice",
            entityId,
            amount,
            toId: ctx.session.user.id,
          })),
        });
      });
    }),
  distributeSalary: manageEmployeesProcedure
    .input(CreateSalary)
    .mutation(async ({ ctx, input: { multiplier } }) => {
      const lastSalary = await ctx.prisma.payment.findMany({
        where: {
          type: "salary",
          createdAt: { gt: new Date(Date.now() - ONE_WEEK_OR_ONE_DAY) },
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastSalary.length > 2)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "1 haftada 2 maaş dağıtımı yapılamaz",
        });

      if (lastSalary.length)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Maaş zaten bu hafta içerisinde dağıtıldı",
        });

      const salaryTakers = await getSalaryTakers();

      const result = await ctx.prisma.payment.createMany({
        data: salaryTakers.map((u) => {
          return {
            type: "salary",
            toId: u.id,
            amount:
              // highest_role.severity x multiplier (90 * 10 = 900)
              u.severity * multiplier,
          };
        }),
      });

      if (result.count < 1)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Maaş dağıtımı başarısız",
        });
    }),
});
