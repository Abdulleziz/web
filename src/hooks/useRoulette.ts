/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type Types } from "ably";
import { useChannel, usePresence } from "ably/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import superjson from "superjson";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";

const CHANNEL = "gamble:roulette-1";

export function useRoulette() {
  const users = useGetAbdullezizUsers();
  const utils = api.useContext();

  const [logs, setLogs] = useState<Array<Types.Message>>([]);
  const [liveLogs, setLiveLogs] = useState<Array<Types.Message>>([]);
  const [presence, setPresence] = useState<Array<Types.PresenceMessage>>([]);

  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }

  const { channel } = useChannel(CHANNEL, (event) => {
    const id = `gamble:roulette-1:${event.data}`;
    void utils.gamble.roulette.invalidate();
    if (event.name === "created")
      toast.loading(`Rulet-1 ${event.data} başladı!`, { id });
    if (event.name === "done")
      toast.success(`Rulet-1 ${event.data} bitti!`, { id });
    if (event.name === "joined") {
      const data = superjson.parse<{
        gameId: string;
        userId: string;
      }>(event.data as string);
      toast.success(`Rulet-1 ${getUsername(data.userId)} katıldı!`);
    }
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
