/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { useChannel, usePresence } from "ably/react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { Wheel } from "react-custom-roulette";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { type Types } from "ably";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";

const RouletteComponent = () => {
  const users = useGetAbdullezizUsers();
  const session = useSession();
  const utils = api.useContext();
  const join = api.gamble.roulette.join.useMutation();
  const game = api.gamble.roulette.state.useQuery();
  const [realtimePresence, setRealtimePresence] = useState<
    Array<Types.PresenceMessage>
  >([]);
  const [realtimeLogs, setRealtimeLogs] = useState<Array<Types.Message>>([]);
  const [historicalLogs, setHistoricalLogs] = useState<Array<Types.Message>>(
    []
  );

  const { channel } = useChannel("gamble:roulette-1", (event) => {
    const id = `gamble:roulette-1:${event.data}`;
    void utils.gamble.roulette.invalidate();
    if (event.name === "started")
      toast.loading(`Rulet-1 ${event.data} başladı!`, { id });
    if (event.name === "done")
      toast.success(`Rulet-1 ${event.data} bitti!`, { id });
    console.log(event);
    setRealtimeLogs((prev) => [...prev, event]);
  });

  usePresence(channel.name, {}, (presence) => {
    console.log({ presence });
    void channel.presence.get().then((users) => {
      setRealtimePresence(users.map((presence) => presence));
    });
  });

  useEffect(() => {
    const getHistory = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      let history = await channel.history({ start: twoHoursAgo.getTime() });
      do {
        history.items.forEach((event) => {
          setHistoricalLogs((prev) => [...prev, event]);
        });
        history = await history.next();
      } while (history);
    };
    getHistory().catch(console.error);
  }, [channel]);

  const startingAt =
    game.data?.startedAt && !game.data?.endedAt
      ? new Date(game.data.startedAt.getTime() + 10 * 1000)
      : undefined;

  const endedInRecently =
    game.data?.endedAt && game.data.endedAt.getTime() + 10 * 1000 > Date.now();

  const selfJoined = game.data?.players.some(
    (player) => player === session.data?.user.id
  );
  const canJoin = !selfJoined || !startingAt;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1>Gamble House</h1>
          <h2>Realtime (State: {channel.state})</h2>
          <ul>
            {realtimeLogs.map((log, i) => (
              <li
                key={i}
              >{`✉️ Gamble Roulette 1: event: ${log.name} gameId: ${log.data}`}</li>
            ))}
          </ul>

          <ScrollArea className="h-72 w-48 rounded-md border">
            <div className="p-4">
              <h4 className="mb-4 text-sm font-medium leading-none">History</h4>
              {historicalLogs.map((log) => (
                <>
                  <div key={log.id} className="text-sm">
                    {`"Gamble Roulette 1: history event: ${log.name} gameId: ${
                      log.data
                    }" sent at ${new Date(log.timestamp).toLocaleString()}`}
                  </div>
                  <Separator className="my-2" />
                </>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div>
          <div className="flex flex-row items-center justify-center gap-2">
            <ScrollArea className="h-72 w-48 rounded-md border">
              <div className="p-4">
                <h4 className="mb-4 text-sm font-medium leading-none">
                  Realtime Events ({realtimeLogs.length})
                </h4>
                {realtimeLogs.map((log) => (
                  <>
                    <div key={log.id} className="text-sm">
                      {`✉️ Gamble Roulette 1: event: ${log.name} gameId: ${log.data}`}
                    </div>
                    <Separator className="my-2" />
                  </>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-72 w-48 rounded-md border">
              <div className="p-4">
                <h4 className="mb-4 text-sm font-medium leading-none">
                  Users ({realtimePresence.length})
                </h4>
                {realtimePresence.map((presence) => (
                  <>
                    <div key={presence.id} className="text-sm">
                      {presence.action}:{" "}
                      {users.data?.find((u) => u.id === presence.clientId)?.user
                        .username ?? presence.clientId}
                    </div>
                    <Separator className="my-2" />
                  </>
                ))}
              </div>
            </ScrollArea>
          </div>
          {startingAt && !endedInRecently && (
            <>(Roulette-1): Playing Now: {game.data?.players.length}</>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-center">
          <Wheel
            mustStartSpinning={!!endedInRecently}
            prizeNumber={game.data?.resultIndex ?? 0}
            spinDuration={2}
            perpendicularText={true}
            backgroundColors={["#009900", "#999900", "#999999", "#A52A2A"]}
            onStopSpinning={() => {
              if (!game.data?.endedAt) return;
              const data = game.data;
              toast.success(
                `Kumardan kazanılan: ${data.options[data.resultIndex]?.option}`
              );
              void game.refetch();
            }}
            data={
              game.data?.options ??
              Array.from({ length: 12 }, () => ({ option: "1-100" }))
            }
          />
          <div>
            <div>
              Game State: (id: {game.data?.gameId})
              <div>
                (startedAt:{" "}
                {game.data?.startedAt.toLocaleString("tr-TR", {
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                })}
                )
              </div>
              <div>
                (endedAt:{" "}
                {game.data?.endedAt?.toLocaleString("tr-TR", {
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                })}
                )
              </div>
              <div>(resultIndex: {game.data?.resultIndex}) </div>
              <div className="text-green-700">
                (result:{" "}
                {game.data?.options?.at(game.data?.resultIndex)?.option}){" "}
              </div>
              <div>(players: {game.data?.players.join(", ")}) </div>
              (options:{" "}
              {game.data?.options
                ?.map((option, i) => String(i) + ": " + option.option)
                .join(", ")}
              )
            </div>
            {startingAt && (
              <div>
                Starting at{" "}
                {startingAt.toLocaleString("tr-TR", {
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                })}
              </div>
            )}
            <Button
              disabled={join.isLoading || endedInRecently || !canJoin}
              isLoading={join.isLoading}
              onClick={() => join.mutate()}
            >
              {startingAt ? "Katıl" : "Başlat"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center p-4">
          <Wheel
            mustStartSpinning={true}
            prizeNumber={0}
            spinDuration={2}
            backgroundColors={["darkgrey", "lightgrey"]}
            data={Array.from({ length: 37 }, (_, i) => ({
              option: i.toString(),
              style: {
                backgroundColor:
                  i === 0 ? "green" : i % 2 === 0 ? "black" : "#6e0302",
                textColor: "white",
              },
            }))}
            textDistance={80}
            innerBorderColor="#504440"
            outerBorderColor="#2a2422"
            outerBorderWidth={15}
            innerBorderWidth={15}
            innerRadius={40}
            radiusLineColor="#ebb28c"
            radiusLineWidth={2}
            perpendicularText={true}
          />
        </div>
      </div>
    </div>
  );
};

export default RouletteComponent;
