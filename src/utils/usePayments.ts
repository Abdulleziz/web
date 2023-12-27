import { toast } from "react-hot-toast";
import { api } from "./api";
import { z } from "zod";
import { UserId } from "./zod-utils";
import { TransferMoney } from "./shared";

// validators
export const SendMoneySchema = z.object({
  toId: UserId,
  amount: TransferMoney,
});

export const CreateEntities = z
  .object({
    id: z.number().positive().int(),
    amount: z.number().positive().int().default(1),
  })
  .array()
  .min(1);

export type CreateEntities = z.infer<typeof CreateEntities>;
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
    onMutate: () => {
      toast.loading("Satın alınıyor", { id: "payments.buyEntities" });
    },
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "payments.buyEntities",
      });
    },
    onSuccess: () => {
      // refresh wallet
      void utils.payments.invalidate();
      toast.success("Satın alma başarılı", { id: "payments.buyEntities" });
    },
  });
};
// mutate { entityId: number, amount: number }[]
// örn: [{ entityId: 1, amount: 1 }, { entityId: 2, amount: 2 }] -> 1x Çaykur 2kg + 2x Demlik poşet
// detaylar: ~/src/utils/entities.ts

export const useNextSalaryDate = () =>
  api.payments.nextSalaryDate.useQuery(undefined, {
    staleTime: Infinity,
  });
