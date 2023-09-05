import { TRPCError } from "@trpc/server";
import { env } from "~/env.mjs";

export async function discordFetch<T>(path: string, options: RequestInit) {
  options.headers = {
    ...options.headers,
    Authorization: `Bot ${env.DISCORD_TOKEN}`,
  };

  const url = `https://discord.com/api/v10/${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    switch (res.status) {
      case 401:
        throw new TRPCError({ code: "UNAUTHORIZED", message: res.statusText });
      case 403:
        throw new TRPCError({ code: "FORBIDDEN", message: res.statusText });
      case 404:
        throw new TRPCError({ code: "NOT_FOUND", message: res.statusText });
      case 429:
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limited: ${
            res.headers.get("X-RateLimit-Reset-After") || "unknown"
          }`,
          cause: res.statusText,
        });

      default:
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch ${url}: ${res.status} ${res.statusText}`,
        });
    }
  }
  if (res.status === 204) return undefined;
  return (await res.json()) as T;
}
