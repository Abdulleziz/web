/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type Types } from "ably";
import { useChannel, usePresence } from "ably/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import superjson from "superjson";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";

export function useRoulette(channelName: string, displayName: string) {
  const users = useGetAbdullezizUsers();
  const utils = api.useContext();

  const [logs, setLogs] = useState<Array<Types.Message>>([]);
  const [liveLogs, setLiveLogs] = useState<Array<Types.Message>>([]);
  const [presence, setPresence] = useState<Array<Types.PresenceMessage>>([]);

  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }

  const { channel } = useChannel(channelName, (event) => {
    const id = `${channelName}:${event.data}`;
    void utils.gamble.roulette.invalidate();
    if (event.name === "created")
      toast.loading(`${displayName} ${event.data} başladı!`, { id });
    if (event.name === "done")
      toast.success(`${displayName} ${event.data} bitti!`, { id });
    if (event.name === "joined") {
      const data = superjson.parse<{
        gameId: string;
        userId: string;
      }>(event.data as string);
      toast.success(`${displayName} ${getUsername(data.userId)} katıldı!`);
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

export const SINGLE_ZERO_WHEEL = [
  "0",
  "32",
  "15",
  "19",
  "4",
  "21",
  "2",
  "25",
  "17",
  "34",
  "6",
  "27",
  "13",
  "36",
  "11",
  "30",
  "8",
  "23",
  "10",
  "5",
  "24",
  "16",
  "33",
  "1",
  "20",
  "14",
  "31",
  "9",
  "22",
  "18",
  "29",
  "7",
  "28",
  "12",
  "35",
  "3",
  "26",
] as const;

export const DOUBLE_ZERO_WHEEL = [
  "0",
  "28",
  "9",
  "26",
  "30",
  "11",
  "7",
  "20",
  "32",
  "17",
  "5",
  "22",
  "34",
  "15",
  "3",
  "24",
  "36",
  "13",
  "1",
  "00",
  "27",
  "10",
  "25",
  "29",
  "12",
  "8",
  "19",
  "31",
  "18",
  "6",
  "21",
  "33",
  "16",
  "4",
  "23",
  "35",
  "14",
  "2",
] as const;
