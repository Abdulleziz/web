import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { nonEmptyString } from "~/utils/zod-utils";

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
});
