import { api } from "./api";

export const useGetAbdullezizUser = () =>
  api.discord.getAbdullezizUser.useQuery();

export const useGetDiscordMembers = () =>
  api.discord.getDiscordMembers.useQuery();
