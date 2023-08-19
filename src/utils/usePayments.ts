import { toast } from "react-hot-toast";
import { api } from "./api";
import { z } from "zod";
import { UserId } from "./zod-utils";

// validators
export const SendMoneySchema = z.object({
  toId: UserId,
  amount: z.number().positive().int(),
});

export const CreateEntities = z
  .object({
    entityId: z.number().positive().int().min(1),
    amount: z.number().min(1).default(1),
  })
  .array()
  .nonempty();

export const CreateSalary = z.object({
  multiplier: z.number().min(1).max(20).default(10),
  delay: z
    .number()
    .min(0)
    .max(60 * 60 * 24 * 7)
    .default(0)
    .describe("in seconds"),
});

export type CreateEntities = z.infer<typeof CreateEntities>;
export type CreateSalary = z.infer<typeof CreateSalary>;
export type SendMoneySchema = z.infer<typeof SendMoneySchema>;

// kaç paran var
export const useGetWallet = () =>
  api.payments.getWallet.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 dk
  });
// { balance: number }

export const useSendMoney = () => {
  const id = "payments.sendMoney";
  const utils = api.useContext();
  return api.payments.sendMoney.useMutation({
    // refresh wallet
    onMutate: () => toast.loading("Para gönderiliyor...", { id }),
    onSuccess: () => {
      toast.success("Para gönderildi!", { id });
      void utils.payments.invalidate();
    },
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
  });
};

// tüm geçmiş! (herkesin)
export const usePaymentsHistory = () => api.payments.getAll.useQuery();
// Payment[] (salary, transfer, invoice(buy))

// satın al
export const useBuyEntities = () => {
  const utils = api.useContext();
  return api.payments.buyEntities.useMutation({
    // refresh wallet
    onSuccess: () => utils.payments.invalidate(),
  });
};
// mutate { entityId: number, amount: number }[]
// örn: [{ entityId: 1, amount: 1 }, { entityId: 2, amount: 2 }] -> 1x Çaykur 2kg + 2x Demlik poşet
// detaylar: ~/src/utils/entities.ts

// extradan maaş dağıt (özel eventlerde falan, yeni MEGAN sevinci 🤣😭)
// normalde maaşlar 12 saatte bir otomatik olarak dağıtılıyor (şimdilik)
export const useCreateSalary = () => api.payments.createSalary.useMutation();
// mutate { delay: number, multiplier: number }
// delay -> yarın, 2 saat sonra, 1 hafta sonra
// multiplier -> abdulleziz role severity * multiplier
// örn: CTO=90 multiplier=20 = 1800

export const useNextSalaryDate = () =>
  api.payments.nextSalaryDate.useQuery(undefined, {
    staleTime: Infinity,
  });
