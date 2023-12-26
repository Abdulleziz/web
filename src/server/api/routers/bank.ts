import { z } from "zod";
import { createPermissionProcedure, createTRPCRouter } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  calculateBank,
  calculateBankSalary,
  calculateWallet,
} from "./payments/utils";
import { TransferMoney } from "~/utils/shared";

const createTransactionSchema = z.object({
  operation: z.enum(["deposit", "withdraw"]),
  amount: TransferMoney,
});

const seeHistoryProcedure = createPermissionProcedure(["banka geçmişini gör"]);
const operateBankProcedure = createPermissionProcedure(["bankayı işlet"]);
const manageBankProcedure = createPermissionProcedure(["bankayı yönet"]);

export const bankRouter = createTRPCRouter({
  history: seeHistoryProcedure.query(async ({ ctx }) => {
    const transfers = await ctx.prisma.bankTransaction.findMany({
      include: { reference: true },
    });
    const salaries = await ctx.prisma.bankSalary.findMany({
      include: { salaries: { include: { to: true } } },
    });
    const invoices = await ctx.prisma.bankInvoice.findMany({
      include: { entities: true },
    });
    const balance = (await calculateBank(ctx.prisma)).balance;
    return { transfers, salaries, invoices, balance };
  }),
  transaction: manageBankProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input: { amount, operation } }) => {
      return await ctx.prisma.$transaction(async (prisma) => {
        const emergency = await prisma.stateOfEmergency.findFirst({
          where: { endedAt: { not: null } },
        });
        if (emergency)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR", // since there is no CEO, its 5xx unreachable
            message: "OHAL durumunda banka işlemleri yapılamaz!",
          });

        const lastTwoOperationsAtOneMinute =
          await prisma.bankTransaction.findMany({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 60 * 1000),
              },
            },
            orderBy: { createdAt: "desc" },
            take: 2,
          });

        if (lastTwoOperationsAtOneMinute.length === 2)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "1 dakikada en fazla 2 işlem yapabilirsiniz!",
          });

        const bank = await calculateBank(prisma);
        const wallet = await calculateWallet(ctx.session.user.id, prisma);

        if (operation === "withdraw") {
          if (bank.balance < amount)
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Bankada yeterli para yok",
            });
        } else if (wallet.balance < amount)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Yetersiz bakiye",
          });

        return await prisma.bankTransaction.create({
          data: { amount, operation, referenceId: ctx.session.user.id },
        });
      });
    }),
  distributeSalary: operateBankProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.$transaction(async (prisma) => {
        const unpaid = await prisma.bankSalary.findUnique({
          where: { id: input },
          include: { salaries: { select: { severity: true } } },
        });

        if (!unpaid)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Ödenmemiş maaş yok",
          });

        const total = calculateBankSalary(unpaid);
        const bank = await calculateBank(prisma);
        // TODO: CEO wallet.

        if (bank.balance < total)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Bankada yeterli para yok",
          });

        return await prisma.bankSalary.update({
          where: { id: unpaid.id },
          data: { paidAt: new Date() },
          include: {
            salaries: {
              include: { to: { include: { pushSubscriptions: true } } },
            },
          },
        });
      });

      const salaries = result.salaries.map((s) => ({
        user: s.to,
        salary: s.severity * result.multiplier,
      }));

      await ctx.sendNotification(
        salaries.flatMap((s) => s.user.pushSubscriptions),
        (u) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const salary = salaries.find((s) => s.user.id === u.userId)!.salary;
          return {
            title: "Maaşınız yatırıldı ☺️",
            body: `Hesabınıza ${salary}₺ yatırıldı! 🤑`,
          };
        }
      );

      return result;
    }),
});
