import { type Prisma } from "@prisma/client";
import { type Transaction, prisma } from "~/server/db";
import { getSystemEntityById } from "~/utils/entities";
import type { CreateEntities } from "~/utils/usePayments";

export const calculateEntitiesPrice = (entities: CreateEntities) => {
  let totalPrice = 0;

  for (const { id: entityId, amount } of entities) {
    const entity = getSystemEntityById(entityId);
    const price = entity.price * amount;

    totalPrice += price;
  }

  return totalPrice;
};

export const calculateBankSalary = <
  BankSalary extends Prisma.BankSalaryGetPayload<{
    select: { multiplier: true; salaries: { select: { severity: true } } };
  }>
>(
  salary: BankSalary
) => {
  // could be optimized by using a single query

  return (
    salary.multiplier * salary.salaries.reduce((acc, s) => acc + s.severity, 0)
  );
};

export const calculateWallet = async (
  userId: string,
  db: Transaction = prisma
) => {
  const wallet = { balance: 0 };

  const salaries = await db.salary.findMany({
    where: { toId: userId, bankSalary: { paidAt: { not: null } } },
    select: { severity: true, bankSalary: { select: { multiplier: true } } },
  });

  const invoices = await db.invoice.findMany({
    where: { toId: userId },
    select: { entities: true },
  });

  const transfers = await db.transfer.findMany({
    where: { OR: [{ toId: userId }, { fromId: userId }] },
  });

  const bankTransfers = await db.bankTransaction.findMany({
    where: { referenceId: userId },
    select: { amount: true, operation: true },
  });

  for (const salary of salaries) {
    wallet.balance += salary.bankSalary.multiplier * salary.severity;
  }

  for (const invoice of invoices) {
    wallet.balance -= invoice.entities.reduce(
      (acc, e) => acc + getSystemEntityById(e.entityId).price,
      0
    );
  }

  for (const transfer of transfers) {
    if (transfer.toId === userId) wallet.balance += transfer.amount;
    else wallet.balance -= transfer.amount;
  }

  for (const transfer of bankTransfers) {
    if (transfer.operation === "deposit") wallet.balance -= transfer.amount;
    else wallet.balance += transfer.amount;
  }

  return wallet;
};

export const calculateBank = async (db: Transaction = prisma) => {
  const bank = { balance: 0 };

  const salaries = await db.bankSalary.findMany({
    where: { paidAt: { not: null } },
    select: { multiplier: true, salaries: { select: { severity: true } } },
  });

  const invoices = await db.bankInvoice.findMany({
    select: { entities: true },
  });

  const transfers = await db.bankTransaction.findMany({});

  for (const salary of salaries) {
    bank.balance -= calculateBankSalary(salary);
  }

  for (const invoice of invoices) {
    bank.balance -= invoice.entities.reduce(
      (acc, e) => acc + getSystemEntityById(e.entityId).price * e.quantity,
      0
    );
  }

  for (const transfer of transfers) {
    if (transfer.operation === "deposit") bank.balance += transfer.amount;
    else bank.balance -= transfer.amount;
  }

  return { ...bank, salaries, invoices, transfers };
};
