import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { prisma, type Transaction } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { env } from "~/env.mjs";
import { privilegeRouter } from "./priviledge";

// TODO: consumable route as folder

export const consumableRouter = createTRPCRouter({
  privilege: privilegeRouter,
  tea: createTRPCRouter({
    getRemaining: protectedProcedure.query(({ ctx }) => {
      return calculateRemainingTea(ctx.prisma);
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return await ctx.prisma.consumeTea.findMany({
        select: { id: true, createdAt: true, amountGram: true, consumer: true },
        take: 10,
      });
    }),
    consume: protectedProcedure
      .input(
        z
          .object({
            amountGram: z.number().positive().int().default(5),
            amountSugar: z.number().nonnegative().int().default(0),
          })
          .default({})
      )
      .mutation(async ({ ctx, input: { amountGram, amountSugar } }) => {
        if (env.NEXT_PUBLIC_VERCEL_ENV === "production")
          // TODO: feature-flags with qstash
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Henüz çay içme sistemi açılmadı. Daha maaş bile dağıtmıyoruz.",
          });
        return await ctx.prisma.$transaction(async (tx) => {
          const lastConsume = await tx.consumeTea.findFirst({
            where: { consumer: { id: ctx.session.user.id } },
            orderBy: { createdAt: "desc" },
          });
          // tea consume ratelimit
          const N = 5;
          const fiveMinutes = N * 60 * 1000;
          if (
            lastConsume &&
            lastConsume.createdAt.getTime() > Date.now() - fiveMinutes
          )
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `${N} dakika içinde sadece bir bardak çay içebilirsin!`,
            });

          const leftover = calculateRemainingTea(tx);
          if (
            leftover.amountGram < amountGram ||
            leftover.amountSugar < amountSugar
          )
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Yetersiz çay veya şeker.",
            });

          await ctx.prisma.consumeTea.create({
            data: {
              amountGram,
              amountSugar,
              consumer: { connect: { id: ctx.session.user.id } },
            },
          });
        });
      }),
  }),
});

export function calculateRemainingTea(db: Transaction = prisma) {
  // const invoices = await db.payment.findMany({
  //   where: { type: "invoice" },
  //   select: { type: true, entityId: true, amount: true },
  //   orderBy: { createdAt: "asc" },
  // });

  // const consumes = await db.consumeTea.findMany({
  //   select: { amountGram: true, amountSugar: true },
  //   orderBy: { createdAt: "asc" },
  // });

  // const entities = invoices
  //   .map((p) => {
  //     // invoices must have an entityId, but other types might not
  //     // manual type guard
  //     if (!p.entityId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  //     const entity = getSystemEntityById(p.entityId);
  //     return { ...p, entity, amountTotal: p.amount * entity.price };
  //   })
  //   .filter((p) => p.entity.type === "tea")
  //   // TODO: add sugar
  //   .map((p) => {
  //     // FUCK TYPESCRIPT .MAP
  //     if (p.entity.type !== "tea") throw new Error("unreachable");
  //     return p as (typeof p) & {entity: {type: "tea"}}
  //   });

  const has = { amountGram: 0, amountSugar: 0 };
  // entities.forEach((e) => (has.amountGram += e.entity.tea.amountGram));
  // consumes.forEach((c) => {
  //   has.amountGram -= c.amountGram;
  //   has.amountSugar -= c.amountSugar;
  // });

  // if (has.amountGram < 0 || has.amountSugar < 0) {
  //   console.error("negative has in calculateLeftTea", { has });
  //   throw new TRPCError({
  //     code: "INTERNAL_SERVER_ERROR",
  //     message:
  //       "Bir şekilde batırdık gibi duruyor!" +
  //       " kalan çayı hesaplarken negatif değer bulduk." +
  //       " Lütfen hatayı web adminlerine iletin!",
  //   });
  // }
  return has;
}
