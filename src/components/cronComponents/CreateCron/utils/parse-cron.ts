import cronParser from "cron-parser";
import type { Dispatch, SetStateAction } from "react";

export const parseCron = (
  cron: string,
  setError: Dispatch<SetStateAction<string | null>>
) => {
  try {
    if (!cron.trim()) throw new Error("Cron boş olamaz!");
    const i = cronParser.parseExpression(cron, { utc: true });

    if (calculateDiff(i) >= 12) setError(null);
    else
      setError(
        "Hatırlatıcı en az 12 saat aralıklarla olmalı! (api ödiyecek paramız yok :D)"
      );
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    }
  }
};

export const calculateDiff = (cron: cronParser.CronExpression) => {
  const next = cron.next().getTime();
  const prev = cron.prev().getTime();
  const diff = (next - prev) / (1000 * 60 * 24);
  return diff;
};
