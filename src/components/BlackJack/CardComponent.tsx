import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CardholdersIds, SuitCard } from "./types.ds";
import { cx } from "class-variance-authority";

type CardProps = {
  score?: number;
  index: number;
  cardHolderId: string;
  card:
    | {
        hidden: true;
      }
    | {
        hidden?: false;
        value:
          | "0"
          | "2"
          | "3"
          | "4"
          | "5"
          | "6"
          | "7"
          | "8"
          | "9"
          | "ACE"
          | "JACK"
          | "QUEEN"
          | "KING";
        suit: "SPADES" | "HEARTS" | "DIAMONDS" | "CLUBS";
        code: string;
        image?: undefined;
      };
};
export const CardComponent: React.FC<CardProps> = ({
  cardHolderId,
  card,
  index,
  score,
}) => {
  const deck = document.getElementById("deck");
  const cardEl = document.getElementById(cardHolderId);

  const initialOffset = useMemo(() => {
    if (!deck?.firstElementChild || !cardEl) {
      return { x: 0, y: 0, z: 0, rotate: 0 };
    }
    const cardRect = cardEl.getBoundingClientRect();
    const deckRect = deck.firstElementChild.getBoundingClientRect();
    let angle = 0;

    const result = {
      x: deckRect.left + deckRect.width - cardRect.left,
      y: deckRect.bottom - cardRect.top - cardRect.height,
      z: 0,
      rotate: 0,
    };
    switch (cardHolderId) {
      case CardholdersIds.Spot0:
        angle = ((90 - 45 * 1.55) * Math.PI) / 180;
        result.y -= result.x * 2 * Math.sqrt(1 - Math.cos(angle));
        result.rotate = 100;
        break;
      case CardholdersIds.Spot1:
        angle = ((90 - 45 * 1.7) * Math.PI) / 180;
        result.y -= result.x * 2 * Math.sqrt(1 - Math.cos(angle));
        result.rotate = 113;
        break;
      case CardholdersIds.Spot2:
        angle = ((90 - 45 * 1.8) * Math.PI) / 180;
        result.y -= result.x * 2 * Math.sqrt(1 - Math.cos(angle));
        result.rotate = 126;
        break;
      case CardholdersIds.Spot3:
        angle = ((90 - 45 * 1.9) * Math.PI) / 180;
        result.y -= result.x * 2 * Math.sqrt(1 - Math.cos(angle));
        result.rotate = 139;
        break;

      case CardholdersIds.Spot4:
        angle = ((90 - 45 * 1.55) * Math.PI) / 180;
        result.y += result.x * 2 * Math.sqrt(1 - Math.cos(angle));
        result.rotate = 152;
        break;

      default:
        angle = ((90 - 45 * 1.8) * Math.PI) / 180;
        result.y -= result.x * 2 * Math.sqrt(1 - Math.cos(angle));
        result.rotate = 115;
        break;
    }
    return result;
  }, [cardEl, cardHolderId, deck?.firstElementChild]);

  function getCardName(name: string) {
    if (Number.isInteger(Number(name))) {
      return name;
    }
    return name.split("")[0];
  }
  console.log(card.hidden);

  return (
    <div>
      <motion.div
        className={cx(
          "relative block h-[10vmax] w-[8vmax] cursor-pointer select-none text-[2.88vmin] shadow",
          index !== 0 && "z-10 -ml-[6vw] ",
          index === 1 && cardHolderId !== CardholdersIds.Dealer && "mb-[10vh]",
          index === 2 && cardHolderId !== CardholdersIds.Dealer && "mb-[20vh]",
          index === 3 && cardHolderId !== CardholdersIds.Dealer && "mb-[30vh]",
          index === 4 && cardHolderId !== CardholdersIds.Dealer && "mb-[40vh]",
          index === 5 && cardHolderId !== CardholdersIds.Dealer && "mb-[50vh]"
        )}
        initial={{ ...initialOffset }}
        transition={{
          type: "spring",
          duration: 1,
        }}
        animate={{ x: 0, y: 0, z: 0, rotate: 0 }}
      >
        {!card.hidden && (
          <motion.div
            initial={{ rotateY: 0 }}
            transition={{ type: "spring", duration: 1 }}
            animate={{ rotateY: 360 }}
            className={cx(
              `pointer-events-none absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-[0.72vmax] bg-white p-[0.9vmax] shadow [backface-visibility:hidden] [flex-flow:column]`,
              (card.suit === "SPADES" || card.suit === "CLUBS") && "text-black",
              (card.suit === "HEARTS" || card.suit === "DIAMONDS") &&
                "text-red-600"
            )}
            id={`face-${card.code}`}
          >
            <>
              <div
                className={`absolute  bottom-auto left-[0]  right-auto top-[0] flex -scale-100 transform-none items-center p-[0.36vmax] leading-none [flex-flow:column] after:text-[1.26vmax] after:content-[attr(data-suit)]`}
                data-suit={SuitCard[card.suit]}
              >
                {getCardName(card.value)}
              </div>
              <div className="text-[4.5vmax] font-thin">
                {SuitCard[card.suit]}
              </div>
              <div
                className={`absolute bottom-0 right-0 flex -scale-100 items-center p-[0.36vmax] leading-none [flex-flow:column] after:text-[1.26vmax] after:content-[attr(data-suit)]`}
                data-suit={SuitCard[card.suit]}
              >
                {getCardName(card.value)}
              </div>
            </>
          </motion.div>
        )}
        {card.hidden && (
          <motion.div
            initial={{ rotateY: 0 }}
            transition={{
              type: "spring",
              duration: 1,
            }}
            animate={{ rotateY: 360 }}
            className="after:-scale-1 pointer-events-none absolute left-0 top-0 flex h-full w-full items-center justify-center rounded bg-red-500 p-[0.9vmax] shadow [backface-visibility:hidden] [flex-flow:column] before:absolute before:left-0 before:top-0 before:text-[0.72vmax] before:text-[white] before:content-['Abdulleziz'] after:absolute after:bottom-0 after:right-0 after:flex after:items-center after:p-[0.36vmax] after:text-[0.72vmax] after:leading-none after:text-[white] after:content-['Abdulleziz'] after:[flex-flow:column]"
            id={`back`}
          ></motion.div>
        )}
      </motion.div>
      {index === 0 && score && (
        <div
          className={cx(
            "absolute  rounded  p-1 text-center text-xl font-bold text-white",
            score > 21 && " text-red-600",
            score === 21 && " text-yellow-400"
          )}
        >
          {score}
        </div>
      )}
    </div>
  );
};
