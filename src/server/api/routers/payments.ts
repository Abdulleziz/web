import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type SystemEntity, getSystemEntityById } from "~/utils/entities";
import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import { z } from "zod";
import { env } from "~/env.mjs";
import { type Transaction, prisma } from "~/server/db";
import { Client } from "@upstash/qstash/nodejs";
import { parseExpression } from "cron-parser";
import type { CronBody } from "~/pages/api/cron";
import { getSalaryTakers } from "~/server/discord-api/trpc";

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

type CreateEntities = z.infer<typeof CreateEntities>;
type CreateSalary = z.infer<typeof CreateSalary>;

// utils
const ensurePayment = <
  P extends Prisma.PaymentGetPayload<{ include: { from: true } }>
>(
  p: P
) => {
  if (p.type === "invoice") {
    if (!p.entityId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // const entity = getSystemEntityById(p.entityId);
    return { ...p, type: "invoice" as const, entityId: p.entityId };
  } else if (p.type === "transfer") {
    if (!p.fromId || !p.from)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return { ...p, type: p.type, fromId: p.fromId, from: p.from };
  } else if (p.type === "salary") {
    return { ...p, type: p.type };
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unknown payment type",
  });
};

export const calculateInvoice = (
  payment: Prisma.PaymentGetPayload<{
    select: { type: true; entityId: true; amount: true };
  }>
) => {
  if (payment.type !== "invoice" || !payment.entityId)
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const entity = getSystemEntityById(payment.entityId);
  return payment.amount * entity.price;
};

export const calculateInvoices = (
  payments: Parameters<typeof calculateInvoice>[number][],
  entityFilter?: SystemEntity["type"][]
) => {
  const p = payments.filter((p) => {
    if (!p.entityId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (!entityFilter) return true;
    const entity = getSystemEntityById(p.entityId);
    return entityFilter.includes(entity.type);
  });
  return p.reduce((acc, p) => acc + calculateInvoice(p), 0);
};

export const calculateEntitiesPrice = (entities: CreateEntities) => {
  let totalPrice = 0;

  for (const { entityId, amount } of entities) {
    const entity = getSystemEntityById(entityId);
    const price = entity.price * amount;

    totalPrice += price;
  }

  return totalPrice;
};

export const calculateWallet = async (
  userId: string,
  db: Transaction = prisma
) => {
  const wallet = { balance: 0 };
  // kickstart the wallet in dev
  if (env.NODE_ENV !== "production") wallet.balance += 1000000;

  const payments = await db.payment.findMany({
    where: { OR: [{ toId: userId }, { fromId: userId }] },
  });

  for (const payment of payments) {
    switch (payment.type) {
      case "salary":
        wallet.balance += payment.amount;
        break;

      case "invoice":
        wallet.balance -= calculateInvoice(payment);
        break;

      case "transfer":
        if (payment.toId === userId) wallet.balance += payment.amount;
        else wallet.balance -= payment.amount;
        break;

      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown payment type",
        });
    }
  }
  return wallet;
};

const manageEmployeesProcedure = createPermissionProcedure([
  "çalışanları yönet",
]);

const takeSalaryProcedure = createPermissionProcedure(["maaş al"]);

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
    return (
      await ctx.prisma.payment.findMany({
        include: { from: true, to: true },
      })
    ).map(ensurePayment);
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

        const url = process.env.VERCEL
          ? "https://abdulleziz.com"
          : env.NEXTAUTH_URL;

        return await c.publishJSON({
          url: url + "/api/cron",
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

        await prisma.payment.createMany({
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
