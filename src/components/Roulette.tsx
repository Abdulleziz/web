/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { Wheel } from "react-custom-roulette";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import { DOUBLE_ZERO_WHEEL, useRoulette } from "~/hooks/useRoulette";
import { useState } from "react";
import { type Types } from "ably";
import { useChannel, usePresence } from "ably/react";

const MAIN_CHANNEL = "gamble:roulette";

const RouletteComponent = () => {
  const users = useGetAbdullezizUsers();
  const wheelGame = api.gamble.roulette.wheel.state.useQuery();

  const [presence, setPresence] = useState<Array<Types.PresenceMessage>>([]);

  const { channel } = useChannel(MAIN_CHANNEL);
  usePresence(MAIN_CHANNEL, {}, () => {
    void channel.presence.get().then(setPresence);
  });

  const wheelStartingAt =
    wheelGame.data?.createdAt && !wheelGame.data?.endedAt
      ? new Date(wheelGame.data.createdAt.getTime() + 10 * 1000)
      : undefined;

  const wheelEndedInRecently =
    wheelGame.data?.endedAt &&
    wheelGame.data.endedAt.getTime() + 10 * 1000 > Date.now();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1>Gamble House</h1>
          <h2>Realtime (State: {channel.state})</h2>
        </div>
        <div>
          <div className="hidden flex-row items-center justify-center gap-2 p-4 md:flex">
            <ScrollArea className="h-72 w-48 rounded-md border">
              <div className="p-4">
                <h4 className="mb-4 text-sm font-medium leading-none">
                  Users ({presence.length})
                </h4>
                {presence.map((presence) => (
                  <div key={presence.id} className="text-sm">
                    {presence.action}:{" "}
                    {users.data?.find((u) => u.id === presence.clientId)?.user
                      .username ?? presence.clientId}
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          {wheelStartingAt && !wheelEndedInRecently && (
            <span>
              (Roulette-Wheel): Playing Now: {wheelGame.data?.players.length}
            </span>
          )}
        </div>
      </div>

      <div>
        <RouletteClassical />
        <RouletteWheel />
      </div>
    </div>
  );
};

const RouletteWheel = () => {
  const session = useSession();
  const join = api.gamble.roulette.wheel.join.useMutation();
  const game = api.gamble.roulette.wheel.state.useQuery();

  const [channel, liveLogs, presence, logs] = useRoulette(
    "gamble:roulette-wheel",
    "Şans Ruleti"
  );

  const startingAt =
    game.data?.createdAt && !game.data?.endedAt
      ? new Date(game.data.createdAt.getTime() + 10 * 1000)
      : undefined;

  const endedInRecently =
    game.data?.endedAt && game.data.endedAt.getTime() + 10 * 1000 > Date.now();

  const selfJoined = game.data?.players.some(
    (player) => player === session.data?.user.id
  );
  const canJoin = !selfJoined || !startingAt;

  return (
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
          <p>Luck Roulette</p>
          Game State: (id: {game.data?.gameId})
          <div>
            (createdAt:{" "}
            {game.data?.createdAt.toLocaleString("tr-TR", {
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
            (result: {game.data?.options?.at(game.data.resultIndex)?.option}){" "}
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
  );
};

const RouletteClassical = () => {
  const session = useSession();
  const join = api.gamble.roulette.classical.join.useMutation();
  const game = api.gamble.roulette.classical.state.useQuery();

  const [channel, liveLogs, presence, logs] = useRoulette(
    "gamble:roulette-classical",
    "Şans Ruleti"
  );

  const startingAt =
    game.data?.createdAt && !game.data?.endedAt
      ? new Date(game.data.createdAt.getTime() + 10 * 1000)
      : undefined;

  const endedInRecently =
    game.data?.endedAt && game.data.endedAt.getTime() + 10 * 1000 > Date.now();

  const selfJoined = game.data?.players.some(
    (player) => player === session.data?.user.id
  );
  const canJoin = !selfJoined || !startingAt;

  const options = DOUBLE_ZERO_WHEEL.map((val) => ({
    option: val,
    style: {
      backgroundColor:
        +val === 0 ? "green" : +val % 2 === 0 ? "black" : "#6e0302",
      textColor: "white",
    },
  }));

  return (
    <div className="flex items-center justify-center">
      <Wheel
        mustStartSpinning={!!endedInRecently}
        prizeNumber={game.data?.resultIndex ?? 0}
        spinDuration={2}
        backgroundColors={["darkgrey", "lightgrey"]}
        data={options}
        onStopSpinning={() => {
          if (!game.data?.endedAt) return;
          const { resultIndex } = game.data;
          toast.success(`Kumardan kazanılan: ${options[resultIndex]?.option}`);
          void game.refetch();
        }}
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

      <div>
        <div>
          <p>Double Zero Roulette</p>
          Game State: (id: {game.data?.gameId})
          <div>
            (createdAt:{" "}
            {game.data?.createdAt.toLocaleString("tr-TR", {
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
          {game.data?.resultIndex && (
            <div className="text-green-700">
              (result: {options.at(game.data.resultIndex)?.option}){" "}
            </div>
          )}
          <div>(players: {game.data?.players.join(", ")})</div>
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
  );
};

export default RouletteComponent;
