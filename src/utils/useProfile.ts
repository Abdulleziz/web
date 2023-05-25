import { type RouterInputs, api } from "./api";

type In = RouterInputs["profile"];

export const useGetProfile = (query: In["getProfileById"]) =>
  api.profile.getProfileById.useQuery(query);

export const useGetMe = () => api.profile["@me"].useQuery();

export const useGetUserIdsByDiscordIds = (
  query: In["getUserIdsByDiscordIds"]
) => api.profile.getUserIdsByDiscordIds.useQuery(query);
