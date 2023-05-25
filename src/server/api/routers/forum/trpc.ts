import type { Prisma, PrismaClient } from "@prisma/client";
import type { UserId } from "~/utils/zod-utils";

export const getForumNotificationListeners = async (
  prisma: PrismaClient,
  mentions: UserId[],
  thread: Prisma.ForumThreadGetPayload<{
    select: {
      defaultNotify: true;
      notifications: {
        select: {
          preference: true;
          userId: true;
        };
      };
    };
  }>
) => {
  const members = await prisma.user.findMany({
    where: {
      defaultThreadNotify: {
        not: "none",
      },
    },
    select: {
      id: true,
      defaultThreadNotify: true,
    },
  });
  return members.filter((member) => {
    const userN = member.defaultThreadNotify;
    const threadN = thread.defaultNotify;
    const userThreadN = thread.notifications.find(
      (n) => n.userId === member.id
    )?.preference;

    if (userThreadN) {
      if (userThreadN === "none") return false;
      if (userThreadN === "mentions") return mentions.includes(member.id);
      return true;
    }

    const total = [userN, threadN];
    if (total.includes("none")) return false;
    if (total.includes("mentions")) return mentions.includes(member.id);
    return true;
  });
};
