import { TRPCError } from "@trpc/server";
import {
  type Member,
  getGuildMember,
  getGuildMembers,
  getGuildRoles,
  STAFF_ROLE_ID,
  modifyGuildMemberRole,
  UNEMPLOYED_ROLE_ID,
} from "./guild";
import { connectMembersWithIds, getAbdullezizRoles } from "./utils";
import {
  type AtLeastOne,
  abdullezizRoleSeverities,
  type DiscordId,
} from "~/utils/zod-utils";
import { permissionDecider } from "~/utils/abdulleziz";
import { prisma } from "../db";

export async function modifyMemberRole(
  member: Member,
  roleId: DiscordId,
  mode: "PUT" | "DELETE",
  rolesLength = member.roles.length
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  try {
    if (mode === "PUT" && rolesLength === 0)
      await modifyGuildMemberRole(member.user.id, UNEMPLOYED_ROLE_ID, "DELETE");
    else if (rolesLength === 1)
      await modifyGuildMemberRole(member.user.id, UNEMPLOYED_ROLE_ID, "PUT");
  } catch (error) {}

  return await modifyGuildMemberRole(member.user.id, roleId, mode);
}

export async function removeAllRoles(
  member: Member & { roles: { id: string }[] }
) {
  let roleCount = member.roles.length;
  return await Promise.all(
    member.roles.map((r: { id: string }) =>
      modifyMemberRole(member, r.id, "DELETE", roleCount--)
    )
  );
}

export async function fetchMembersWithRoles<M extends Member>(
  members: AtLeastOne<M>
) {
  const allRoles = await getGuildRoles();
  const roles = getAbdullezizRoles(allRoles);

  const r = members.map((member) => ({
    ...member,
    isStaff: member.roles.some((role) => role === STAFF_ROLE_ID),
    roles: roles.filter((role) => member.roles.includes(role.id)),
  }));
  return r as AtLeastOne<(typeof r)[number]>;
}

export const getGuildMemberWithRoles = async (discordId: string) => {
  const member = await getGuildMember(discordId);
  if (!member) throw new TRPCError({ code: "NOT_FOUND" });
  const [r] = await fetchMembersWithRoles([member]);
  return r;
};

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
  const dcMembers = await getGuildMembersWithRoles();
  const dbMembers = await connectMembersWithIds(prisma, dcMembers);
  const members = dcMembers.map((m) => ({
    ...m,
    id: dbMembers.find((mem) => mem.user.id === m.user.id)?.id,
  }));
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
  const salaryTakers = users.filter(
    (u) => u.id !== undefined && u.perms.includes("maaş al")
  );
  return salaryTakers.map((u) => {
    const [highestRole] = u.roles;
    if (u.id === undefined || !highestRole)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return {
      ...u,
      id: u.id,
      severity: abdullezizRoleSeverities[highestRole.name],
    };
  });
};
