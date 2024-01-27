import React from "react";
import {
  getScore,
  type Card as DeckCard,
} from "~/server/api/routers/gamble/blackjack/api";
import { CardComponent } from "../CardComponent";
import { cx } from "class-variance-authority";
import { CardholdersIds } from "../types.ds";

type PlayerProps = {
  index: number;
  id: string;
  player?: {
    playerName?: string;
    playerId?: string;
    deck?: {
      bet: number | undefined;
      cards: DeckCard[];
      busted: boolean;
    }[];
  };
};

export const PlayerSpotComponent: React.FC<PlayerProps> = ({
  player,
  index,
}) => {
  const isActive = false;

  return (
    <div
      className={cx(
        `spot relative flex  flex-row items-center justify-center `,
        isActive && "animate-pulse",
        index === 0 && `top-[-5.75vw] rotate-[calc(90deg-45deg*1.5)]`,
        index === 1 && ` rotate-[calc(90deg-45deg*1.75)]`,
        index === 2 && `top-[2vw] rotate-[calc(90deg-45deg*2)]`,
        index === 3 && ` rotate-[calc(90deg-45deg*2.25)]`,
        index === 4 && `top-[-5.75vw] rotate-[calc(90deg-45deg*2.5)]`
      )}
    >
      <div className="absolute bottom-0 text-[1.9vmin]">
        {player?.playerName}
      </div>
      <div
        className={cx(
          "relative flex h-[20vmax] w-[16vmax] cursor-pointer items-center justify-center gap-5 rounded-[9px] border-[3px] border-[solid] border-[white] px-[0] py-[20px] ",
          isActive && "box animate-pulse border border-green-500 shadow"
        )}
      >
        {player?.deck?.map(({ bet, busted, cards }, index) => {
          const score = getScore(cards);
          return (
            <div className={cx("relative")} key={`player-${index}`}>
              <div
                className={cx(
                  "flex  items-center justify-center gap-0",
                  busted && "opacity-60"
                )}
              >
                {cards.map((card, index) => {
                  return (
                    <CardComponent
                      score={score}
                      index={index}
                      key={card.code}
                      card={card}
                      cardHolderId={`spot-${index}Cardholder`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
