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
  getGuildRole,
  getGuildRoles,
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
import { type Prisma } from "@prisma/client";
import { getAbdullezizRoles } from "~/server/discord-api/utils";

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

function checkVoteCEO(
  event: Prisma.VoteEventCEOGetPayload<{ include: { votes: true } }>,
  voter: DiscordId | null,
  target: DiscordId | null,
  usersLength: number
) {
  const isThreeDaysPast =
    new Date().getTime() - event.createdAt.getTime() >
    THREE_DAYS_OR_THREE_HOURS;

  if (isThreeDaysPast && !event.endedAt)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Bir hata oluştu, lütfen website adminlerine bildir (CEOVOTE-SCHEDULE-CORRECTION)",
    });

  const isVoted = event?.votes.some((v) => v.voter === voter);

  const voters = (event?.votes ?? []).map((v) => ({
    voter: v.voter,
    target: v.target,
  }));

  if (!isVoted && voter && target) voters.push({ voter, target });

  const voteCount = new Map<DiscordId, number>();
  voters.forEach((v) => {
    const count = voteCount.get(v.target) ?? 0;
    voteCount.set(v.target, count + 1);
  });

  const percentage = env.NEXT_PUBLIC_VERCEL_ENV === "production" ? 0.66 : 0.22;

  const finisherId = [...voteCount.entries()].find(
    ([, count]) => count / usersLength >= percentage
  )?.[0];

  return { finisherId, isVoted };
}

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
const THREE_DAYS = 1000 * 60 * 60 * 24 * 3;
const ONE_DAY = 1000 * 60 * 60 * 24;
const THREE_HOURS = 1000 * 60 * 60 * 3;
const FIVE_MINUTES = 1000 * 60 * 5;

const THREE_DAYS_OR_THREE_HOURS =
  env.NEXT_PUBLIC_VERCEL_ENV === "production" ? THREE_DAYS : THREE_HOURS;

const ONE_WEEK_OR_ONE_DAY =
  env.NEXT_PUBLIC_VERCEL_ENV === "production" ? ONE_WEEK : ONE_DAY;

export const rolesRouter = createTRPCRouter({
  getSeverities: internalProcedure.query(() => {
    return { roles: abdullezizRoles, severities: abdullezizRoleSeverities };
  }),
  getRoles: protectedProcedure.query(async () => {
    const roles = await getGuildRoles();
    return getAbdullezizRoles(roles);
  }),
  getRole: protectedProcedure.input(DiscordId).query(async ({ input }) => {
    const role = await getGuildRole(input);
    if (!role)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Rol bulunamadı",
      });
    return role;
  }),
  getVotes: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.voteEvent.findMany({
      take: 20,
      include: { votes: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }),
  getCEOVotes: protectedProcedure.query(async ({ ctx }) => {
    const required = env.NEXT_PUBLIC_VERCEL_ENV === "production" ? 6 : 2;
    const event = await ctx.prisma.voteEventCEO.findFirst({
      where: {
        OR: [
          { endedAt: null },
          { endedAt: { gt: new Date(Date.now() - ONE_WEEK_OR_ONE_DAY) } },
        ],
      },
      include: { votes: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    if (!event) return event;
    const { finisherId } = checkVoteCEO(event, null, null, required);
    return {
      ...event,
      required,
      finisherId,
      sitUntil:
        event.endedAt && finisherId
          ? new Date(event.endedAt.getTime() + ONE_WEEK_OR_ONE_DAY)
          : null,
      estimated: event?.endedAt
        ? null
        : new Date(event.createdAt.getTime() + THREE_DAYS_OR_THREE_HOURS),
    };
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
      if (ctx.session.user.discordId === user)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kendine oy veremezsin",
        });

      const users = await getGuildMembersWithRoles();
      const required = users.filter((u) => !u.user.bot).length;
      const voter = users.find((u) => u.user.id === ctx.session.user.discordId);
      const target = users.find((u) => u.user.id === user);

      if (!voter || !target)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });

      const latest = await ctx.prisma.voteEventCEO.findFirst({
        where: {
          OR: [
            { endedAt: null },
            { endedAt: { gt: new Date(Date.now() - ONE_WEEK_OR_ONE_DAY) } },
          ],
        },
        include: { votes: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      const c = new Client({ token: env.QSTASH_TOKEN });

      let latestFailed = false;
      let latestSuccess = false;

      if (latest) {
        const { finisherId } = checkVoteCEO(latest, null, null, required);
        latestFailed = !!latest.endedAt && !finisherId;
        latestSuccess = !!latest.endedAt && !!finisherId;
      }

      if (!latest || latestFailed) {
        // no latest event or latest event failed and past 3 days, revote allowed
        let jobId: string | null = null;
        if (env.NEXT_PUBLIC_VERCEL_ENV !== "development") {
          const url = getDomainUrl() + "/api/cron";
          const res = await c.publishJSON({
            url,
            delay: THREE_DAYS_OR_THREE_HOURS,
            body: { type: "vote", user, role: "CEO" } satisfies CronBody,
          });
          jobId = res.messageId;
        }
        await ctx.prisma.voteEventCEO.create({
          data: {
            jobId,
            votes: { create: { voter: voter.user.id, target: user } },
          },
        });
      } else if (latest || latestSuccess) {
        if (latestSuccess)
          // latest event successfully finished and past 3 days,
          // CEO should stay until we no longer query latest event
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "CEO koltukta en az bir hafta geçirmeden yeni bir CEO seçemezsin",
          });

        // latest event ongoing...
        const { finisherId: finisher, isVoted } = checkVoteCEO(
          latest,
          voter.user.id,
          user,
          required
        );
        await ctx.prisma.voteEventCEO.update({
          where: { id: latest.id },
          data: {
            endedAt: finisher ? new Date() : undefined,
            votes: isVoted
              ? undefined
              : { create: { voter: voter.user.id, target: user } },
          },
        });
        if (finisher) {
          const beforeCEO = users.filter((u) => u.roles[0]?.name === "CEO");
          const CEO = abdullezizRoles["CEO"];
          await Promise.all(
            beforeCEO.map((u) =>
              modifyGuildMemberRole(u.user.id, CEO, "DELETE")
            )
          );

          await modifyGuildMemberRole(finisher, CEO, "PUT");
          if (latest.jobId) await c.messages.delete({ id: latest.jobId });
          return true;
        }
      } else
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "latest assertion failed",
        });

      return false;
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
