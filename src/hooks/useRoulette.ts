/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type Types } from "ably";
import { useChannel, usePresence } from "ably/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";

const CHANNEL = "gamble:roulette-1";

export function useRoulette() {
  const utils = api.useContext();

  const [logs, setLogs] = useState<Array<Types.Message>>([]);
  const [liveLogs, setLiveLogs] = useState<Array<Types.Message>>([]);
  const [presence, setPresence] = useState<Array<Types.PresenceMessage>>([]);

  const { channel } = useChannel(CHANNEL, (event) => {
    const id = `gamble:roulette-1:${event.data}`;
    void utils.gamble.roulette.invalidate();
    if (event.name === "created")
      toast.loading(`Rulet-1 ${event.data} başladı!`, { id });
    if (event.name === "done")
      toast.success(`Rulet-1 ${event.data} bitti!`, { id });
    setLiveLogs((prev) => [...prev, event]);
  });

  usePresence(channel.name, {}, (_presence) => {
    void channel.presence.get().then(setPresence);
  });

  useEffect(() => {
    const getHistory = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      let history = await channel.history({ start: twoHoursAgo.getTime() });
      do {
        history.items.forEach((event) => {
          setLogs((prev) => [...prev, event]);
        });
        history = await history.next();
      } while (history);
    };
    getHistory().catch(console.error);
  }, [channel]);

  return [channel, liveLogs, presence, logs] as const;
}
