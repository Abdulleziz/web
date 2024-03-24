import * as Ably from "ably/promises";
import { AblyProvider } from "ably/react";

export default function Provider({ children }: { children: React.ReactNode }) {
  const client = new Ably.Realtime({
    authUrl: "/api/ablyToken",
    log: {
      handler(msg) {
        console.log("[Ably]: ", msg);
      },
    },
  });

  return <AblyProvider client={client}>{children}</AblyProvider>;
}
