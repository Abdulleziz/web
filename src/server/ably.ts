import Ably from "ably/promises";
import { env } from "~/env.mjs";

export const ablyRest = new Ably.Rest({
  key: env.ABLY_API_KEY,
  log: {
    handler(msg) {
      console.log("[Ably Server Handler]: ", msg);
    },
  },
});
