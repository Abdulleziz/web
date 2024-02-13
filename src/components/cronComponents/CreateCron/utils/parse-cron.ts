import cronParser from "cron-parser";
import type { Dispatch, SetStateAction } from "react";
import { UTCtoTR } from "~/pages/cron";

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

export const cronAsUTC3 = (cron: string) => {
  // UTC -> TR
  const i = cronParser.parseExpression(cron, { utc: true });
  // 3 saat geri al
  const fields = UTCtoTR(i);
  const iAsTR = cronParser.fieldsToExpression(fields);

  return iAsTR.stringify();
};
