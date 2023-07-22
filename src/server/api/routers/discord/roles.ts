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
} from "~/utils/zod-utils";
import { getAbdullezizUsers } from "~/server/discord-api/trpc";
import { sortRoles } from "~/server/discord-api/utils";

export const PROMOTE = 1.5;
export const DEMOTE = 2.0;

const DiscordId = z.string().min(1);
type DiscordId = string;

const AbdullezizRole = z
  .string()
  .refine((role) => abdullezizRoles[role as AbdullezizRole] !== undefined)
  .transform((r) => r as AbdullezizRole);

const Vote = z.object({
  user: DiscordId,
  role: AbdullezizRole,
});

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

async function checkVote(
  voterId: DiscordId,
  userId: DiscordId,
  targetRole: AbdullezizRole, // quit as null
  beforeHighest?: DiscordId | null
) {
  const users = await getAbdullezizUsers();
  const voter = users.find((u) => u.id === voterId);
  const user = users.find((u) => u.id === userId);

  if (!voter || !user)
    throw new TRPCError({ code: "NOT_FOUND", message: "Kullanıcı bulunamadı" });

  const voterRole = sortRoles(voter.roles)[0];
  const voterSeverity = getSeverity(voterRole);
  const userRole =
    beforeHighest !== undefined
      ? getRoleFromId(beforeHighest)
      : sortRoles(user.roles)[0];
  const userSeverity = getSeverity(userRole);
  const targetSeverity = abdullezizRoleSeverities[targetRole]; // or 1 if no role
  const quit = targetRole === userRole?.name;

  if (targetRole === "CEO" || userRole?.name === "CEO")
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Geçersiz rol değişikliği!",
    });

  if (quit || targetSeverity < userSeverity) {
    // Demote
    const selfQuit = quit && voterId === userId;
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

export const rolesRouter = createTRPCRouter({
  getSeverities: internalProcedure.query(() => {
    return { roles: abdullezizRoles, severities: abdullezizRoleSeverities };
  }),

  vote: protectedProcedure
    .input(Vote)
    .mutation(async ({ ctx, input: { user, role } }) => {
      // to create event, check if user is the starter of any "ongoing" event
      // (recalculate even if event is ongoing and user has voted before)
      // db should not store severities but only the voters (fresh severities, event collisions)
      if (ctx.session.user.discordId === user)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kendine oy veremezsin",
          // quit, (not implemented or supported yet)
          // NOTE: CEO can't quit lol
        });

      const { totalRequired, voterSeverity } = await checkVote(
        ctx.session.user.discordId,
        user,
        role
      );

      // check if requirement is met with other voters

      throw new TRPCError({
        code: "METHOD_NOT_SUPPORTED",
        message: `Not implemented yet, ${totalRequired} ${voterSeverity}`,
      });
    }),
  voteCEO: protectedProcedure.input(DiscordId).mutation(({ ctx, input }) => {
    if (ctx.session.user.discordId === input)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Kendine oy veremezsin",
      });

    // check latest event, (if ended) reject with too many requests (a week)
    // create event if not
    // create 3 days timeout with upstash, with event id

    // if event is ongoing,
    // can change vote only each 10 minutes
    // finish if got enough votes, cleanup timeout

    throw new TRPCError({
      code: "METHOD_NOT_SUPPORTED",
      message: "Not implemented yet",
    });
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

      const parsed = AbdullezizRole.safeParse(input.role);

      if (!parsed.success)
        // not verified role, no need to check
        return { voterSeverity: 1, totalRequired: 1 };

      // TODO: alert message deletion -> dm admins(3)

      return await checkVote(
        discordId,
        input.user,
        parsed.data,
        input.beforeHighest
      );
    }),
});
