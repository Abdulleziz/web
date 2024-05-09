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

export const allStudents = [
  { name: "Barkin", no: "20212022067", discordId: "288397394465521664" },
  { name: "İlker", no: "20212022092", discordId: "223071656510357504" },
  { name: "Ali Kerem Karaduman", no: "20212022072", discordId: "852595277037568031" },
  { name: "Kaan", no: "20212022089", discordId: "786212635297316924" },
  { name: "Yağiz", no: "20212022021", discordId: "724960302277460050" },
  { name: "Yusuf", no: "20212022071", discordId: "550708562381373474" },
  { name: "Bora", no: "20202022025", discordId: "222663527784120320" },
  { name: "Buğra", no: "20202022035", discordId: "282535915203723265" },
  { name: "Ulaştı", no: "20232022062", discordId: "442327385208258561" },
  { name: "Taha", no: "20202022008", discordId: "202147239060045824" },
];
