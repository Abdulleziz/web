import type { PrismaClient } from "@prisma/client";
import {
  abdullezizRoles,
  abdullezizRoleSeverities,
  type AbdullezizRole,
} from "~/utils/zod-utils";
import { ABDULLEZIZ_SERVER_ID, type Member } from "./guild";

// discord permlerinden abdülleziz-verified rolleri alıyoz
// CEO, CTO... gibi
export const getAbdullezizRoles = <Role extends { id: string; name: string }>(
  roles: Role[] | undefined
) => {
  const r = abdullezizRoles;
  const s = abdullezizRoleSeverities;
  return (roles ?? [])
    .filter((role) => r[role.name as AbdullezizRole] === role.id)
    .map((role) => ({ ...role, name: role.name as AbdullezizRole }))
    .sort((a, b) => s[b.name] - s[a.name]);
};

export const getAvatarUrl = (
  user: Pick<Exclude<Member["user"], undefined>, "avatar" | "id">,
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

  return `${CDN}/embed/avatars/${Number(id) % 5}.png`;
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
