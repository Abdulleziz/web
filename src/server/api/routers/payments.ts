import type { Payment, Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getSystemEntityById } from "~/utils/entities";
import {
  createPermissionProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import { z } from "zod";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { Client } from "@upstash/qstash/nodejs";
import { parseExpression } from "cron-parser";
import type { CronBody } from "~/pages/api/cron";
import { appRouter } from "../root";
import { connectMembersWithIds, sortRoles } from "~/server/discord-api/utils";
import { abdullezizRoleSeverities } from "~/utils/zod-utils";

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
    const entityId = p.entityId!;
    // const entity = getSystemEntityById(entityId);
    return { ...p, type: "invoice" as const, entityId };
  } else if (p.type === "transfer") {
    const fromId = p.fromId!;
    const from = p.from!;
    return { ...p, type: p.type, fromId, from };
  } else if (p.type === "salary") {
    return { ...p, type: p.type };
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unknown payment type",
  });
};

export const calculateInvoice = (payment: Payment) => {
  if (payment.type !== "invoice" || !payment.entityId)
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const entity = getSystemEntityById(payment.entityId);
  return payment.amount * entity.price;
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
  transaction?: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
  > // transactions support
) => {
  const wallet = { balance: 0 };
  // kickstart the wallet in dev
  if (env.NODE_ENV !== "production") wallet.balance += 1000000;

  const payments = await (transaction || prisma).payment.findMany({
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
            message: "Not enough money",
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
        const internalCaller = appRouter.createCaller(ctx);
        const users = await internalCaller.discord.getAbdullezizUsers();

        const salaryTakers = (
          await connectMembersWithIds(ctx.prisma, users)
        ).filter((u) => u.perms.includes("maaş al"));

        await prisma.payment.createMany({
          data: salaryTakers.map((u) => ({
            type: "salary",
            toId: u.id,
            amount:
              // highest_role.severity x multiplier (90 * 10 = 900)
              abdullezizRoleSeverities[sortRoles(u.roles).at(0)!.name] *
              multiplier,
          })),
        });
      }
    }),
});
