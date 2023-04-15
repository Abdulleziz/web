import type {
  RESTGetAPIGuildMemberResult,
  RESTGetAPIGuildRolesResult,
  RESTPostAPIGuildRoleJSONBody,
  RESTPatchAPIGuildMemberJSONBody,
  // bu typeları kullanmak çok işe yarıyor, ide autocomplete typescript 😎
} from "discord-api-types/v10";

import { discordFetch } from ".";
import { timedCache } from "./utils";

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

const createGetGuildMembers = (guildId: string) => {
  // çok fazla discord api request atmasın diye 1 dakika cacheleyelim
  return timedCache(async () => {
    const res = await discordFetch<Member[]>(
      `guilds/${guildId}/members?limit=100`,
      { method: "GET" }
    );
    if (res)
      return res.map((m) => {
        if (!m.user) throw new Error("unreachable, createGetGuildMembers");
        return { ...m, user: m.user };
      });
  }, 1000 * 60);
};

const getGuildMembersIdCache = new Map<
  string,
  ReturnType<typeof createGetGuildMembers>
>();

export async function getGuildMembers(guildId = ABDULLEZIZ_SERVER_ID) {
  let cache = getGuildMembersIdCache.get(guildId);
  if (!cache) {
    cache = createGetGuildMembers(guildId);
    getGuildMembersIdCache.set(guildId, cache);
  }
  return await cache();
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
