import { api } from "./api";

export const useGetAbdullezizUser = () =>
  api.discord.getAbdullezizUser.useQuery();
