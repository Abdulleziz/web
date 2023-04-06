import { TRPCError } from "@trpc/server";
import { getGuildMember, getGuildMembers } from "./guild";
import { fetchMembersWithRoles } from "./utils";

// discord member + member.roles
export const getGuildMemberWithRoles = async (discordId: string) => {
  const member = await getGuildMember(discordId);
  if (!member) throw new TRPCError({ code: "NOT_FOUND" });
  return (await fetchMembersWithRoles([member])).at(0)!;
};

// discord members + their roles (member[].roles[])
export const getGuildMembersWithRoles = async () => {
  const members = await getGuildMembers();
  if (!members) throw new TRPCError({ code: "NOT_FOUND" });
  return await fetchMembersWithRoles(members);
};
