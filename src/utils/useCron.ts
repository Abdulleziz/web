import { api } from "./api";

export const useGetAllCrons = () => api.cron.getAll.useQuery();
export const useCreateOrJoinCron = () => {
  const utils = api.useContext();
  return api.cron.createOrJoin.useMutation({
    onSuccess: () => utils.cron.getAll.invalidate(),
  });
};

export const useLeaveCron = () => {
  const utils = api.useContext();
  return api.cron.leave.useMutation({
    onSuccess: () => utils.cron.getAll.invalidate(),
  });
};
