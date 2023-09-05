import { type RouterInputs, api } from "./api";

type In = RouterInputs["profile"];

export const useGetProfile = api.profile.getProfileById.useQuery;

export const useGetMe = () => api.profile["@me"].useQuery();

export const useGetUserIdsByDiscordIds = (
  query: In["getUserIdsByDiscordIds"]
) => api.profile.getUserIdsByDiscordIds.useQuery(query);
