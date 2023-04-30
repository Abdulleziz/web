import { TRPCError } from "@trpc/server";
import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import { env } from "~/env.mjs";
import { Client } from "@upstash/qstash/nodejs";
import { parseExpression } from "cron-parser";
import type { CronBody } from "~/pages/api/cron";
import { getSalaryTakers } from "~/server/discord-api/trpc";
import {
  calculateEntitiesPrice,
  calculateWallet,
  ensurePayment,
  poolPayments,
} from "./utils";
import { getBaseUrl } from "~/utils/api";

// validators
export const CreateEntities = z
  .object({
    entityId: z.number().positive().int().min(1),
    amount: z.number().min(1).default(1),
  })
  .array()
  .nonempty();

export const CreateSalary = z.object({
  multiplier: z.number().min(1).max(20).default(10),
  delay: z
    .number()
    .min(0)
    .max(60 * 60 * 24 * 7)
    .default(0)
    .describe("in seconds"),
});

export type CreateEntities = z.infer<typeof CreateEntities>;
export type CreateSalary = z.infer<typeof CreateSalary>;

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
    .mutation(async ({ ctx, input: { delay, multiplier } }) => {
      if (env.NODE_ENV !== "development") {
        const c = new Client({ token: env.QSTASH_TOKEN });
        const { messages } = await c.messages.list();
        const salaryMessages = messages.filter((m) =>
          m.body.includes("salary")
        );
        if (salaryMessages.length > 0)
          throw new TRPCError({ code: "PRECONDITION_FAILED" });

        const url = getBaseUrl() + "/api/cron";
        return await c.publishJSON({
          url,
          delay,
          body: {
            type: "salary",
            delay,
            multiplier,
            fromId: ctx.session.user.id,
          } as z.input<typeof CronBody>,
        });
      } else {
        // currently in dev, we don't have a cron job
        const salaryTakers = await getSalaryTakers();

        await ctx.prisma.payment.createMany({
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
      }
    }),
});
