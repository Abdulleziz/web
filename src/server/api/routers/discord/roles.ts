import { z } from "zod";
import {
  createTRPCRouter,
  internalProcedure,
  protectedProcedure,
} from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  type AbdullezizRole,
  abdullezizRoles,
  abdullezizRoleSeverities,
  PROMOTE,
  DEMOTE,
  DiscordId,
} from "~/utils/zod-utils";
import {
  getGuildMember,
  modifyGuildMemberRole,
} from "~/server/discord-api/guild";
import {
  fetchMembersWithRoles,
  getGuildMembersWithRoles,
} from "~/server/discord-api/trpc";
import { Client } from "@upstash/qstash/nodejs";
import { env } from "~/env.mjs";
import { getDomainUrl } from "~/utils/api";
import { type CronBody } from "~/pages/api/cron";

const AbdullezizRole = z
  .string()
  .refine((role) => abdullezizRoles[role as AbdullezizRole] !== undefined)
  .transform((r) => r as AbdullezizRole);

export const Vote = z.object({
  user: DiscordId,
  role: AbdullezizRole,
});
export type Vote = z.infer<typeof Vote>;

function getSeverity<Role extends { name: AbdullezizRole }>(
  role: Role | undefined
) {
  return role ? abdullezizRoleSeverities[role.name] : 1;
}

const getRoleFromId = (id: DiscordId | null) => {
  if (!id) return;
  for (const [role, roleId] of Object.entries(abdullezizRoles))
    if (roleId === id) return { name: role as AbdullezizRole };
};

type MiniUser = {
  user: { id: DiscordId };
  roles: Array<{ name: AbdullezizRole }>;
};

function checkVote<Voter extends MiniUser, User extends MiniUser>(
  voter: Voter,
  user: User,
  targetRole: AbdullezizRole, // quit as null
  beforeHighest?: DiscordId | null
) {
  const voterRole = voter.roles[0];
  const voterSeverity = getSeverity(voterRole);
  const userRole =
    beforeHighest !== undefined ? getRoleFromId(beforeHighest) : user.roles[0];
  const userSeverity = getSeverity(userRole);
  const targetSeverity = abdullezizRoleSeverities[targetRole]; // or 1 if no role
  const quit = targetRole === userRole?.name || targetRole === null;

  if (targetRole === "CEO" || userRole?.name === "CEO")
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "CEO rolü ile oynayamazsın!",
    });

  if (quit || targetSeverity < userSeverity) {
    // Demote
    const selfQuit = quit && voter.user.id === user.user.id;
    return {
      voterSeverity,
      totalRequired: !selfQuit ? userSeverity * DEMOTE : userSeverity,
      quit,
    };
  }

  // Promote
  return {
    voterSeverity,
    totalRequired: targetSeverity * PROMOTE,
    quit: false,
  };
}

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;
const FIVE_MINUTES = 1000 * 60 * 5;

