import React from "react";
import { motion } from "framer-motion";

export const Deck: React.FC = () => {
  return (
    <div
      className="absolute right-[20vw] top-0 animate-bounce bg-white"
      id="deck"
    >
      {Array.from({ length: 60 }).map((_, index) => (
        <motion.div
          className={`back absolute bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow before:absolute before:left-0 before:top-0 before:text-[0.72vmax] before:text-[white] before:content-['Abduleziz'] after:absolute after:bottom-0 after:right-0 after:flex after:scale-[-1] after:items-center after:p-[0.36vmax] after:text-[0.72vmax] after:leading-none after:text-[white] after:content-['Abdulleziz'] after:[flex-flow:column] [&:nth-child(1)]:animate-pulse Deck=${index} pointer-events-none absolute left-0 top-0 flex h-[8vmax] w-[6vmax] items-center justify-center rounded p-[0.9vmax] [backface-visibility:hidden] [flex-flow:column]`}
          style={{
            zIndex: index + 1,
            transform: `translateX(${(index + 1) * 0.1}px) translateY(${
              (index + 1) * -1
            }px) rotateX(-40deg) rotateY(0deg) rotateZ(-60deg) scale(${
              1.3 + index * 0.0009
            }`,
          }}
          key={`Deck=${index}`}
        />
      ))}
    </div>
  );
};
