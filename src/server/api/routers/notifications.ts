import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notificationsRouter = createTRPCRouter({
  getToken: protectedProcedure.mutation(({ ctx }) => {
    return ctx.pushNotification.generateToken(ctx.session.user.id);
  }),
});
