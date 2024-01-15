/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { useChannel, usePresence } from "ably/react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { type Types } from "ably";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";
import { cx } from "class-variance-authority";
import {
  type Card as DeckCard,
  getScore,
} from "~/server/api/routers/gamble/blackjack/api";

const BlackJackComponent = () => {
  const users = useGetAbdullezizUsers();
  const session = useSession();
  const utils = api.useContext();
  const join = api.gamble.blackjack.join.useMutation();
  const game = api.gamble.blackjack.state.useQuery();
  const _delete = api.gamble.blackjack._delete.useMutation();
  const hit = api.gamble.blackjack.hit.useMutation();
  const stand = api.gamble.blackjack.stand.useMutation();
  const [realtimePresence, setRealtimePresence] = useState<
    Array<Types.PresenceMessage>
  >([]);
  const [realtimeLogs, setRealtimeLogs] = useState<Array<Types.Message>>([]);
  const [historicalLogs, setHistoricalLogs] = useState<Array<Types.Message>>(
    []
  );

  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }

  function getEventName(name: string) {
    if (name.includes(".")) {
      const [event, playerId] = name.split(".");
      return [event, playerId];
    }

    return [name, undefined];
  }

  const { channel } = useChannel("gamble:blackjack", (event) => {
    void utils.gamble.blackjack.invalidate();
    const duration = 5000;
    const [eventName, playerId] = getEventName(event.name);
    if (eventName === "draw") {
      if (playerId === "dealer")
        toast.success(`Kurpiye kart çekti.`, { duration });
      else toast.success(`${getUsername(playerId)} kart çekti.`, { duration });
    }

    if (eventName === "bust") {
      if (playerId === "dealer") toast.success(`Kurpiye battı.`, { duration });
      else toast.success(`${getUsername(playerId)} battı.`, { duration });
    }

    if (eventName === "stand") {
      if (playerId === "dealer")
        toast.success(`Kurpiye pas geçti.`, { duration });
      else toast.success(`${getUsername(playerId)} pas geçti.`, { duration });
    }

    if (eventName === "win") {
      if (playerId === "dealer")
        toast.success(`Kurpiye kazandı.`, { duration });
      else toast.success(`${getUsername(playerId)} kazandı.`, { duration });
    }

    if (eventName === "tie") {
      if (playerId === "dealer")
        toast.success(`Kurpiye berabere.`, { duration });
      else toast.success(`${getUsername(playerId)} berabere.`, { duration });
    }

    if (eventName === "lose") {
      if (playerId === "dealer")
        toast.success(`Kurpiye kaybetti.`, { duration });
      else toast.success(`${getUsername(playerId)} kaybetti.`, { duration });
    }

    if (event.name === "created")
      toast.loading("Oyun oluşturuldu, 10 saniye içinde başlayacak.", {
        id: event.data as string,
      });
    if (event.name === "started")
      toast.success("Oyun başladı. İyi şanslar!", {
        id: event.data as string,
        duration,
      });
    if (event.name === "ended") toast.success("Oyun bitti.", { duration });
    if (eventName === "show" && playerId === "dealer")
      toast.success("Kurpiye kartını gösterdi.", { duration });
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

  const started = game.data && game.data.startingAt < new Date();

  const selfJoined =
    session.data?.user.id && game.data?.players
      ? !!game.data?.players[session.data.user.id]
      : false;

  const canJoin = !selfJoined || !started;

  return (
    <div>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-green-900">
        <div className="flex flex-1 flex-col items-center justify-between lg:flex-row">
          <div>
            <h1>Gamble House</h1>
            <h2>Realtime (State: {channel.state})</h2>
            <ul>
              {realtimeLogs.slice(0, 20).map((log, i) => (
                <li
                  key={i}
                >{`✉️ Gamble BlackJack: event: ${log.name} gameId: ${log.data}`}</li>
              ))}
            </ul>

            <ScrollArea className="h-72 w-48 rounded-md border">
              <div className="p-4">
                <h4 className="mb-4 text-sm font-medium leading-none">
                  History
                </h4>
                {historicalLogs.slice(0, 20).map((log) => (
                  <>
                    <div key={log.id} className="text-sm">
                      {`"Gamble BlackJack: history event: ${log.name} gameId: ${
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
                        {`✉️ Gamble BlackJack: event: ${log.name} gameId: ${log.data}`}
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
                        {presence.action}: {getUsername(presence.clientId)}
                      </div>
                      <Separator className="my-2" />
                    </>
                  ))}
                </div>
              </ScrollArea>
            </div>
            {started && (
              <>(BlackJack): Playing Now: {game.data?.players.length}</>
            )}
          </div>
        </div>

        {game.data ? (
          <div className="flex w-full max-w-5xl flex-col items-center justify-center rounded-lg bg-green-500 p-8 shadow-lg">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                {game.data.dealer.cards.map((card, i) => (
                  <Card key={card.image + String(i)} className="bg-red-500">
                    <CardContent className="flex items-center justify-center pt-6">
                      <Image
                        src={card.image}
                        width={80}
                        height={80}
                        alt={card.image}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <h2 className="text-2xl font-bold text-white">
                Kurpiye (
                {getScore(
                  game.data.dealer.cards.filter((c) => !c.hidden) as DeckCard[]
                )}
                )
              </h2>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center space-x-4 md:flex-row">
              {Object.entries(game.data.players).map(([playerId, player]) => (
                <div
                  key={playerId}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="flex items-center justify-center space-x-4">
                    {player.cards.map((card, i) => (
                      <Card
                        key={card.image + String(i)}
                        className={cx(
                          playerId === session.data?.user.id
                            ? "bg-blue-500"
                            : "bg-red-500"
                        )}
                      >
                        <CardContent className="flex items-center justify-center p-6">
                          <Image
                            src={card.image}
                            width={80}
                            height={80}
                            alt={card.image}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {users.data?.find((u) => u.id === playerId)?.user
                      .username ?? playerId}{" "}
                    ({getScore(player.cards)})
                  </h2>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center space-x-2">
              {game.data.endedAt ? (
                <>
                  <Button className="w-24" onClick={() => join.mutate()}>
                    Yeni Oyuna Başla
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-24"
                    disabled={
                      !selfJoined || game.data.turn !== session.data?.user.id
                    }
                    onClick={() => hit.mutate()}
                  >
                    Hit
                  </Button>
                  <Button
                    className="w-24"
                    disabled={
                      !selfJoined || game.data.turn !== session.data?.user.id
                    }
                    onClick={() => stand.mutate()}
                  >
                    Stand
                  </Button>
                  <Button
                    className="w-24"
                    disabled={
                      !selfJoined || game.data.turn !== session.data?.user.id
                    }
                  >
                    Double Down
                  </Button>
                  <Button
                    className="w-24"
                    disabled={
                      !selfJoined || game.data.turn !== session.data?.user.id
                    }
                  >
                    Deal
                  </Button>
                  <Button
                    onClick={() => _delete.mutate()}
                    variant={"destructive"}
                    className="w-24"
                  >
                    End Game
                  </Button>
                </>
              )}
            </div>
            <span>
              Sıra:{" "}
              {game.data.turn === "dealer"
                ? "Kurpiye"
                : users.data?.find((u) => u.id === game.data?.turn)?.user
                    .username ?? game.data.turn}
            </span>
          </div>
        ) : (
          <div>
            <Button
              disabled={!canJoin}
              onClick={() => {
                join.mutate();
              }}
            >
              Yeni oyun başlat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackJackComponent;
