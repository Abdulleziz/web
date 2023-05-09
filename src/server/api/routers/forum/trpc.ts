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
    const total = [userN, threadN, userThreadN];

    // None
    if (total.includes("none")) return false;
    // Mentions
    if (total.includes("mentions")) return mentions.includes(member.id);
    // All
    return true;
  });
};
