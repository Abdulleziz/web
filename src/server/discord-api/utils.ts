import { type AbdullezizRole, abdullezizRoles } from "~/utils/zod-utils";
import {
  ABDULLEZIZ_SERVER_ID,
  getGuildRoles,
  type Member,
  type Roles,
} from "./guild";

export const sortRoles = (roles: Roles | undefined) => {
  return (roles ?? [])
    .sort((a, b) => a.position - b.position)
    .map((role) => ({
      ...role,
      allah: (roles ?? []).length === role.position + 1,
    }));
};

// discord permlerinden abdülleziz-verified rolleri alıyoz
// CEO, CTO... gibi
export const getAbdullezizRoles = (roles: Roles) => {
  const r = abdullezizRoles;
  return roles
    .filter((role) => r[role.name as AbdullezizRole] === role.id)
    .map((role) => ({ ...role, name: role.name as AbdullezizRole }));
};

export const fetchMembersWithRoles = async (members: Member[]) => {
  const roles = sortRoles(await getGuildRoles());

  return members.map((member) => ({
    ...member,
    roles: roles.filter((role) => member.roles.includes(role.id)),
  }));
};

export const getAvatarUrl = (
  member: Member,
  guildId = ABDULLEZIZ_SERVER_ID
) => {
  const CDN = "https://cdn.discordapp.com";
  const { avatar: guildAvatar } = member;
  const { avatar, id } = member.user!;

  if (guildAvatar) {
    return `${CDN}/guilds/${guildId}/users/${id}/avatars/${guildAvatar}`;
  }

  if (avatar) {
    return `${CDN}/avatars/${id}/${avatar}`;
  }
};
