import { TRPCError } from "@trpc/server";
import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { env } from "~/env.mjs";
import { Client } from "@upstash/qstash";
import { parseExpression } from "cron-parser";
import type { CronBody } from "~/pages/api/cron";
import { getSalaryTakers } from "~/server/discord-api/trpc";
import {
  calculateEntitiesPrice,
  calculateWallet,
  ensurePayment,
  poolPayments,
} from "./utils";
import { getDomainUrl } from "~/utils/api";
import {
  CreateEntities,
  CreateSalary,
  SendMoneySchema,
} from "~/utils/usePayments";
import type { z } from "zod";

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
          data: input.map(({ entityId, amount }) => ({
            type: "invoice",
            entityId,
            amount,
            toId: ctx.session.user.id,
          })),
        });
      });
    }),
  createSalary: manageEmployeesProcedure
    .input(CreateSalary)
    .mutation(({ ctx, input: { delay, multiplier } }) => {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Due to migration of the message broker, this feature is disabled",
      });
      // if (env.NODE_ENV !== "development") {
      //   const c = new Client({ token: env.QSTASH_TOKEN });
      //   // TODO: since we cannot list messages, we need to create scheduled job for salary and destroy it
      //   // or we store the message id in the db, that way, we could create ui that is mutable by the user at any time
      //   const messages = await c.messages.list();
      //   const salaryMessages = messages.filter((m) =>
      //     m.body.includes("salary")
      //   );
      //   if (salaryMessages.length > 0)
      //     throw new TRPCError({ code: "PRECONDITION_FAILED" });

      //   const url = getDomainUrl() + "/api/cron";
      //   return await c.publishJSON({
      //     url,
      //     delay,
      //     body: {
      //       type: "salary",
      //       delay,
      //       multiplier,
      //       fromId: ctx.session.user.id,
      //     } as z.input<typeof CronBody>,
      //   });
      // } else {
      //   // currently in dev, we don't have a cron job
      //   const salaryTakers = await getSalaryTakers();

      //   await ctx.prisma.payment.createMany({
      //     data: salaryTakers.map((u) => {
      //       return {
      //         type: "salary",
      //         toId: u.id,
      //         amount:
      //           // highest_role.severity x multiplier (90 * 10 = 900)
      //           u.severity * multiplier,
      //       };
      //     }),
      //   });
      // }
    }),
});
