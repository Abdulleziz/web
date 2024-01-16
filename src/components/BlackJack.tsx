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
import Image from "next/image";
import { cx } from "class-variance-authority";
import {
  type Card as DeckCard,
  getScore,
  CARD_BACK,
  cardImage,
} from "~/server/api/routers/gamble/blackjack/api";
import superjson from "superjson";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useTime } from "~/hooks/useTime";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const BlackJackComponent = () => {
  const time = useTime({ n: 100 });
  const users = useGetAbdullezizUsers();
  const session = useSession();
  const utils = api.useContext();
  const [dealerRef] = useAutoAnimate();
  const [playerRef] = useAutoAnimate();
  const join = api.gamble.blackjack.join.useMutation();
  const game = api.gamble.blackjack.state.useQuery();
  const _delete = api.gamble.blackjack._delete.useMutation();
  const hit = api.gamble.blackjack.hit.useMutation();
  const stand = api.gamble.blackjack.stand.useMutation();
  const [bet, setBet] = useState(0);
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
    const duration = 5000;
    const [eventName, playerId] = getEventName(event.name);

    if (eventName === "draw") {
      const eventData = superjson.parse<{
        gameId: string;
        card: DeckCard | null;
      }>(event.data as string);
      if (playerId === "dealer") {
        utils.gamble.blackjack.state.setData(undefined, (data) => {
          data?.dealer.cards.push(
            eventData.card
              ? { ...eventData.card, hidden: false }
              : { image: CARD_BACK, hidden: true }
          );
          return { ...data } as typeof data;
        });
      } else {
        if (eventData.card && playerId) {
          utils.gamble.blackjack.state.setData(undefined, (data) => {
            if (!data) return data;
            data.players[playerId]?.cards.push(eventData.card as DeckCard);
            return { ...data };
          });
        }
      }
    }

    if (eventName === "turn") {
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data || !playerId) return data;
        data.turn = playerId;
        return { ...data };
      });
    }

    if (eventName === "show" && playerId === "dealer") {
      const eventData = superjson.parse<{
        gameId: string;
        card: DeckCard & { hidden: false };
      }>(event.data as string);
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data) return data;
        data.dealer.cards = data.dealer.cards.map((card) =>
          card.hidden ? eventData.card : card
        );
        return { ...data };
      });
    }

    if (eventName === "bust") {
      if (playerId === "dealer") toast.success(`Kurpiye battı.`, { duration });
      else toast.success(`${getUsername(playerId)} battı.`, { duration });
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

    if (eventName === "joined") {
      toast.success(`${getUsername(playerId)} katıldı.`, { duration });
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data || !playerId) return data;
        data.players[playerId] = {
          cards: [],
          busted: false,
        };
        return { ...data };
      });
    }

    if (event.name === "created") {
      const eventData = superjson.parse<{
        gameId: string;
        waitFor: number;
        players: NonNullable<typeof game.data>["players"];
      }>(event.data as string);

      toast.loading(
        `Oyun oluşturuldu, ${
          eventData.waitFor / 1000
        } saniye içinde başlayacak.`,
        {
          id: eventData.gameId,
          duration: eventData.waitFor,
        }
      );
      utils.gamble.blackjack.state.setData(undefined, (data) => {
        if (!data) return data;
        data.createdAt = new Date();
        data.startingAt = new Date(Date.now() + eventData.waitFor);
        data.dealer.cards = [];
        data.players = eventData.players;
        data.turn = "dealer";
        data.endedAt = undefined;
        data.gameId = eventData.gameId;
        return { ...data };
      });
      void utils.gamble.blackjack.invalidate();
    }
    if (event.name === "started") {
      toast.success("Oyun başladı, Bahisler kapatıldı. İyi şanslar!", {
        id: event.data as string,
        duration,
      });
    }
    if (event.name === "ended") {
      toast.success("Oyun bitti.", { duration });
      void utils.gamble.blackjack.invalidate();
    }
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
  const gameJoinDuration = game.data
    ? game.data.startingAt.getTime() - game.data.createdAt.getTime()
    : 0;

  const started = game.data && game.data.startingAt < new Date(time);

  const left = Math.max(
    game.data && !started ? game.data.startingAt.getTime() - time : 0,
    0
  );

  const selfJoined =
    session.data?.user.id && game.data?.players
      ? !!game.data?.players[session.data.user.id]
      : false;

  const canJoin = !selfJoined && !started;

  return (
    <div>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-green-900">
        <div>
          <h1>Gamble House</h1>
          <h2>Realtime (State: {channel.state})</h2>
          <div className="flex flex-1 flex-col items-center justify-between lg:flex-row">
            <div>
              <div className="hidden flex-row items-center justify-center gap-2 md:flex">
                <ScrollArea className="h-72 w-48 rounded-md border p-4">
                  <h4 className="mb-4 text-sm font-medium leading-none">
                    History
                  </h4>
                  {historicalLogs.slice(0, 20).map((log) => (
                    <>
                      <div key={log.id} className="text-sm">
                        {`${log.name} gameId: ${log.data}" sent at ${new Date(
                          log.timestamp
                        ).toLocaleString()}`}
                      </div>
                      <Separator className="my-2" />
                    </>
                  ))}
                </ScrollArea>
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
              {started && game.data && (
                <>
                  (BlackJack): Playing Now:{" "}
                  {Object.keys(game.data.players).length}
                </>
              )}
            </div>
          </div>
        </div>

        {game.data ? (
          <div className="flex w-full flex-col items-center justify-center rounded-lg bg-green-700 p-8 shadow-lg">
            {(() => {
              const dealer = game.data.dealer;
              const publicCards = dealer.cards.filter(
                (c) => !c.hidden
              ) as DeckCard[];
              const score = getScore(publicCards);

              return (
                <div className="flex w-full flex-col items-center justify-center space-y-4">
                  {game.data.endedAt && (
                    <h1 className="rounded-lg text-3xl font-bold">
                      Oyun Bitti
                    </h1>
                  )}
                  <div
                    ref={dealerRef}
                    className="flex w-full items-center justify-center gap-4"
                  >
                    {dealer.cards.map((card, i) => (
                      <div key={i} className="bg-red-500">
                        <Image
                          src={cardImage(card)}
                          width={96}
                          height={133}
                          alt={card.hidden ? "hidden" : card.code}
                        />
                      </div>
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Kurpiye (
                    {score == 21 && publicCards.length == 2 ? (
                      <span className="text-blue-300">BlackJack</span>
                    ) : (
                      score
                    )}
                    ){" "}
                    {score > 21 && <span className="text-red-300">Battı</span>}
                  </h2>
                </div>
              );
            })()}
            <div className="mt-8 flex w-full flex-col items-center justify-center space-x-4 md:flex-row">
              {Object.entries(game.data.players)
                .reverse()
                .map(([playerId, player]) => {
                  const score = getScore(player.cards);
                  return (
                    <div
                      key={playerId}
                      className="flex w-full flex-col items-center space-y-2"
                    >
                      <div
                        ref={playerRef}
                        className="flex w-full items-center justify-center space-x-4"
                      >
                        {player.cards.map((card, i) => (
                          <div
                            key={i}
                            className={cx(
                              playerId === session.data?.user.id
                                ? "bg-blue-500"
                                : "bg-red-500"
                            )}
                          >
                            <Image
                              src={cardImage(card)}
                              width={96}
                              height={133}
                              alt={card.code}
                            />
                          </div>
                        ))}
                      </div>
                      <h2
                        className={cx(
                          "text-2xl font-bold",
                          game.data?.turn === playerId
                            ? "text-yellow-400"
                            : "text-white"
                        )}
                      >
                        {getUsername(playerId)} (
                        {score == 21 && player.cards.length == 2 ? (
                          <span className="text-blue-300">BlackJack</span>
                        ) : (
                          score
                        )}
                        ){" "}
                        {player.busted && (
                          <span className="text-red-300">Battı</span>
                        )}
                      </h2>
                    </div>
                  );
                })}
            </div>
            <div className="mt-8 flex items-center justify-center space-x-2">
              {game.data.endedAt ? (
                <>
                  <Button
                    variant={"warning"}
                    onClick={() => join.mutate()}
                    isLoading={join.isLoading}
                    disabled={join.isLoading}
                  >
                    Yeni Oyuna Başla
                  </Button>
                </>
              ) : !selfJoined ? (
                <>
                  <Button
                    variant={"warning"}
                    disabled={!canJoin}
                    onClick={() => {
                      join.mutate();
                    }}
                  >
                    Katıl
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-24"
                    disabled={
                      !selfJoined ||
                      game.data.turn !== session.data?.user.id ||
                      hit.isLoading ||
                      stand.isLoading
                    }
                    isLoading={hit.isLoading}
                    onClick={() => hit.mutate()}
                  >
                    Hit
                  </Button>
                  <Button
                    className="w-24"
                    disabled={
                      !selfJoined ||
                      game.data.turn !== session.data?.user.id ||
                      stand.isLoading ||
                      hit.isLoading
                    }
                    isLoading={stand.isLoading}
                    onClick={() => stand.mutate()}
                  >
                    Stand
                  </Button>
                  {/* <Button
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
                  </Button> */}
                  {session.data?.user.discordId === "223071656510357504" && (
                    <Button
                      onClick={() => _delete.mutate()}
                      variant={"destructive"}
                      className="w-24"
                    >
                      End Game
                    </Button>
                  )}
                </>
              )}
            </div>
            <Dialog open={game.data.startingAt > new Date()}>
              <DialogContent className="font-bold">
                <DialogHeader>
                  <DialogTitle>Oyun başlamak üzere</DialogTitle>
                  <DialogDescription>
                    <p>Kalan süre: {(left / 1000).toFixed()} saniye</p>
                    <p>Bahis: ${bet}</p>
                    <div className="p-4">
                      <div className="flex items-center justify-center gap-2 p-2">
                        {[50, 100, 200, 500].map((amount) => (
                          <Button
                            key={amount}
                            size={"sm"}
                            variant={"outline"}
                            onClick={() =>
                              setBet((prev) => Math.max(prev - amount, 0))
                            }
                          >
                            -{amount}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center justify-center gap-2 p-2">
                        {[50, 100, 200, 500].map((amount) => (
                          <Button
                            key={amount}
                            size={"sm"}
                            onClick={() => setBet((prev) => prev + amount)}
                          >
                            +{amount}
                          </Button>
                        ))}
                      </div>
                      <div className="flex flex-col items-center gap-4 p-4">
                        <div className="flex items-center justify-center gap-4">
                          <Input
                            className="max-w-[8rem]"
                            type="number"
                            min={0}
                            value={bet}
                            onChange={(e) => setBet(e.target.valueAsNumber)}
                          />
                          <Button
                            disabled={bet === 0}
                            variant={"outline"}
                            onClick={() => setBet(0)}
                          >
                            Sıfırla
                          </Button>
                        </div>
                        <Progress value={(left / gameJoinDuration) * 100} />
                        <Button
                          size={"lg-long"}
                          disabled={!canJoin}
                          onClick={() => {
                            join.mutate();
                          }}
                        >
                          {selfJoined ? "Katıldın" : "Katıl"}
                        </Button>
                      </div>
                    </div>
                    <DialogFooter className="flex items-center justify-center text-red-500">
                      Kayıplardan kasa sorumlu değildir!
                    </DialogFooter>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <span>
              Sıra:{" "}
              {game.data.turn === "dealer"
                ? "Kurpiye"
                : users.data?.find((u) => u.id === game.data?.turn)?.user
                    .username ?? game.data.turn}
            </span>
          </div>
        ) : (
          // Welcome screen, no game on history
          <div>
            <Button
              disabled={!canJoin || join.isLoading}
              onClick={() => {
                join.mutate();
              }}
              isLoading={join.isLoading}
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
