import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { nonEmptyString } from "~/utils/zod-utils";
import { TRPCError } from "@trpc/server";
import { MemeId } from "./types";

const Meme = z.object({
  name: nonEmptyString.max(100),
  description: nonEmptyString.max(500),
});

export const forumMemesRouter = createTRPCRouter({
  getMemes: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.dictionaryMeme.findMany({ take: 200 });
  }),
  insertMeme: protectedProcedure
    .input(Meme)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.dictionaryMeme.upsert({
        where: { name: input.name },
        update: { description: input.description },
        create: input,
      });
    }),
  deleteMeme: protectedProcedure
    .input(MemeId)
    .mutation(async ({ ctx, input }) => {
      const meme = await ctx.prisma.dictionaryMeme.findUnique({
        where: { id: input },
        select: { createdAt: true },
      });

      if (!meme)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sözlükte bulunamadı.",
        });

      if (new Date().getTime() > meme.createdAt.getTime() + 1000 * 60 * 15)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Sözlüğe en fazla 15 dakika içinde eklenmiş olmalı.",
        });

      return await ctx.prisma.dictionaryMeme.delete({ where: { name: input } });
    }),
});
