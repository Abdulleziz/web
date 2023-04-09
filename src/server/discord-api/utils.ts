import type { PrismaClient } from "@prisma/client";
import {
  abdullezizRoles,
  type AbdullezizRole,
  type AtLeastOne,
} from "~/utils/zod-utils";
import {
  ABDULLEZIZ_SERVER_ID,
  getGuildRoles,
  type Member,
  type Roles,
} from "./guild";

export const sortRoles = <Role extends Roles[number]>(
  roles: Role[] | undefined
) =>
  (roles ?? [])
    .sort((a, b) => b.position - a.position)
    .map((role) => ({
      ...role,
      allah: (roles ?? []).length === role.position + 1,
    }));

// discord permlerinden abdülleziz-verified rolleri alıyoz
// CEO, CTO... gibi
export const getAbdullezizRoles = (roles: Roles) => {
  const r = abdullezizRoles;
  return roles
    .filter((role) => r[role.name as AbdullezizRole] === role.id)
    .map((role) => ({ ...role, name: role.name as AbdullezizRole }));
};

export const fetchMembersWithRoles = async <M extends Member>(
  members: AtLeastOne<M>
) => {
  const roles = sortRoles(await getGuildRoles());

  const r = members.map((member) => ({
    ...member,
    roles: roles.filter((role) => member.roles.includes(role.id)),
  }));
  return r as AtLeastOne<(typeof r)[number]>;
};

export const getAvatarUrl = (
  user: Exclude<Member["user"], undefined>,
  guildAvatar?: Member["avatar"],
  guildId = ABDULLEZIZ_SERVER_ID
) => {
  const CDN = "https://cdn.discordapp.com";
  const { avatar, id } = user;

  if (guildAvatar) {
    return `${CDN}/guilds/${guildId}/users/${id}/avatars/${guildAvatar}`;
  }

  if (avatar) {
    return `${CDN}/avatars/${id}/${avatar}`;
  }
};

export const connectMembersWithIds = async <
  Member extends { user: { id: string } }
>(
  prisma: PrismaClient,
  members: Member[]
) => {
  const dbUsers = await prisma.user.findMany({
    where: {
      accounts: {
        some: { providerAccountId: { in: members.map((u) => u.user.id) } },
      },
    },
    select: { id: true, accounts: { select: { providerAccountId: true } } },
  });
  return members
    .filter((member) =>
      // kayıtlı olmayan dc kullanıcıları filtrele
      dbUsers.some((u) =>
        u.accounts.some((a) => a.providerAccountId === member.user.id)
      )
    )
    .map((member) => {
      const u = dbUsers.find((u) =>
        u.accounts.some((a) => a.providerAccountId === member.user.id)
      );
      if (!u) throw new Error("unreachable, connectMembersWithIds");

      return {
        id: u.id,
        ...member,
      };
    });
};

export const timedCache = <T>(fn: () => Promise<T>, ms: number) => {
  let cache: T | undefined;
  let lastFetched = 0;
  return async () => {
    if (Date.now() - lastFetched > ms) {
      cache = await fn();
      lastFetched = Date.now();
    }
    return cache;
  };
};
