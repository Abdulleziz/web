import { toast } from "react-hot-toast";
import { api } from "./api";

export const useGetAllCrons = () => api.cron.getAll.useQuery();
export const useCreateOrJoinCron = () => {
  const utils = api.useContext();
  return api.cron.createOrJoin.useMutation({
    onSuccess: () => {
      toast.success("Cron oluşturuldu!", { id: "cron.createOrJoin" });
      void utils.cron.getAll.invalidate();
    },
    onMutate: () =>
      toast.loading("Cron oluşturuluyor...", { id: "cron.createOrJoin" }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "cron.createOrJoin",
      });
    },
  });
};

export const useCronTakeOwnership = () => {
  const utils = api.useContext();
  return api.cron.getOwnership.useMutation({
    onSuccess: () => {
      toast.success("Cron artık senindir dost!", { id: "cron.getOwnership" });
      void utils.cron.getAll.invalidate();
    },
    onMutate: () =>
      toast.loading("Cron sahipleniliyor... 😁", { id: "cron.getOwnership" }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "cron.getOwnership",
      });
    },
  });
};

export const useToggleCron = () => {
  const utils = api.useContext();
  return api.cron.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("Cron durumu değiştirildi!", {
        id: "cron.toggleEnabled",
      });
      void utils.cron.getAll.invalidate();
    },
    onMutate: () =>
      toast.loading("Cron durumu değiştiriliyor...", {
        id: "cron.toggleEnabled",
      }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "cron.toggleEnabled",
      });
    },
  });
};

export const useLeaveCron = () => {
  const utils = api.useContext();
  return api.cron.leave.useMutation({
    onSuccess: () => {
      toast.success("Cron'dan ayrıldın!", { id: "cron.leave" });
      void utils.cron.getAll.invalidate();
    },
    onMutate: () =>
      toast.loading("Cron'dan ayrılıyor...", { id: "cron.leave" }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, {
        id: "cron.leave",
      });
    },
  });
};
