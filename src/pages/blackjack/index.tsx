import { cx } from "class-variance-authority";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { CardComponent } from "~/components/BlackJack/CardComponent";
import { Deck } from "~/components/BlackJack/Deck";
import { PlayerSpotComponent } from "~/components/BlackJack/PlayerSpot/PlayerSpot";
import {
  CardsTotal,
  CardsWrapper,
  SpotStyled,
  SpotsZone,
} from "~/components/BlackJack/PlayerSpot/Spot.styled";
import { CardholdersIds } from "~/components/BlackJack/types.ds";
import { Layout } from "~/components/Layout";
import { Button } from "~/components/ui/button";
import { useBlackJackGame } from "~/hooks/useBlackJack";
import { useTime } from "~/hooks/useTime";
import {
  type Card as DeckCard,
  getScore,
  cardImage,
  Card,
} from "~/server/api/routers/gamble/blackjack/api";
import { api } from "~/utils/api";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import { useGetWallet } from "~/utils/usePayments";

const BlackJack = () => {
  const game = api.gamble.blackjack.state.useQuery();
  const time = useTime({ n: 100 });
  const users = useGetAbdullezizUsers();
  const session = useSession();
  const wallet = useGetWallet();
  useBlackJackGame();
  const publicCards = game.data?.dealer.cards.filter(
    (c) => !c.hidden
  ) as DeckCard[];
  const score = getScore(publicCards);
  const [seats, setSeats] = useState([
    { player: { playerName: "", playerId: "", cards: [], busted: false } },
    { player: { playerName: "", playerId: "", cards: [], busted: false } },
    { player: { playerName: "", playerId: "", cards: [], busted: false } },
    { player: { playerName: "", playerId: "", cards: [], busted: false } },
    { player: { playerName: "", playerId: "", cards: [], busted: false } },
  ]);

  const selfJoined =
    session.data?.user.id && game.data?.seats
      ? game.data?.seats.find((p) => p.playerId === session.data?.user.id)
      : false;
  const join = api.gamble.blackjack.join.useMutation();
  const ready = api.gamble.blackjack.ready.useMutation();
  const _delete = api.gamble.blackjack._delete.useMutation();
  const isStarted = game.data && game.data.startingAt < new Date(time);

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
  const currentDeck =
    game.data?.seats[game.data.turn.seat]?.deck[game.data.turn.deck];
  const reportTurn = api.gamble.blackjack.reportTurn.useMutation();
  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }
  if (game.data) {
    return (
      <div className="relative flex w-full flex-col items-center justify-evenly [transform:perspective(1000px)_translateZ(-300px)_rotateX(30deg)]">
        <div className=" flex justify-center">
          {game.data?.dealer &&
            game.data.dealer.cards.map((card, i) => {
              return (
                <CardComponent
                  index={i}
                  key={`dealerCard-${i}`}
                  cardHolderId={CardholdersIds.Dealer}
                  card={card}
                />
              );
            })}
          {game.data?.dealer && (
            <div
              className={cx(
                "ml-[4vmin] h-min w-[6vmin] rounded-[0.7vmin] border-[0.23vmin] border-[#fff] border-[solid] p-[0.35vmin]  text-center text-[3.5vmin] text-[white]",
                score > 21 && "border-red-600 text-red-600",
                score === 21 && "border-yellow-400 text-yellow-400"
              )}
            >
              {score}
            </div>
          )}
        </div>

        <div className="mt-28 flex justify-between gap-20">
          {seats.map((seat, index) => {
            const playerId = game.data?.seats[index]?.playerId;
            const playerDeck = game.data?.seats[index]?.deck;
            return (
              <div key={index} className="flex flex-col">
                <PlayerSpotComponent
                  index={index}
                  id={`spot-${index}`}
                  player={{
                    playerId: playerId,
                    playerName: getUsername(playerId),
                    deck: playerDeck,
                  }}
                />
                <p
                  className={cx(
                    ` relative flex  flex-row items-center justify-center `,

                    index === 0 &&
                      `-left-[2.5vw] top-[-5.75vw] rotate-[calc(90deg-45deg*1.5)]`,
                    index === 1 &&
                      `-left-[1.25vw] rotate-[calc(90deg-45deg*1.75)]`,
                    index === 2 && `top-[2vw] rotate-[calc(90deg-45deg*2)]`,
                    index === 3 &&
                      `left-[1.25vw] rotate-[calc(90deg-45deg*2.25)]`,
                    index === 4 &&
                      `left-[2.5vw] top-[-5.75vw] rotate-[calc(90deg-45deg*2.5)]`
                  )}
                >
                  bets wip
                </p>
              </div>
            );
          })}
        </div>
        {/* <Deck /> */}

        <div className="mt-20">
          {game.data.endedAt ? (
            <>
              <Button
                variant={"bj_split"}
                onClick={() => join.mutate(0)}
                isLoading={join.isLoading}
                disabled={join.isLoading}
              >
                Yeni Oyuna Başla
              </Button>
            </>
          ) : !selfJoined ? (
            <>
              <Button
                variant={"bj_hit"}
                disabled={selfJoined && isStarted}
                onClick={() => {
                  join.mutate(0);
                }}
              >
                Katıl
              </Button>
            </>
          ) : (
            <div className="flex gap-3">
              <Button
                variant={"bj_split"}
                disabled={
                  !selfJoined ||
                  game.data.turn.playerId !== session.data?.user.id ||
                  stand.isLoading ||
                  hit.isLoading ||
                  split.isLoading ||
                  (wallet.data?.balance ?? 0) < 0 ||
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
                variant="bj_hit"
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
                variant={"bj_stand"}
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
            </div>
          )}
        </div>
      </div>
    );
  }
  return <></>;
};

export default BlackJack;
