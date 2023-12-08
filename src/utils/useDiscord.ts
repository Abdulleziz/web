import { toast } from "react-hot-toast";
import { type RouterInputs, api } from "./api";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type In = RouterInputs["discord"];

export const memberFinder = <
  T extends { user: { id: string; username: string }; roles: unknown[] }
>(
  members: T[]
) => {
  return (id: string) => {
    const member = members.find((m) => m.user.id === id);

    if (!member) {
      console.log(`No member with id ${id}`);
      return {
        exist: false as const,
        user: { id, username: "Deleted user" as const },
        roles: [],
      };
    }
    return { exist: true as const, ...member };
  };
};

export const useGetAbdullezizRole = api.discord.role.getRole.useQuery;
export const useGetAbdullezizRoles = api.discord.role.getRoles.useQuery;
export const useGetAbdullezizUser = api.discord.getAbdullezizUser.useQuery;
export const useGetAbdullezizUsers = api.discord.getAbdullezizUsers.useQuery;
export const useGetDiscordMembers = api.discord.getDiscordMembers.useQuery;

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

export const useGetVoteEvents = api.discord.role.getVotes.useQuery;
export const useGetCEOVoteEvent = api.discord.role.getCEOVotes.useQuery;

export const useGetVoteEventsWithMembers = (q: In["role"]["getVotes"]) => {
  const roles = useGetAbdullezizRoles();
  const members = useGetAbdullezizUsersSorted();
  const memberFromId = memberFinder(members.data ?? []);
  return api.discord.role.getVotes.useQuery(q, {
    enabled: !!roles.data,
    // query with dependent query wtf
    select(data) {
      return data.map((event) => {
        const role = roles.data?.find((r) => r.name === event.role);
        const beforeRole = roles.data?.find((r) => r.name === event.beforeRole);
        if (!role) throw new Error(`No role with name ${event.role}`);
        return {
          ...event,
          role,
          beforeRole,
          target: memberFromId(event.target),
          votes: event.votes.map((v) => ({
            ...v,
            voter: memberFromId(v.voter),
          })),
        };
      });
    },
  });
};

export type VoteEventsWithMembers = NonNullable<ReturnType<typeof useGetVoteEventsWithMembers>["data"]>[number]

export const useGetCEOVoteEventWithMembers = () => {
  const roles = useGetAbdullezizRoles();
  const members = useGetAbdullezizUsersSorted();
  const memberFromId = memberFinder(members.data ?? []);
  return api.discord.role.getCEOVotes.useQuery(undefined, {
    enabled: !!roles.data,
    select: (event) => {
      if (!event || !roles) return null;
      const role = roles.data?.find((r) => r.name === "CEO");
      const winner = members.data?.find((r) => r.user.id === event.finisherId);
      return {
        ...event,
        winner,
        role: { ...role, name: "CEO" as const },
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
      toast.success("Oylara tekrar bakıldı!", { id });
      void utils.discord.invalidate();
      void utils.profile.invalidate();
    },
    onMutate: () => toast.loading("Oy veriliyor...", { id }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
  });
};

export const useVoteCEO = () => {
  const id = "discord.role.voteCEO";
  const utils = api.useContext();
  return api.discord.role.voteCEO.useMutation({
    onSuccess: () => {
      toast.success("CEO Oylarına tekrar bakıldı!", { id });
      void utils.discord.invalidate();
      void utils.profile.invalidate();
    },
    onMutate: () => toast.loading("CEO Oyu veriliyor...", { id }),
    onError: (error) => {
      toast.error(error.data?.zodError || error.message, { id });
    },
  });
};
