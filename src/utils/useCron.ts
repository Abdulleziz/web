import { api } from "./api";

export const useGetAllCrons = () => api.cron.getAll.useQuery();
export const useCreateCron = () => {
  const utils = api.useContext();
  return api.cron.create.useMutation({
    onSuccess: () => utils.cron.getAll.invalidate(),
  });
};
