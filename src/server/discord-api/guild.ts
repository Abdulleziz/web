import type {
  RESTGetAPIGuildMemberResult,
  RESTGetAPIGuildRolesResult,
  RESTPostAPIGuildRoleJSONBody,
  RESTPatchAPIGuildMemberJSONBody,
  // bu typeları kullanmak çok işe yarıyor, ide autocomplete typescript 😎
} from "discord-api-types/v10";

import { discordFetch } from ".";

export type Member = RESTGetAPIGuildMemberResult;
export type Roles = RESTGetAPIGuildRolesResult;

export const ABDULLEZIZ_SERVER_ID = "918833527389315092";

export async function getGuildMember(
  userId: string,
  guildId = ABDULLEZIZ_SERVER_ID // <-- default value, not required
) {
  return await discordFetch<Member>(`guilds/${guildId}/members/${userId}`, {
    method: "GET",
  });
}

export async function getGuildMembers(guildId = ABDULLEZIZ_SERVER_ID) {
  return await discordFetch<Member[]>(`guilds/${guildId}/members?limit=100`, {
    method: "GET",
  });
}

export async function modifyGuildMember(
  userId: string,
  options?: RESTPatchAPIGuildMemberJSONBody,
  guildId = ABDULLEZIZ_SERVER_ID
) {
  return await discordFetch<Member>(`guilds/${guildId}/members/${userId}`, {
    method: "PATCH",
    body: options ? JSON.stringify(options) : undefined,
  });
}

export async function modifyGuildMemberRole(
  userId: string,
  roleId: string,
  method: "PUT" | "DELETE",
  guildId = ABDULLEZIZ_SERVER_ID
) {
  return await discordFetch<undefined>(
    `guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method }
  );
}

export async function getGuildRoles(guildId = ABDULLEZIZ_SERVER_ID) {
  return await discordFetch<Roles>(`guilds/${guildId}/roles`, {
    method: "GET",
  });
  
}

export async function getGuildRole(
  roleId: string,
  guildId = ABDULLEZIZ_SERVER_ID
) {
  return await discordFetch<Roles>(`guilds/${guildId}/roles/${roleId}`, {
    method: "GET",
  });
}

export async function createGuildRole(
  options?: RESTPostAPIGuildRoleJSONBody,
  guildId = ABDULLEZIZ_SERVER_ID
) {
  return await discordFetch<Roles>(`guilds/${guildId}/roles`, {
    method: "POST",
    body: options ? JSON.stringify(options) : undefined,
  });
}

export async function deleteGuildRole(
  roleId: string,
  guildId = ABDULLEZIZ_SERVER_ID
) {
  return await discordFetch<undefined>(`guilds/${guildId}/roles/${roleId}`, {
    method: "DELETE",
  });
}
