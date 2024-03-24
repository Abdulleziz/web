import { useEffect, useState } from "react";

export const useTime = ({ n = 1000 }: { n?: number } = {}) => {
  const [time, setTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, n);
    return () => clearInterval(interval);
  }, [n]);

  return time;
};
