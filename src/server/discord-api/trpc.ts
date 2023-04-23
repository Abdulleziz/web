import { TRPCError } from "@trpc/server";
import { getGuildMember, getGuildMembers } from "./guild";
import {
  connectMembersWithIds,
  fetchMembersWithRoles,
  getAbdullezizRoles,
  sortRoles,
} from "./utils";
import { type AtLeastOne, abdullezizRoleSeverities } from "~/utils/zod-utils";
import { permissionDecider } from "~/utils/abdulleziz";
import { prisma } from "../db";

// discord member + member.roles
export const getGuildMemberWithRoles = async (discordId: string) => {
  const member = await getGuildMember(discordId);
  if (!member) throw new TRPCError({ code: "NOT_FOUND" });
  const [r] = await fetchMembersWithRoles([member] as AtLeastOne<
    typeof member
  >);
  return r;
};

// discord members + their roles (member[].roles[])
export const getGuildMembersWithRoles = async () => {
  const members = await getGuildMembers();
  if (!members) throw new TRPCError({ code: "NOT_FOUND" });
  return await fetchMembersWithRoles(
    members as AtLeastOne<(typeof members)[number]>
  );
};

// discord member + verified roles + abdulleziz perms
export const getAbdullezizUser = async (discordId: string) => {
  const member = await getGuildMemberWithRoles(discordId);
  const verifiedRoles = getAbdullezizRoles(member.roles);
  const verifiedPerms = permissionDecider(verifiedRoles.map((r) => r.name));

  return { ...member, roles: verifiedRoles, perms: verifiedPerms };
};

// discord members + their verified roles + their abdulleziz perms
export const getAbdullezizUsers = async () => {
  const members = await getGuildMembersWithRoles();
  const verifiedRoles = members.map((m) => getAbdullezizRoles(m.roles));
  const verifiedPerms = verifiedRoles.map((r) =>
    permissionDecider(r.map((r) => r.name))
  );
  const verifiedMembers = members.map((m, i) => {
    const roles = verifiedRoles[i];
    const perms = verifiedPerms[i];
    if (!roles || !perms)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return { ...m, roles, perms };
  });
  return verifiedMembers;
};

export const getSalaryTakers = async () => {
  const users = await getAbdullezizUsers();
  const salaryTakers = (await connectMembersWithIds(prisma, users)).filter(
    (u) => u.perms.includes("maaş al")
  );
  return salaryTakers.map((u) => {
    const [highestRole] = sortRoles(u.roles);
    if (!highestRole) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return { ...u, severity: abdullezizRoleSeverities[highestRole.name] };
  });
};