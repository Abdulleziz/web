import * as v10 from "discord-api-types/v10";

import { discord, discordFetch } from ".";
import { ABDULLEZIZ_SERVER_ID, timedCache } from "./utils";

export type Roles = v10.RESTGetAPIGuildRolesResult;
export type Member = v10.RESTGetAPIGuildMemberResult & {
  user: NonNullable<v10.RESTGetAPIGuildMemberResult["user"]>;
};

export async function getGuildMember(
  userId: string,
  guildId = ABDULLEZIZ_SERVER_ID // <-- default value, not required
) {
  return await discordFetch<Member>(`guilds/${guildId}/members/${userId}`, {
    method: "GET",
  });
}

const createGetGuildMembers = (guildId: string) => {
  return timedCache(async () => {
    return await discordFetch<Member[]>(`guilds/${guildId}/members?limit=100`, {
      method: "GET",
    });
  }, 1000 * 15);
};

const getGuildMembersIdCache = new Map<
  string,
  ReturnType<typeof createGetGuildMembers>
>();

export async function getGuildMembers(guildId = ABDULLEZIZ_SERVER_ID) {
  let cache = getGuildMembersIdCache.get(guildId)?.[0];
  let invalidate = getGuildMembersIdCache.get(guildId)?.[1];
  if (!cache) {
    cache = createGetGuildMembers(guildId)[0];
    invalidate = createGetGuildMembers(guildId)[1];
    getGuildMembersIdCache.set(guildId, [cache, invalidate]);
  }
  return await cache();
}

export const invalidateGetGuildMembers = (guildId = ABDULLEZIZ_SERVER_ID) => {
  getGuildMembersIdCache.get(guildId)?.[1]();
};

export async function modifyGuildMember(
  userId: string,
  options?: v10.RESTPatchAPIGuildMemberJSONBody,
  guildId = ABDULLEZIZ_SERVER_ID
) {
  const ret = await discord.patch(v10.Routes.guildMember(guildId, userId), {
    body: options,
  }) as v10.RESTGetAPIGuildMemberResult;

  invalidateGetGuildMembers(guildId);
  return ret;
}

export async function modifyGuildMemberRole(
  userId: string,
  roleId: string,
  method: "PUT" | "DELETE",
  guildId = ABDULLEZIZ_SERVER_ID
) {
  const ret = await discordFetch<undefined>(
    `guilds/${guildId}/members/${userId}/roles/${roleId}`,
    { method }
  );

  invalidateGetGuildMembers(guildId);
  return ret;
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
  options?: v10.RESTPostAPIGuildRoleJSONBody,
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
  const ret = await discordFetch<undefined>(
    `guilds/${guildId}/roles/${roleId}`,
    {
      method: "DELETE",
    }
  );

  invalidateGetGuildMembers(guildId);
  return ret;
}
