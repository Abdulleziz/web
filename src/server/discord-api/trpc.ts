import { TRPCError } from "@trpc/server";
import {
  type Member,
  getGuildMember,
  getGuildMembers,
  getGuildRoles,
  modifyGuildMemberRole,
} from "./guild";
import {
  STAFF_ROLE_ID,
  UNEMPLOYED_ROLE_ID,
  connectMembersWithIds,
  getAbdullezizRoles,
} from "./utils";
import {
  type AtLeastOne,
  abdullezizRoleSeverities,
  type DiscordId,
  abdullezizRoles,
  type AbdullezizRole,
  getSeverity,
} from "~/utils/zod-utils";
import { permissionDecider } from "~/utils/abdulleziz";
import { prisma } from "../db";
import { sendNotification } from "../api/trpc";

export async function inAbdullezizServerOrThrow(
  query: { databaseUserId: string } | { userEmail: string }
) {
  console.debug(`Checking user {${JSON.stringify(query)}}`);
  const account =
    "userEmail" in query
      ? await prisma.account.findFirst({
          where: {
            user: { email: query.userEmail },
            provider: "discord",
          },
          select: { providerAccountId: true },
        })
      : await prisma.account.findFirst({
          where: {
            user: { id: query.databaseUserId },
            provider: "discord",
          },
          select: { providerAccountId: true },
        });

  if (!account) {
    console.error(
      `Discord account not found for user {${JSON.stringify(query)}}`
    );

    throw new Error("Discord account not found");
  }

  const abdullezizMembers = await getGuildMembers();
  const inServer = !!abdullezizMembers?.find(
    (member) => member.user.id === account.providerAccountId
  );

  return [account.providerAccountId, inServer] as const;
}

export async function modifyMemberRole(
  member: Member,
  roleId: DiscordId,
  mode: "PUT" | "DELETE",
  rolesLength = member.roles.length
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  try {
    if (mode === "PUT" && rolesLength === 0)
      await modifyGuildMemberRole(member.user.id, UNEMPLOYED_ROLE_ID, "DELETE");
    else if (rolesLength === 1)
      await modifyGuildMemberRole(member.user.id, UNEMPLOYED_ROLE_ID, "PUT");
  } catch (error) {}

  return await modifyGuildMemberRole(member.user.id, roleId, mode);
}

export async function removeAllRoles(
  member: Member & { roles: { id: string }[] }
) {
  return await Promise.all(
    member.roles.map((r: { id: string }, i) =>
      modifyMemberRole(member, r.id, "DELETE", member.roles.length - i)
    )
  );
}

export async function fetchMembersWithRoles<M extends Member>(
  members: AtLeastOne<M>
) {
  const allRoles = await getGuildRoles();
  const roles = getAbdullezizRoles(allRoles);

  const r = members.map((member) => ({
    ...member,
    isStaff: member.roles.some((role) => role === STAFF_ROLE_ID),
    roles: roles.filter((role) => member.roles.includes(role.id)),
  }));
  return r as AtLeastOne<(typeof r)[number]>;
}

export const getGuildMemberWithRoles = async (discordId: string) => {
  const member = await getGuildMember(discordId);
  if (!member) throw new TRPCError({ code: "NOT_FOUND" });
  const [r] = await fetchMembersWithRoles([member]);
  return r;
};

export const getGuildMembersWithRoles = async () => {
  const members = (await getGuildMembers())?.filter((m) => !m.user.bot);
  if (!members) throw new TRPCError({ code: "NOT_FOUND" });
  return await fetchMembersWithRoles(
    members as AtLeastOne<(typeof members)[number]>
  );
};

// discord member + verified roles + abdulleziz perms
export const getAbdullezizUser = async (discordId: string) => {
  const member = await getGuildMemberWithRoles(discordId);
  const verifiedRoles = getAbdullezizRoles(member.roles);
  const verifiedPerms = permissionDecider(verifiedRoles.map((r) => r.name));

  return { ...member, roles: verifiedRoles, perms: verifiedPerms };
};

// discord members + their verified roles + their abdulleziz perms
export const getAbdullezizUsers = async () => {
  const dcMembers = await getGuildMembersWithRoles();
  const dbMembers = await connectMembersWithIds(prisma, dcMembers);
  const members = dcMembers.map((m) => ({
    ...m,
    id: dbMembers.find((mem) => mem.user.id === m.user.id)?.id,
  }));
  const verifiedRoles = members.map((m) => getAbdullezizRoles(m.roles));
  const verifiedPerms = verifiedRoles.map((r) =>
    permissionDecider(r.map((r) => r.name))
  );
  const verifiedMembers = members.map((m, i) => {
    const roles = verifiedRoles[i];
    const perms = verifiedPerms[i];
    if (!roles || !perms)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return { ...m, roles, perms };
  });
  return verifiedMembers;
};

export const getSalaryTakers = async () => {
  const users = await getAbdullezizUsers();
  const salaryTakers = users.filter(
    (u) => u.id !== undefined && u.perms.includes("maaş al")
  );
  return salaryTakers.map((u) => {
    const [highestRole] = u.roles;
    if (u.id === undefined || !highestRole)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return {
      ...u,
      id: u.id,
      severity: abdullezizRoleSeverities[highestRole.name],
    };
  });
};