export const rolesRouter = createTRPCRouter({
  getSeverities: internalProcedure.query(() => {
    return { roles: abdullezizRoles, severities: abdullezizRoleSeverities };
  }),
  getVotes: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.voteEvent.findMany({
      take: 20,
      include: { votes: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }),
  getCEOVotes: protectedProcedure.query(async ({ ctx }) => {
    const r = await ctx.prisma.voteEventCEO.findFirst({
      include: { votes: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    const v: typeof r = {
      createdAt: new Date(),
      endedAt: null,
      id: "clfjhbmnr0000pynwo484zadl",
      jobId: null,
      votes: [
        {
          createdAt: new Date(),
          id: "clfjhbmnr0001pynw0q4zadl",
          eventId: "clfjhbmnr0000pynwo484zadl",
          target: "223071656510357504",
          voter: "222663527784120320",
        },
        {
          createdAt: new Date(),
          id: "clfjhbmnr0001pynw0q4zadl",
          eventId: "clfjhbmnr0000pynwo484zadl",
          target: "223071656510357504",
          voter: "222663527784120320",
        },
        {
          createdAt: new Date(),
          id: "clfjhbmnr0001pynw0q4zadl",
          eventId: "clfjhbmnr0000pynwo484zadl",
          target: "223071656510357504",
          voter: "222663527784120320",
        },
        {
          createdAt: new Date(),
          id: "clfjhbmnr0001pynw0q4zadl",
          eventId: "clfjhbmnr0000pynwo484zadl",
          target: "223071656510357504",
          voter: "222663527784120320",
        },
        {
          createdAt: new Date(),
          id: "clfjhbmnr0001pynw0q4zadl",
          eventId: "clfjhbmnr0000pynwo484zadl",
          target: "223071656510357504",
          voter: "222663527784120320",
        },
        {
          createdAt: new Date(),
          id: "clfjhbmnr0001pynw0q4zadl",
          eventId: "clfjhbmnr0000pynwo484zadl",
          target: "223071656510357504",
          voter: "222663527784120320",
        },
        {
          createdAt: new Date(),
          id: "clfjhbmnr0001pynw0q4zadl",
          eventId: "clfjhbmnr0000pynwo484zadl",
          target: "223071656510357504",
          voter: "222663527784120320",
        },
      ],
    };
    return v;
  }),
  vote: protectedProcedure
    .input(Vote)
    .mutation(async ({ ctx, input: { user, role } }) => {
      const users = await getGuildMembersWithRoles();
      const voter = users.find((u) => u.user.id === ctx.session.user.discordId);
      const target = users.find((u) => u.user.id === user);

      if (!voter || !target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });

      const quit = target.roles[0]?.name === role;
      if (voter.user.id === user && !quit)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kendine oy veremezsin",
        });

      // to create event, check if user is the starter of any "ongoing" event
      const ongoingAll = await ctx.prisma.voteEvent.findMany({
        where: {
          AND: [
            { votes: { some: { voter: voter.user.id } } },
            {
              OR: [
                { endedAt: null },
                { endedAt: { gt: new Date(Date.now() - FIVE_MINUTES) } },
              ],
            },
          ],
        },
        select: { votes: { take: 1, orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      if (ongoingAll.some((e) => e.votes[0]?.voter === voter.user.id))
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Zaten bir oylama başlattın",
        });

      const ongoing = await ctx.prisma.voteEvent.findFirst({
        where: { endedAt: null, role, target: user },
        select: { id: true, votes: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      const isVoted = ongoing?.votes.some((v) => v.voter === voter.user.id);

      // (recalculate even if event is ongoing and user has voted before)

      const voters = (ongoing?.votes ?? []).map((v) => {
        const user = users.find((u) => u.user.id === v.voter);
        if (!user)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geçmişte oy veren bir kullanıcı bulunamadı",
          });
        return user;
      });

      if (!isVoted) voters.push(voter);

      let collected = 0;
      const { totalRequired, voterSeverity } = checkVote(voter, target, role);

      voters.forEach((v) => {
        const { voterSeverity: vs } = checkVote(v, target, role);
        collected += vs;
      });

      const finished = collected >= totalRequired;

      if (finished) {
        const before = target.roles[0]?.id;
        if (before)
          await modifyGuildMemberRole(target.user.id, before, "DELETE");
        const roleId = abdullezizRoles[role];
        if (!quit) await modifyGuildMemberRole(target.user.id, roleId, "PUT");
      }

      if (!ongoing) {
        await ctx.prisma.voteEvent.create({
          data: {
            role,
            target: user,
            votes: { create: { voter: voter.user.id } },
            endedAt: finished ? new Date() : null,
          },
        });
      } else {
        await ctx.prisma.voteEvent.update({
          where: { id: ongoing.id },
          data: {
            endedAt: finished ? new Date() : undefined,
            votes: isVoted ? undefined : { create: { voter: voter.user.id } },
          },
        });
      }

      return { finished, collected, totalRequired, voterSeverity };
    }),
  voteCEO: protectedProcedure
    .input(DiscordId)
    .mutation(async ({ ctx, input: user }) => {
      if (env.NEXT_PUBLIC_VERCEL_ENV !== "production")
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "CEO oylaması sadece production'da çalışır",
        });

      if (ctx.session.user.discordId === user)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kendine oy veremezsin",
        });

      const users = await getGuildMembersWithRoles();
      const voter = users.find((u) => u.user.id === ctx.session.user.discordId);
      const target = users.find((u) => u.user.id === user);

      if (!voter || !target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });

      const latest = await ctx.prisma.voteEventCEO.findFirst({
        include: { votes: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      const isThreeDaysPast = latest
        ? new Date().getTime() - latest.createdAt.getTime() > THREE_DAYS
        : true;

      if (isThreeDaysPast && !latest?.endedAt)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Bir hata oluştu, lütfen website adminlerine bildir (CEOVOTE-SCHEDULE-CORRECTION)",
        });

      const isWeekPast =
        latest && latest.endedAt
          ? new Date().getTime() - latest.endedAt.getTime() > ONE_WEEK
          : true;

      if (!isThreeDaysPast || !isWeekPast)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "CEO koltukta en az bir hafta geçirmeden veya oylama bitmeden yeni bir CEO seçemezsin",
        });

      const isVoted = latest?.votes.some((v) => v.voter === voter.user.id);

      const voters = (latest?.votes ?? []).map((v) => {
        const user = users.find((u) => u.user.id === v.voter);
        if (!user)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geçmişte oy veren bir kullanıcı bulunamadı",
          });
        return user;
      });

      if (!isVoted) voters.push(voter);

      const percent = voters.length / users.filter((u) => !u.user.bot).length;
      const finished = percent >= 0.66;

      const c = new Client({ token: env.QSTASH_TOKEN });

      if (isWeekPast) {
        let jobId: string;
        if (env.NEXT_PUBLIC_VERCEL_ENV === "production") {
          const url = getDomainUrl() + "/api/cron";
          const res = await c.publishJSON({
            url,
            delay: THREE_DAYS,
            body: { type: "vote", user, role: "CEO" } satisfies CronBody,
          });
          jobId = res.messageId;
        } else {
          jobId = Math.random().toString(36).substring(2);
        }
        await ctx.prisma.voteEventCEO.create({
          data: {
            jobId,
            votes: { create: { voter: voter.user.id, target: user } },
          },
        });
      } else if (latest) {
        await ctx.prisma.voteEventCEO.update({
          where: { id: latest.id },
          data: {
            endedAt: finished ? new Date() : undefined,
            votes: isVoted
              ? undefined
              : { create: { voter: voter.user.id, target: user } },
          },
        });
        if (finished) {
          const beforeCEO = users.find((u) => u.roles[0]?.name === "CEO");
          const CEO = abdullezizRoles["CEO"];
          if (beforeCEO)
            await modifyGuildMemberRole(beforeCEO.user.id, CEO, "DELETE");
          await modifyGuildMemberRole(target.user.id, CEO, "PUT");
          if (latest.jobId) await c.messages.delete({ id: latest.jobId });
        }
      } else
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "latest assertion failed",
        });

      // if event is ongoing,
      // TODO: can change vote only each 10 minutes
    }),

  /**
   * @internal
   */
  _discordRoleChangeProtection: internalProcedure
    .input(
      Vote.extend({ role: z.string(), beforeHighest: DiscordId.nullable() })
    )
    .query(async ({ ctx, input }) => {
      const discordId = ctx.session
        ? ctx.session.user.discordId // user has registered
        : ctx.internalDiscordId; // not registered, but may internally verified

      if (!discordId)
        throw new TRPCError({ code: "FORBIDDEN", message: "Burada işin yok!" });

      const u1 = await getGuildMember(discordId);
      const u2 = await getGuildMember(input.user);

      if (!u1 || !u2)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });

      const r = await fetchMembersWithRoles([u1, u2]);
      const voter = r[0];
      const target = r[1] as (typeof r)[0];

      const parsed = AbdullezizRole.safeParse(input.role);

      if (!parsed.success)
        // not verified role, no need to check
        return { voterSeverity: 1, totalRequired: 1 };

      return checkVote(voter, target, parsed.data, input.beforeHighest);
    }),
});
