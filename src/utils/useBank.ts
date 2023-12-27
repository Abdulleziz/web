import { toast } from "react-hot-toast";
import { type RouterOutputs, api } from "./api";

export const useGetBankHistory = api.bank.history.useQuery;
export type BankHistory = RouterOutputs["bank"]["history"];

export const useCreateBankTransaction = () => {
  const utils = api.useContext();
  return api.bank.transaction.useMutation({
    onSuccess: () => {
      toast.success("Transfer başarılı!", { id: "bank.transaction" });
      void utils.bank.history.invalidate();
      void utils.payments.getWallet.invalidate();
    },
    onMutate: () =>
      toast.loading("Transfer yapılıyor...", { id: "bank.transaction" }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "bank.transaction",
      });
    },
  });
};

export const useDistributeSalary = () => {
  const utils = api.useContext();
  return api.bank.distributeSalary.useMutation({
    onSuccess: ({ id, createdAt }) => {
      const dateFmt = createdAt.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
      });
      toast.success(`${dateFmt} tarihli maaşlar dağıtıldı!`, {
        id: `bank.distributeSalary.${id}`,
      });
      void utils.bank.history.invalidate();
      void utils.payments.invalidate();
    },
    onMutate: (id) =>
      toast.loading("Maaşlar dağıtılıyor...", {
        id: `bank.distributeSalary.${id}`,
      }),
    onError: (error, id) => {
      toast.error(error.data?.zodError || error.message, {
        id: `bank.distributeSalary.${id}`,
      });
    },
  });
};

export const useTriggerEmergency = () => {
  const utils = api.useContext();
  return api.emergency.triggerEmergency.useMutation({
    onSuccess: () => {
      toast.success("Acil durum tetiklendi!", { id: "bank.triggerEmergency" });
      void utils.bank.history.invalidate();
      void utils.payments.invalidate();
    },
    onMutate: () =>
      toast.loading("Acil durum tetikleniyor...", {
        id: "bank.triggerEmergency",
      }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "bank.triggerEmergency",
      });
    },
  });
};

export const useGetBankHistoryDiscriminated = () =>
  useGetBankHistory(undefined, {
    select({ balance, invoices, salaries, transfers }) {
      return {
        balance,
        events: [
          ...invoices.map((i) => ({ ...i, type: "invoice" as const })),
          ...salaries.map((s) => ({ ...s, type: "salary" as const })),
          ...transfers.map((t) => ({ ...t, type: "transfer" as const })),
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      };
    },
  });

export type BankHistoryEvent = NonNullable<
  ReturnType<typeof useGetBankHistoryDiscriminated>["data"]
>["events"][number];
