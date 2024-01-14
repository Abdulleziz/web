/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { useChannel } from "ably/react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { Wheel } from "react-custom-roulette";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const TestComponent = () => {
  const session = useSession();
  const utils = api.useContext();
  const join = api.gamble.join.useMutation();
  const game = api.gamble.state.useQuery();
  const [realtimeLogs, setRealtimeLogs] = useState<Array<string>>([]);
  const [historicalLogs, setHistoricalLogs] = useState<Array<string>>([]);

  const { channel } = useChannel("gamble:roulette-1", (message) => {
    void utils.gamble.invalidate();
    console.log(message);
    setRealtimeLogs((prev) => [
      ...prev,
      `✉️ event name: ${message.name} text: ${message.data}`,
    ]);
  });

  useEffect(() => {
    const getHistory = async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      let history = await channel.history({ start: twoHoursAgo.getTime() });
      do {
        history.items.forEach((message) => {
          setHistoricalLogs((prev) => [
            ...prev,
            `"${message.data}" sent at ${new Date(
              message.timestamp
            ).toLocaleString()}`,
          ]);
        });
        history = await history.next();
      } while (history);
    };
    void getHistory();
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

  return (
    <div>
      <h1>Test</h1>
      <h2>Realtime (State: {channel.state})</h2>
      <ul>
        {realtimeLogs.map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>

      <h2>Historical</h2>
      <ul>
        {historicalLogs.map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>

      <div>
        <div className="flex items-center justify-center">
          <Wheel
            mustStartSpinning={!!endedInRecently}
            prizeNumber={game.data?.resultIndex ?? 0}
            spinDuration={2}
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
            <div>Game State: {JSON.stringify(game.data)}</div>
            {startingAt && (
              <div>Starting at {startingAt.toLocaleString("tr-TR")}</div>
            )}
            <Button
              disabled={join.isLoading || !!startingAt || endedInRecently}
              isLoading={join.isLoading}
              onClick={() => join.mutate()}
            >
              {startingAt ? "Katıl" : "Başlat"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Wheel
            mustStartSpinning={true}
            prizeNumber={0}
            backgroundColors={["#247F43", "#5862F0", "#415448", "#5A2F2A"]}
            data={[
              { option: "10" },
              { option: "20" },
              { option: "30" },
              { option: "40" },
              { option: "50" },
              { option: "100" },
              { option: "10" },
              { option: "20" },
              { option: "30" },
              { option: "40" },
              { option: "50" },
              { option: "100" },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
