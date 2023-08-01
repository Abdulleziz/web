import { toast } from "react-hot-toast";
import { type RouterInputs, api } from "./api";

type In = RouterInputs["discord"];

export const memberFinder = <T extends { user: { id: string } }>(
  members: T[]
) => {
  return (id: string) => {
    const member = members.find((m) => m.user.id === id);
    if (!member) throw new Error(`No member with id ${id}`);
    return member;
  };
};

export const useGetAbdullezizUser = (q: In["getAbdullezizUser"]) =>
  api.discord.getAbdullezizUser.useQuery(q);

export const useGetAbdullezizUsers = () =>
  api.discord.getAbdullezizUsers.useQuery();

export const useGetDiscordMembers = (q: In["getDiscordMembers"]) =>
  api.discord.getDiscordMembers.useQuery(q);

/**
 * sorted by highest role
 * filtered out bots
 */
export const useGetAbdullezizUsersSorted = () => {
  return api.discord.getAbdullezizUsers.useQuery(undefined, {
    select(data) {
      return (data ?? [])
        .filter((m) => !m.user.bot) // filter out bots
        .sort((m1, m2) => {
          // sort members by highest role
          const s1 = m1.roles[0];
          const s2 = m2.roles[0];
          return (s2?.position ?? 0) - (s1?.position ?? 0);
        });
    },
  });
};

export const useGetVoteEvents = () => api.discord.role.getVotes.useQuery();

export const useGetCEOVoteEvent = () => api.discord.role.getCEOVotes.useQuery();

export const useGetVoteEventsWithMembers = () => {
  const members = useGetAbdullezizUsersSorted();
  const memberFromId = memberFinder(members.data ?? []);
  return api.discord.role.getVotes.useQuery(undefined, {
    select(data) {
      return data.map((event) => ({
        ...event,
        target: memberFromId(event.target),
        votes: event.votes.map((v) => ({
          ...v,
          voter: memberFromId(v.voter),
        })),
      }));
    },
  });
};

export const useGetCEOVoteEventWithMembers = (noEnded = false) => {
  const members = useGetAbdullezizUsersSorted();
  const memberFromId = memberFinder(members.data ?? []);
  return api.discord.role.getCEOVotes.useQuery(undefined, {
    select: (event) => {
      if (noEnded && event.endedAt) return;
      return {
        ...event,
        votes: event.votes.map((v) => ({
          ...v,
          voter: memberFromId(v.voter),
          target: memberFromId(v.target),
        })),
      };
    },
  });
};

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
