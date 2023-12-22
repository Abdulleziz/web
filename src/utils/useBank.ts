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
    onSuccess: () => {
      toast.success("Maaşlar dağıtıldı!", { id: "bank.distributeSalary" });
      void utils.bank.history.invalidate();
      void utils.payments.invalidate();
    },
    onMutate: () =>
      toast.loading("Maaşlar dağıtılıyor...", { id: "bank.distributeSalary" }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "bank.distributeSalary",
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
