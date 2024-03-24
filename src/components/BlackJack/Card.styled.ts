import { motion } from 'framer-motion';
import styled from 'styled-components';

export enum Color {
  Bet2 = '#ADD8E6',
  Bet5 = '#87CEEB',
  Bet10 = '#1E90FF',
  Bet20 = '#6495ED',
  Bet40 = '#87CEFA',
  Bet60 = '#00CED1',
  Bet100 = '#7FB3D5',
  MainAccent = '#03e9f4',
  MainDark = '#141e30',
  Main = '#243b55',
  MainSemitransparent = '#243b5588',
  Success = '#71a869',
  Fail = 'red',
}

export const CardWrap = styled(motion.div)`
  width: 8vmax;
  height: 10vmax;
  font-size: 2.88vmin;
  position: relative;
  margin-left: 0;
  z-index: 1;
  cursor: pointer;
  display: block;
  user-select: none;
  &:not(:first-child) {
    position: relative;
    margin-left: -5.2vw;
    margin-bottom: 3vh; 
    z-index: 2;
  }
  @keyframes rotate360 {
    from {
      transform: rotateY(180deg);
    }
    to {
      transform: rotateY(360deg);
    }
  }
  @keyframes rotate180 {
    from {
      transform: rotateY(0);
    }
    to {
      transform: rotateY(180deg);
    }
  }
`;
export const CardStyled = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  backface-visibility: hidden;
  padding: 0.9vmax;
  border-radius: 0.72vmax;
  pointer-events: none;
  /* transition: transform 1s ease-in-out ; */
  &.SPADES,
  &.CLUBS {
    color: black;
  }

  &.HEARTS,
  &.DIAMONDS {
    color: red;
  }

  &.face {
    /* transform: rotateY(180deg); */
    box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.5);
    background: #fff;
    & .suit {
      font-size: 4.5vmax;
      font-weight: 100;
    }

    & .rank {
      position: absolute;
      bottom: 0;
      right: 0;
      padding: 0.36vmax;
      display: flex;
      flex-flow: column;
      align-items: center;
      transform: scale(-1);
      line-height: 1;

      &:first-of-type {
        bottom: auto;
        right: auto;
        top: 0;
        left: 0;
        transform: none;
      }

      &::after {
        font-size: 1.26vmax;
        content: attr(data-suit);
      }
    }
  }

  &.back {
    background: linear-gradient(-90deg, ${Color.MainDark}, ${Color.Main});
    background-position: center center;
    box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.5);

    &::before {
      font-size: 0.72vmax;
      content: 'evolution';
      color: white;
      position: absolute;
      top: 0px;
      left: 0px;
    }
    &::after {
      font-size: 0.72vmax;

      content: 'evolution';
      color: white;
      position: absolute;
      bottom: 0px;
      right: 0px;
      padding: 0.36vmax;
      display: flex;
      flex-flow: column;
      -webkit-box-align: center;
      align-items: center;
      transform: scale(-1);
      line-height: 1;
    }
  }

  &.deck {
    position: absolute;

    --width: 4vmax;
    --height: 6.4vmax;
    width: var(--width);
    height: var(--height);
    &::before,
    &::after {
      font-size: 1.08vmax;
    }
  }
  &.deck:first-child {
    animation: shadow 3s ease-in-out infinite;
  }

  @keyframes shadow {
    0%,
    100% {
      filter: drop-shadow(-3.2vmax 2vmax 1vmax rgba(0, 0, 0, 0.514));
    }
    50% {
      filter: drop-shadow(calc(-3.2vmax + 20px) 1vmax 0.2vw rgba(0, 0, 0, 0.514));
    }
  }
`;
