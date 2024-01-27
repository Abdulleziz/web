import { cx } from "class-variance-authority";
import { useState } from "react";
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
import { useBlackJackGame } from "~/hooks/useBlackJack";
import {
  type Card as DeckCard,
  getScore,
  cardImage,
  Card,
} from "~/server/api/routers/gamble/blackjack/api";
import { api } from "~/utils/api";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";

const BlackJack = () => {
  const game = api.gamble.blackjack.state.useQuery();
  console.log(game.data);
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

  const users = useGetAbdullezizUsers();
  function getUsername(id?: string) {
    return users.data?.find((u) => u.id === id)?.user.username ?? id;
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-evenly gap-32 [transform:perspective(1000px)_translateZ(-300px)_rotateX(30deg)]">
      {/* <div id="deck" /> */}

      <div className=" flex  justify-center">
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

      <div className="flex justify-between gap-20">
        {seats.map((seat, index) => {
          const playerId = game.data?.seats[index]?.playerId;
          const playerDeck = game.data?.seats[index]?.deck;
          return (
            <PlayerSpotComponent
              index={index}
              key={index}
              id={`spot-${index}`}
              player={{
                playerId: playerId,
                playerName: getUsername(playerId),
                deck: playerDeck,
              }}
            />
          );
        })}
      </div>
      <Deck />
    </div>
  );
};

export default BlackJack;
