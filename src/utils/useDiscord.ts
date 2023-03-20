import { api } from "./api";

export const useGetVerifiedAbdullezizRoles = () =>
  api.discord.role.getVerifiedAbdullezizRoles.useQuery();
