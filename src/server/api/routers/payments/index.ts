import { TRPCError } from "@trpc/server";
import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { parseExpression } from "cron-parser";
import { calculateEntitiesPrice, calculateWallet } from "./utils";
import { CreateEntities, SendMoneySchema } from "~/utils/usePayments";
// TODO: utils import

const takeSalaryProcedure = createPermissionProcedure(["maaş al"]);

export const paymentsRouter = createTRPCRouter({
  nextSalaryDate: takeSalaryProcedure.query(() => {
    const i = parseExpression("0 5 * * 5", { utc: true });
    return i.next().getTime();
  }),
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    return await calculateWallet(ctx.session.user.id);
  }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const salaries = await ctx.prisma.bankSalary.findMany({
      include: { salaries: { include: { to: true } } },
    });

    const invoices = await ctx.prisma.invoice.findMany({
      select: { entities: true, createdAt: true, to: true },
    });

    const transfers = await ctx.prisma.transfer.findMany({
      include: { from: true, to: true },
    });

    return { salaries, invoices, transfers };
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
        const { balance } = await calculateWallet(ctx.session.user.id, prisma);
        if (balance < amount)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Yetersiz bakiye",
          });

        return await prisma.transfer.create({
          data: { fromId: ctx.session.user.id, toId, amount },
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

        return await ctx.prisma.invoice.create({
          data: {
            toId: ctx.session.user.id,
            entities: {
              createMany: {
                data: input.map(({ id: entityId, amount: quantity }) => ({
                  entityId,
                  quantity,
                })),
              },
            },
          },
        });
      });
    }),
});
