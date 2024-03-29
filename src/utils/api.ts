/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import { type TRPCClientError, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type TRPCClientErrorLike } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import { toast } from "react-hot-toast";
import superjson from "superjson";
import { env } from "~/env.mjs";

import { type AppRouter } from "~/server/api/root";

export const getDomainUrl = () => {
  switch (env.NEXT_PUBLIC_VERCEL_ENV) {
    case "production":
      return "https://abdulleziz.com" as const;
    case "preview":
      return "https://dev.abdulleziz.com" as const;
    case "development":
      return `http://localhost:${process.env.PORT ?? 3000}` as const;
  }
};

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

type TRPCError = TRPCClientError<AppRouter>;

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: false,
            onError(err) {
              console.error(err);
              const e = err as TRPCError;
              if (e.data?.code === "INTERNAL_SERVER_ERROR")
                toast.error(e.message, { id: e.data.path });
            },
          },
          mutations: {
            retry: false,
          },
        },
      },

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type RouterErrors = TRPCClientErrorLike<AppRouter>;