export const informEmergency = async (unpaid: number) => {
  const notify = await prisma.pushSubscription.findMany({});

  if (unpaid > 2) {
    // TODO: borç/sigorta
    await sendNotification(
      notify,
      { title: "Maaşlar 3. kere yatmadı" },
      { urgency: "high" }
    );
    return;
  }

  if (unpaid === 2) {
    return await triggerEmergency("SYSTEM");
  }

  await sendNotification(
    notify,
    {
      title: "Maaşlar yatmadı",
      body: "Maaşlar yatmadığı için CSO tarafına OHAL ilan etme yetkisi tanınmıştır.",
    },
    { urgency: "high" }
  );
};

export const triggerEmergency = async (issuer: "USER" | "SYSTEM") => {
  let users = await getGuildMembersWithRoles();
  const notify = await prisma.pushSubscription.findMany({});

  const emergencies = await prisma.stateOfEmergency.findMany({
    where: { endedAt: { equals: null } },
  });

  if (emergencies.length > 1) {
    throw new Error("1'den fazla OHAL var");
  }

  const ohal = emergencies[0];

  if (ohal) {
    if (issuer === "USER") {
      console.error("OHAL zaten ilan edilmiş, CSO tekrar ilan edemez");
      return;
    }

    // CSO 1 hafta içinde OHAL ilan etmiş, fakat CEO halen seçilmedi. 2 veya 2den fazla maaşlar yatmamış
    // VP yeni CEO olur ve OHAL kalkar
    const { user: VP } = getOrDrawRole("Vice President", users, ["CFO", "CSO"]);
    await makeCEO(users, VP.user.id);

    const dateFmt = ohal.createdAt.toLocaleString("tr-TR", {
      month: "long",
      day: "numeric",
    });
    await sendNotification(
      notify,
      {
        title: "⏳ OHAL zaman aşımı! ⏲",
        body: `${dateFmt} itibariyle oluşan OHAL, CEO seçilmediği için zaman aşımına uğradı. 2. maaş yatmadığı için VP yeni CEO oldu.`,
      },
      { urgency: "high" }
    );
    return;
  }

  const CEOsAndCFOs = users.filter(
    (u) => u.roles[0]?.name === "CEO" || u.roles[0]?.name === "CFO"
  );
  await Promise.all(CEOsAndCFOs.map(removeAllRoles));

  users = await getGuildMembersWithRoles();
  const { user: VP, query } = getOrDrawRole("Vice President", users, ["CSO"]);

  if (query === "new")
    await modifyMemberRole(VP, abdullezizRoles["Vice President"], "PUT");

  const result = await prisma.stateOfEmergency.create({ data: {} });
  const dateFmt = result.createdAt.toLocaleString("tr-TR", {
    month: "long",
    day: "numeric",
  });

  await sendNotification(
    notify,
    {
      title: "🔴 OHAL ilan edildi! 🔴",
      body: `${dateFmt} itibariyle maaşlar yatırılmadığı için ${issuer} tarafından OHAL ilan edilmiştir.`,
    },
    { urgency: "high" }
  );

  const VPnotify = notify.filter((n) => n.userId === VP.user.id);

  if (VPnotify) {
    await sendNotification(
      VPnotify,
      {
        title:
          query === "new"
            ? "Vice President olarak atandınız."
            : "Vice President olarak OHAL'de yetkili oldunuz.",
        body:
          query === "new"
            ? "OHAL ilan edildiği için Vice President rolü size layık görüldü."
            : "OHAL ilan edildiği için Vice President olarak OHAL'de CEO yerine geçtiniz.",
      },
      { urgency: "high" }
    );
  }

  return result;
};

export const getOrDrawRole = (
  role: AbdullezizRole,
  users: Awaited<ReturnType<typeof getGuildMembersWithRoles>>,
  notIn: AbdullezizRole[]
) => {
  let result = {
    query: "old",
    user: users.find((u) => u.roles[0]?.name === role),
  };

  if (!result.user)
    result = {
      query: "new",
      user: users
        .filter((u) => {
          const topRole = u.roles[0]?.name;
          return !topRole || !notIn.includes(topRole);
        })
        .sort(
          // TODO: global sort
          (a, b) =>
            getSeverity(b.roles[0]?.name) - getSeverity(a.roles[0]?.name)
        )[0],
    };
  if (!result.user) throw new Error("user should be in users");

  return { ...result, user: result.user };
};

/**
 * removes the all roles from old and new CEOs
 * makes the new CEO
 * @returns the new CEO but with old CEO's roles
 */
export const makeCEO = async (
  users: Awaited<ReturnType<typeof getGuildMembersWithRoles>>,
  discordId: DiscordId
) => {
  const beforeCEO = users.filter((u) => u.roles[0]?.name === "CEO");
  const newCEO = users.find((u) => u.user.id === discordId);
  if (!newCEO) throw new Error("newCEO should be in users");

  await Promise.all(beforeCEO.map(removeAllRoles));
  await removeAllRoles(newCEO);

  await prisma.stateOfEmergency.updateMany({
    where: { endedAt: null },
    data: { endedAt: new Date() },
  });

  await modifyMemberRole(newCEO, abdullezizRoles["CEO"], "PUT");

  return newCEO;
};
