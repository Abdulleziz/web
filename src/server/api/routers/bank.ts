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
    return await calculateBank(ctx.prisma);
  }),
  transaction: manageBankProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input: { amount, operation } }) => {
      return await ctx.prisma.$transaction(async (prisma) => {
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
  distributeSalary: operateBankProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.prisma.$transaction(async (prisma) => {
      const unpaidSalaries = await prisma.bankSalary.findMany({
        where: { paidAt: null },
        orderBy: { createdAt: "asc" },
        include: { salaries: { select: { severity: true } } },
      });

      if (unpaidSalaries.length > 3)
        console.error("3'ten fazla ödenmemiş maaş var");

      const unpaid = unpaidSalaries[0];

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
