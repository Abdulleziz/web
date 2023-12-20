import { z } from "zod";

export const waitFor = <TValue = undefined, TReason = undefined>(
  delay: number,
  value?: TValue
) => {
  let timeout: NodeJS.Timeout | number | null;
  let cancel: (reason?: TReason) => void;
  const promise = new Promise<TValue>((res, rej) => {
    cancel = rej;
    timeout = setTimeout(res, delay, value);
  });
  return {
    promise,
    cancel(reason?: TReason) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
        cancel(reason);
        cancel = () => {
          return;
        };
      }
    },
  };
};

export const PushSubscription = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    auth: z.string(),
    p256dh: z.string(),
  }),
});

export const TransferMoney = z.number().positive().int();
