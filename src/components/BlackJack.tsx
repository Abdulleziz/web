/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import Image from "next/image";
import { cx } from "class-variance-authority";
import {
  type Card as DeckCard,
  getScore,
  cardImage,
} from "~/server/api/routers/gamble/blackjack/api";
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
import { useBlackJackGame } from "~/hooks/useBlackJack";
import { useGetWallet } from "~/utils/usePayments";
import toast from "react-hot-toast";

const BlackJackComponent = () => {
  const time = useTime({ n: 100 });
  const users = useGetAbdullezizUsers();
  const session = useSession();
  const wallet = useGetWallet();
  // -- animations --
  const [dealerRef] = useAutoAnimate();
  const [playerRef] = useAutoAnimate();
  // -- actions --
  const join = api.gamble.blackjack.join.useMutation();
  const game = api.gamble.blackjack.state.useQuery();
  const _delete = api.gamble.blackjack._delete.useMutation();
  const hit = api.gamble.blackjack.hit.useMutation();
  const stand = api.gamble.blackjack.stand.useMutation();
  const split = api.gamble.blackjack.split.useMutation();
  const insertBet = api.gamble.blackjack.insertBet.useMutation({
    onSuccess(_data, variables) {
      toast.success(`$${variables.bet} bahis yatırılıyor`, { id: "insertBet" });
    },
    onMutate(variables) {
      toast.loading(`$${variables.bet} bahis yatırıldı`, { id: "insertBet" });
    },
    onError(error) {
      toast.error(`Bahis yatırılamadı: ${error.message}`, { id: "insertBet" });
    },
  });
  const reportTurn = api.gamble.blackjack.reportTurn.useMutation();

  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }

  const [channel, liveLogs, presence, logs, bet, setBet] = useBlackJackGame();

  const isStarted = game.data && game.data.startingAt < new Date(time);
  const isEnded = game.data?.endedAt || true;
  const gameJoinDuration = game.data
    ? game.data.startingAt.getTime() - game.data.createdAt.getTime()
    : 0;

  const timeLeft = Math.max(
    game.data && !isStarted ? game.data.startingAt.getTime() - time : 0,
    0
  );

  const lastTurnPast = liveLogs[0]
    ? new Date(liveLogs[0].timestamp).getTime() + 30 * 1000 < Date.now()
    : true;

  const selfTurn = game.data?.turn === session.data?.user.id;
  const selfJoined =
    session.data?.user.id && game.data?.seats
      ? game.data?.seats.find((p) => p.playerId === session.data?.user.id)
      : false;

  const canJoin = !selfJoined && !isStarted;

  const currentDeck =
    game.data?.seats[game.data.turn.seat]?.deck[game.data.turn.deck];

  function setBetClamp(value: number) {
    const newValue = Math.max(
      Math.min(bet + value, wallet.data?.balance ?? 0),
      0
    );
    setBet(newValue); // TODO: prev callback with useEffect
    return newValue;
  }

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
                  {logs.slice(0, 20).map((log) => (
                    <div key={log.id} className="text-sm">
                      {`${log.name} gameId: ${log.data}" sent at ${new Date(
                        log.timestamp
                      ).toLocaleString()}`}
                      <Separator className="my-2" />
                    </div>
                  ))}
                </ScrollArea>
                <ScrollArea className="h-72 w-48 rounded-md border">
                  <div className="p-4">
                    <h4 className="mb-4 text-sm font-medium leading-none">
                      Realtime Events ({liveLogs.length})
                    </h4>
                    {liveLogs.map((log) => (
                      <div key={log.id} className="text-sm">
                        {`✉️ Gamble BlackJack: event: ${log.name} gameId: ${log.data}`}
                        <Separator className="my-2" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <ScrollArea className="h-72 w-48 rounded-md border">
                  <div className="p-4">
                    <h4 className="mb-4 text-sm font-medium leading-none">
                      Users ({presence.length})
                    </h4>
                    {presence.map((presence) => (
                      <div key={presence.id}>
                        <div className="text-sm">
                          {presence.action}: {getUsername(presence.clientId)}
                        </div>
                        <Separator className="my-2" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              {isStarted && game.data && (
                <>(BlackJack): Dolu Koltuklar: {game.data.seats.length}</>
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
            <div
              // TODO: animate is broken rn.
              ref={playerRef}
              className="mt-8 flex w-full flex-col items-center justify-center space-x-4 md:flex-row"
            >
              {game.data.seats.reverse().map((seat, seatIdx) => {
                return (
                  <div
                    key={seatIdx}
                    className="flex w-full flex-col items-center space-y-2"
                  >
                    {seat.deck.map((deck, deckIdx) => {
                      const score = getScore(deck.cards);
                      return (
                        <div key={`${seatIdx}-${deckIdx}`}>
                          <div className="flex w-full items-center justify-center space-x-4">
                            {deck.cards.map((card, i) => (
                              <div
                                key={`${i}-${seatIdx}-${deckIdx}`}
                                className={cx(
                                  seat.playerId === session.data?.user.id
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
                              game.data?.turn.playerId === seat.playerId &&
                                game.data.turn.seat === seatIdx &&
                                game.data.turn.deck === deckIdx
                                ? "text-yellow-400"
                                : "text-white"
                            )}
                          >
                            {getUsername(seat.playerId)} (
                            {score == 21 && deck.cards.length == 2 ? (
                              <span className="text-blue-300">BlackJack</span>
                            ) : (
                              score
                            )}
                            ){" "}
                            {deck.busted && (
                              <span className="text-red-300">Battı</span>
                            )}{" "}
                            {!!deck.bet && (
                              <span className="bg-black text-green-700">
                                (Bet: ${deck.bet})
                              </span>
                            )}
                          </h2>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-center space-x-2">
              {game.data.endedAt ? (
                <>
                  <Button
                    variant={"warning"}
                    onClick={() => join.mutate(bet)}
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
                      join.mutate(bet);
                    }}
                  >
                    Katıl
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-24"
                    variant={"warning"}
                    disabled={
                      !selfJoined ||
                      game.data.turn.playerId !== session.data?.user.id ||
                      stand.isLoading ||
                      hit.isLoading ||
                      split.isLoading ||
                      (wallet.data?.balance ?? 0) < bet ||
                      currentDeck?.cards.length !== 2 ||
                      getScore(currentDeck?.cards.slice(0, 1)) !==
                        getScore(currentDeck?.cards.slice(1, 2))
                    }
                    isLoading={split.isLoading}
                    onClick={() => split.mutate()}
                  >
                    Split
                  </Button>
                  <Button
                    className="w-24"
                    disabled={
                      !selfJoined ||
                      game.data.turn.playerId !== session.data?.user.id ||
                      hit.isLoading ||
                      stand.isLoading ||
                      split.isLoading
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
                      game.data.turn.playerId !== session.data?.user.id ||
                      stand.isLoading ||
                      hit.isLoading ||
                      split.isLoading
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
              {!isEnded && lastTurnPast && !selfTurn && (
                <Button
                  variant={"destructive"}
                  className="w-24"
                  disabled={reportTurn.isLoading}
                  isLoading={reportTurn.isLoading}
                  onClick={() =>
                    game.data && reportTurn.mutate(game.data.gameId)
                  }
                >
                  Turu Bitir
                </Button>
              )}
            </div>
            <Dialog open={game.data.startingAt > new Date()}>
              <DialogContent className="font-bold">
                <DialogHeader>
                  <DialogTitle>Oyun başlamak üzere</DialogTitle>
                  <DialogDescription>
                    <p>Kalan süre: {(timeLeft / 1000).toFixed()} saniye</p>
                    <p>Bahis: ${bet}</p>
                    <div className="p-4">
                      <div className="flex items-center justify-center gap-2 p-2">
                        {[50, 100, 200, 500].map((amount) => (
                          <Button
                            key={amount}
                            size={"sm"}
                            variant={"outline"}
                            disabled={
                              wallet.isLoading ||
                              insertBet.isLoading ||
                              !wallet.data ||
                              !bet
                            }
                            onClick={() => {
                              const val = setBetClamp(-amount);
                              if (game.data)
                                insertBet.mutate({
                                  gameId: game.data.gameId,
                                  bet: val,
                                });
                            }}
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
                            disabled={
                              wallet.isLoading ||
                              insertBet.isLoading ||
                              !wallet.data ||
                              wallet.data.balance < amount + bet
                            }
                            onClick={() => {
                              const val = setBetClamp(amount);
                              if (val && game.data)
                                insertBet.mutate({
                                  gameId: game.data.gameId,
                                  bet: val,
                                });
                            }}
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
                            max={wallet.data?.balance ?? 0}
                            value={bet}
                            onChange={(e) => {
                              setBet(e.target.valueAsNumber);
                              if (game.data)
                                insertBet.mutate({
                                  gameId: game.data.gameId,
                                  bet: e.target.valueAsNumber,
                                });
                            }}
                          />
                          <Button
                            disabled={bet === 0}
                            variant={"outline"}
                            onClick={() => {
                              setBet(0);
                              if (game.data)
                                insertBet.mutate({
                                  gameId: game.data.gameId,
                                  bet: 0,
                                });
                            }}
                          >
                            Sıfırla
                          </Button>
                        </div>
                        <Progress value={(timeLeft / gameJoinDuration) * 100} />
                        <Button
                          size={"lg-long"}
                          disabled={!canJoin}
                          onClick={() => {
                            join.mutate(bet);
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
              {game.data.turn.playerId === "dealer" ? (
                "Kurpiye"
              ) : (
                <>
                  {" "}
                  {getUsername(game.data.turn.playerId)} (Seat:{" "}
                  {game.data.turn.deck + 1})
                </>
              )}
            </span>
            <span>
              Cüzdan: ${wallet.data?.balance ?? 0} | İlk Bahis: ${bet}
            </span>
          </div>
        ) : (
          // Welcome screen, no game on history
          <div>
            <Button
              disabled={!canJoin || join.isLoading}
              onClick={() => {
                join.mutate(bet);
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
