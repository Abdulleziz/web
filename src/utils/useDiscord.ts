import { toast } from "react-hot-toast";
import { api } from "./api";

export const useGetAbdullezizUser = () =>
  api.discord.getAbdullezizUser.useQuery();

export const useGetAbdullezizUsers = () =>
  api.discord.getAbdullezizUsers.useQuery();

export const useGetDiscordMembers = () =>
  api.discord.getDiscordMembers.useQuery();

export const useGetVoteEvents = () => api.discord.role.getVotes.useQuery();

export const useVote = () => {
  const id = "discord.role.vote";
  const utils = api.useContext();
  return api.discord.role.vote.useMutation({
    onSuccess: () => {
      toast.success("Oy verildi!", { id });
      void utils.discord.invalidate();
      void utils.profile.invalidate();
    },
    onMutate: () => toast.loading("Oy veriliyor...", { id }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
  });
};
