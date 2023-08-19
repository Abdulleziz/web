import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type Transaction, prisma } from "~/server/db";
import { type SystemEntity, getSystemEntityById } from "~/utils/entities";
import type { CreateEntities } from "~/utils/usePayments";

export const ensurePayment = <
  P extends Prisma.PaymentGetPayload<{ include: { from: true; to: true } }>
>(
  p: P
) => {
  if (p.type === "invoice") {
    if (!p.entityId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // const entity = getSystemEntityById(p.entityId);
    return { ...p, type: "invoice" as const, entityId: p.entityId };
  } else if (p.type === "transfer") {
    if (!p.fromId || !p.from)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Bir transfer işlemindeki `gönderen` kullanıcı kayıtlardan silinmiş!",
      });

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

  const payments = await db.payment.findMany({
    where: { OR: [{ toId: userId }, { fromId: userId }] },
  });

  for (const payment of payments) {
    switch (payment.type) {
      case "salary":
        if (payment.toId === userId) wallet.balance += payment.amount;
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

export const poolPayments = (payments: PaymentData[]) => {
  const pool = payments.map((b) => {
    const others = payments.filter(
      (h) => h.createdAt.getTime() === b.createdAt.getTime()
    );
    if (b.type === "invoice") {
      const o = others as I[];
      return {
        type: "invoice",
        to: b.to,
        createdAt: b.createdAt,
        pool: o.map((i) => ({
          amount: i.amount,
          entityId: i.entityId,
          id: i.id,
        })),
      } satisfies InvoicePollData;
    } else if (b.type === "salary") {
      const o = others as S[];
      return {
        type: "salary",
        createdAt: b.createdAt,
        pool: o.map((i) => ({
          to: b.to,
          amount: i.amount,
          id: i.id,
        })),
      } satisfies SalaryPollData;
    }
    return b as TransferPollData;
  });
  const noDuplicates = pool.filter(
    (p, i) =>
      i ===
      pool.findIndex((h) => h.createdAt.getTime() === p.createdAt.getTime())
  );

  return noDuplicates;
};

type PaymentData = ReturnType<typeof ensurePayment>;

// pooling
type I = PaymentData & { type: "invoice" };
type S = PaymentData & { type: "salary" };
type T = PaymentData & { type: "transfer" };

// transfer is usually not pooled
type TransferPollData = T;

// pool the items that are bought at the same time
type InvoicePollData = {
  type: "invoice";
  pool: Pick<I, "entityId" | "amount" | "id">[];
  to: I["to"];
  createdAt: I["createdAt"];
};

// pool the users that are paid at the same time
type SalaryPollData = {
  type: "salary";
  pool: Pick<S, "to" | "amount" | "id">[];
  createdAt: S["createdAt"];
};
