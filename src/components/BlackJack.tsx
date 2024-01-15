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

const BlackJackComponent = () => {
  const users = useGetAbdullezizUsers();
  const session = useSession();
  const utils = api.useContext();
  const join = api.gamble.blackjack.join.useMutation();
  const game = api.gamble.blackjack.state.useQuery();
  const [realtimePresence, setRealtimePresence] = useState<
    Array<Types.PresenceMessage>
  >([]);
  const [realtimeLogs, setRealtimeLogs] = useState<Array<Types.Message>>([]);
  const [historicalLogs, setHistoricalLogs] = useState<Array<Types.Message>>(
    []
  );

  const { channel } = useChannel("gamble:blackjack", (event) => {
    void utils.gamble.blackjack.invalidate();
    if (event.name.startsWith("draw")) {
      const [, playerId] = event.name.split(".");
      if (playerId === "dealer") toast.success(`Kurpiyer kart çekti.`);
      else
        toast.success(
          `${
            users.data?.find((u) => u.id === playerId)?.user.username ??
            playerId
          } kart çekti.`
        );
    }
    if (event.name === "created")
      toast.loading("Oyun oluşturuldu, 10 saniye içinde başlayacak.", {
        id: event.data as string,
      });
    if (event.name === "started")
      toast.success("Oyun başladı. İyi şanslar!", { id: event.data as string });
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
              {realtimeLogs.map((log, i) => (
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
                {historicalLogs.map((log) => (
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
                        {presence.action}:{" "}
                        {users.data?.find((u) => u.id === presence.clientId)
                          ?.user.username ?? presence.clientId}
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
              <h2 className="text-2xl font-bold text-white">Kurpiyer</h2>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center space-x-4 md:flex-row">
              {Object.entries(game.data.players).map(([playerId, cards]) => (
                <div
                  key={playerId}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="flex items-center justify-center space-x-4">
                    {cards.map((card, i) => (
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
                      .username ?? playerId}
                  </h2>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center space-x-2">
              <Button
                className="w-24"
                disabled={
                  !selfJoined || game.data.turn !== session.data?.user.id
                }
              >
                Hit
              </Button>
              <Button
                className="w-24"
                disabled={
                  !selfJoined || game.data.turn !== session.data?.user.id
                }
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
            </div>
            <span>
              Sıra:{" "}
              {game.data.turn === "dealer"
                ? "Kurpiyer"
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
