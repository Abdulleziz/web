import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { DiscordId } from "~/utils/zod-utils";
import { getGuildMember, modifyGuildMember } from "~/server/discord-api/guild";
import { TRPCError } from "@trpc/server";
import { type SystemEntity, getSystemEntityById } from "~/utils/entities";
import { type Transaction, prisma } from "~/server/db";

export const privilegeRouter = createTRPCRouter({
  voiceMute: createTRPCRouter({
    getRemaining: protectedProcedure.query(({ ctx }) => {
      return calculateRemainingVoiceMute(ctx.session.user.id, ctx.prisma);
    }),
    consume: protectedProcedure
      .input(
        z.object({
          target: DiscordId,
          mode: z.enum(["mute", "unmute", "toggle"]),
        })
      )
      .mutation(async ({ ctx, input: { target, mode } }) => {
        if (mode === "toggle") {
          const member = await getGuildMember(target);
          if (!member) throw new TRPCError({ code: "NOT_FOUND" });
          mode = member.mute ? "unmute" : "mute";
        }
        return await ctx.prisma.$transaction(async (tx) => {
          const remaining = await calculateRemainingVoiceMute(
            ctx.session.user.id,
            tx
          );
          if (remaining <= 0)
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Yetersiz susturma hakkı.",
            });

          await modifyGuildMember(target, { mute: mode === "mute" });

          return await tx.consumeVoiceMute.create({
            data: { target, consumerId: ctx.session.user.id },
          });
        });
      }),
  }),
  voiceDeafen: createTRPCRouter({
    getRemaining: protectedProcedure.query(({ ctx }) => {
      return calculateRemainingVoiceDeafen(ctx.session.user.id, ctx.prisma);
    }),
    consume: protectedProcedure
      .input(
        z.object({
          target: DiscordId,
          mode: z.enum(["deaf", "undeaf", "toggle"]),
        })
      )
      .mutation(async ({ ctx, input: { target, mode } }) => {
        if (mode === "toggle") {
          const member = await getGuildMember(target);
          if (!member) throw new TRPCError({ code: "NOT_FOUND" });
          mode = member.mute ? "undeaf" : "deaf";
        }
        return await ctx.prisma.$transaction(async (tx) => {
          const remaining = await calculateRemainingVoiceDeafen(
            ctx.session.user.id,
            tx
          );
          if (remaining <= 0)
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Yetersiz kulaklık takma hakkı.",
            });

          await modifyGuildMember(target, { deaf: mode === "deaf" });

          return await tx.consumeVoiceDeafen.create({
            data: { target, consumerId: ctx.session.user.id },
          });
        });
      }),
  }),
  voiceKick: createTRPCRouter({
    getRemaining: protectedProcedure.query(({ ctx }) => {
      return calculateRemainingVoiceKick(ctx.session.user.id, ctx.prisma);
    }),
    consume: protectedProcedure
      .input(DiscordId)
      .mutation(async ({ ctx, input: target }) => {
        return await ctx.prisma.$transaction(async (tx) => {
          const remaining = await calculateRemainingVoiceKick(
            ctx.session.user.id,
            tx
          );
          if (remaining <= 0)
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Yetersiz sesli atma hakkı.",
            });

          await modifyGuildMember(target, { channel_id: null });

          return await tx.consumeVoiceKick.create({
            data: { target, consumerId: ctx.session.user.id },
          });
        });
      }),
  }),
});

export async function countEntityByUserPurchase(
  to: string,
  predicate: (e: SystemEntity) => boolean,
  db: Transaction = prisma
) {
  const invoices = await db.invoice.findMany({
    where: { toId: to },
    select: { entities: true },
  });

  const entities = invoices
    .map((i) => i.entities)
    .flat()
    .map((e) => ({
      ...getSystemEntityById(e.entityId),
      quantity: e.quantity,
    }));

  return entities.reduce((acc, e) => {
    if (predicate(e)) acc += e.quantity;
    return acc;
  }, 0);
}

export async function calculateRemainingVoiceKick(
  to: string,
  db: Transaction = prisma
) {
  const has = await countEntityByUserPurchase(
    to,
    (e) => e.type === "privilege" && e.privilege.kind === "voice-kick",
    db
  );

  const consumes = await db.consumeVoiceKick.count({
    where: { consumerId: to },
  });

  return has - consumes;
}
export async function calculateRemainingVoiceMute(
  to: string,
  db: Transaction = prisma
) {
  const has = await countEntityByUserPurchase(
    to,
    (e) => e.type === "privilege" && e.privilege.kind === "voice-mute",
    db
  );

  const consumes = await db.consumeVoiceMute.count({
    where: { consumerId: to },
  });

  return has - consumes;
}
export async function calculateRemainingVoiceDeafen(
  to: string,
  db: Transaction = prisma
) {
  const has = await countEntityByUserPurchase(
    to,
    (e) => e.type === "privilege" && e.privilege.kind === "voice-deafen",
    db
  );

  const consumes = await db.consumeVoiceDeafen.count({
    where: { consumerId: to },
  });

  return has - consumes;
}
