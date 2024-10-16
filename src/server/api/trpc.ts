/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";
import { env } from "~/env.mjs";

import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";
import { ablyRest } from "~/server/ably";
import webPush, { WebPushError } from "web-push";

type CreateContextOptions = {
  session: Session | null;
};

webPush.setVapidDetails(
  "mailto:contact@abdulleziz.com",
  env.NEXT_PUBLIC_VAPID_KEY,
  env.VAPID_SECRET_KEY
);
// actions is experimental: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification#actions
type Actions = { action: string; title: string; icon?: string }[];
type Options = NotificationOptions & { title: string; actions?: Actions };

/**
 * @param title 40 to 75 characters
 * @param body 50 to 225 characters
 */
export const sendNotification = async <Sub extends PushSubscription>(
  subs: Sub[],
  body: Options | ((sub: Sub) => Options),
  options?: webPush.RequestOptions | ((sub: Sub) => webPush.RequestOptions)
) => {
  return await Promise.all(
    subs.map(async (sub) => {
      try {
        const jsonBody = typeof body === "function" ? body(sub) : body;
        const option = typeof options === "function" ? options(sub) : options;
        const res = await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          },
          JSON.stringify({
            ...jsonBody,
            icon: jsonBody.icon || "/android-chrome-192x192.png",
          }),
          option
        );
        console.log("push notification send", res);
        return res;
      } catch (error) {
        console.error(error);
        if (error instanceof WebPushError) {
          if (error.statusCode === 410) {
            // subscription has unsubscribed or expired
            await prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            });
            return "expired";
          }
        }
      }
    })
  );
};

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    ablyRest,
    sendNotification,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerAuthSession({ req, res });

  return {
    ...createInnerTRPCContext({
      session,
    }),
    req,
    res,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";
import { DiscordId } from "~/utils/zod-utils";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.issues.map((issue) => issue.message).join("\n\n")
            : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/** Reusable middleware that enforces users are logged in before running the procedure. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (
    !ctx.session ||
    !ctx.session.user ||
    !ctx.session.user.inAbdullezizServer
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Henüz Abdülleziz'e kayıtlı değilsin! Lütfen kayıt ol!",
    });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

const UserIdWithToken = z.object({
  "x-abdulleziz-user-id": DiscordId,
  authorization: z.literal(env.DISCORD_TOKEN),
});

const enforceIsInternal = t.middleware(async ({ ctx, next }) => {
  const parsed = UserIdWithToken.safeParse(ctx.req.headers);
  if (!parsed.success)
    return next({ ctx: { ...ctx, internalDiscordId: null } });

  const discordId = parsed.data["x-abdulleziz-user-id"];

  const user = await prisma.user.findFirst({
    where: { accounts: { some: { providerAccountId: discordId } } },
  });

  const context = user
    ? {
        ...ctx,
        session: {
          user: { ...user, discordId, inAbdullezizServer: true },
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        } satisfies Session,
      }
    : { ...ctx, session: null, internalDiscordId: discordId };

  return next({ ctx: context });
});

export const internalProcedure = t.procedure.use(enforceIsInternal);

const upstashSignature = z.object({
  "upstash-signature": z.string({
    invalid_type_error: "invalid header `upstash-signature`, must be a string",
    required_error: "missing upstash signature",
  }),
});

export const verifySignatureMiddleware = t.middleware(
  async ({ ctx, next, rawInput }) => {
    const parsed = upstashSignature.safeParse(ctx.req.headers);
    if (!parsed.success)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: parsed.error.message,
      });

    // TODO: edge supported ?
    const receiver = new Receiver({
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    });

    try {
      const verified = await receiver.verify({
        signature: parsed.data["upstash-signature"],
        body: superjson.stringify(rawInput),
      });

      if (!verified) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "invalid signature",
        });
      }
    } catch (error) {
      console.error("Invalid Upstash Signature", error);
      if (error instanceof SignatureError) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message,
        });
      }
      throw error;
    }

    return next({ ctx });
  }
);

export const qstashProcedure = t.procedure.use(verifySignatureMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = internalProcedure.use(enforceUserIsAuthed);

import { type AbdullezizPerm, permissionDecider } from "~/utils/abdulleziz";
import { getAbdullezizRoles } from "../discord-api/utils";
import { getGuildMemberWithRoles } from "../discord-api/trpc";
import { type PushSubscription } from "@prisma/client";
import { Receiver, SignatureError } from "@upstash/qstash";

export const createPermissionProcedure = (requiredPerms: AbdullezizPerm[]) =>
  internalProcedure.use(
    enforceUserIsAuthed.unstable_pipe(async ({ ctx, next }) => {
      const member = await getGuildMemberWithRoles(ctx.session.user.discordId);
      const verifiedRoles = getAbdullezizRoles(member.roles);
      const verifiedPerms = permissionDecider(verifiedRoles.map((r) => r.name));

      if (
        requiredPerms.length &&
        !verifiedPerms.some((perm) => requiredPerms.includes(perm))
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Yetersiz yetki" });
      }
      return next({
        ctx: {
          ...ctx,
          member,
          verifiedRoles,
          verifiedPerms,
        },
      });
    })
  );

export const permissionProcedure = createPermissionProcedure([]);
