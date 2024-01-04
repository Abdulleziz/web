import { REST } from "@discordjs/rest";
import { TRPCError } from "@trpc/server";
import { Client } from "@upstash/qstash";
import * as v10 from "discord-api-types/v10";
import { z } from "zod";
import { env } from "~/env.mjs";
import { Vote } from "~/server/api/routers/discord/roles";
import { sendNotification } from "~/server/api/trpc";
import { prisma } from "~/server/db";
import { getSalaryTakers, informEmergency } from "~/server/discord-api/trpc";
import { getDomainUrl } from "~/utils/api";
import { createTRPCRouter, qstashProcedure } from "../trpc";
import { type Prisma } from "@prisma/client";

export const CronBody = z.object({
  cron: z.string(),
  debug: z.boolean().default(false),
});

export const PushBody = z.object({
  title: z.string(),
  body: z.string().optional(),
  silent: z.boolean().optional(),
});

export const SalaryCreateBody = z.object({
  income: z.number().min(1_000).max(10_000).optional(),
  multiplier: z.number().min(10).max(20).default(10),
});

type DMBody = v10.RESTPostAPICurrentUserCreateDMChannelJSONBody;
type DMResult = v10.RESTPostAPICurrentUserCreateDMChannelResult;

type MessageBody = v10.RESTPostAPIChannelMessageJSONBody;

export const qstashRouter = createTRPCRouter({
  // only manual trigger
  push: qstashProcedure.input(PushBody).mutation(async ({ input: parsed }) => {
    const subs = await prisma.pushSubscription.findMany();
    const notif = await sendNotification(subs, parsed);

    console.log("push notif result in cron", { notif });
  }),
  // only manual trigger
  salary: createTRPCRouter({
    check: qstashProcedure.mutation(async () => {
      const unpaidSalaries = await prisma.bankSalary.findMany({
        where: { paidAt: null },
      });

      if (unpaidSalaries.length > 3)
        console.log("3'ten fazla ödenmemiş maaş var");

      if (unpaidSalaries.length === 0) return;

      await informEmergency(unpaidSalaries.length);
    }),
    create: qstashProcedure
      .input(SalaryCreateBody)
      .mutation(async ({ input: parsed }) => {
        const income =
          parsed.income ??
          1_000 *
            // 3 dice, pick the highest
            Math.ceil(
              Math.max(
                Math.random() * 10,
                Math.random() * 10,
                Math.random() * 10
              )
            );

        // TODO: bankIncome
        await prisma.bankTransaction.create({
          data: { amount: income, operation: "deposit" },
        });

        const salaryTakers = await getSalaryTakers();
        // highest_role.severity x multiplier (90 * 10 = 900)
        const result = await prisma.bankSalary.create({
          data: {
            multiplier: parsed.multiplier,
            salaries: {
              createMany: {
                data: salaryTakers.map((u) => ({
                  toId: u.id,
                  severity: u.severity,
                })),
              },
            },
          },
        });

        const notfiy = await prisma.pushSubscription.findMany({});
        await sendNotification(notfiy, {
          title: "ŞİRKET GELİRLERİ AÇIKLANDI 🤠",
          body: `Şirket gelirleri açıklandı, maaşlar dağıtılmaya hazır @CFO!`,
        });

        console.log("salary creation result", { result });
      }),
  }),
  // only automatic trigger
  vote: qstashProcedure.input(Vote).mutation(async ({ input: parsed }) => {
    const { role, user } = parsed;
    const event = await (role === "CEO"
      ? prisma.voteEventCEO.findFirst({
          where: { endedAt: null },
          orderBy: { createdAt: "desc" },
        })
      : prisma.voteEvent.findFirst({
          where: { role, target: user, endedAt: null },
          orderBy: { createdAt: "desc" },
        }));

    if (!event)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vote event not found",
      });

    const query = {
      where: { id: event.id },
      data: { endedAt: new Date() },
    } satisfies Prisma.VoteEventUpdateArgs & Prisma.VoteEventCEOUpdateArgs;

    if (role === "CEO") {
      await prisma.voteEventCEO.update(query);
      const notfiy = await prisma.pushSubscription.findMany({});
      await sendNotification(
        notfiy,
        {
          title: "CEO seçimi zaman aşımına uğradı",
          body: "Yeterli oy çıkmadığı için CEO seçimi zaman aşımına uğradı.",
          silent: true,
        },
        { urgency: "low" }
      );
    } else await prisma.voteEvent.update(query);
  }),
  // only automatic trigger
  cron: qstashProcedure.input(CronBody).mutation(async ({ input: parsed }) => {
    const { debug, cron } = parsed;

    const job = await prisma.cronJob.findUnique({
      where: { cron },
      include: { listeners: { include: { listener: true } } },
    });

    console.log({ job });

    if (!job) {
      const c = new Client({ token: env.QSTASH_TOKEN });
      const schedules = await c.schedules.list();
      const id = schedules.find((s) => s.cron === cron)?.scheduleId;
      if (id) {
        await c.schedules.delete(id);
        throw new TRPCError({
          code: "CONFLICT",
          message: "Job not found in db. Deleted from qstash.",
        });
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Job not found in db or qstash.",
      });
    }

    if (job.listeners.some((l) => !l.isActive)) return;

    const users = job.listeners.map((l) => l.listener.id);
    const discordProvider = await prisma.user.findMany({
      where: { id: { in: users } },
      select: {
        accounts: {
          where: { provider: "discord" },
          select: { providerAccountId: true },
        },
      },
    });

    console.log({ discordProvider });

    const discordIds = discordProvider.flatMap((u) =>
      u.accounts.map((a) => a.providerAccountId)
    );

    let content = `${job.title} hatırlatıcısı! ${discordIds
      .map((id) => `<@${id}>`)
      .join(", ")}`;
    if (debug) content = `[🧪TEST💻] ${content}`;

    const url = new URL("/cron", getDomainUrl());
    url.searchParams.set("exp", cron);

    const postBody: MessageBody = {
      content,
      embeds: [
        {
          title: `Hatırlatıcı!`,
          color: 0x41ffff,
          fields: [
            {
              name: `Abdulleziz hatırlatıcı tarafından uyarıldınız!`,
              value: `\`\`\`\nCron: ${cron}\n\`\`\``,
            },
          ],
        },
      ],
      components: [
        {
          type: v10.ComponentType.ActionRow,
          components: [
            {
              type: v10.ComponentType.Button,
              label: "Hatırlatıcıyı göster",
              style: v10.ButtonStyle.Link,
              url: url.toString(),
            },
          ],
        },
      ],
    };
    console.log("posting to discord");

    const discord = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
    const announce = (id: string) =>
      discord.post(v10.Routes.channelMessages(id), { body: postBody });

    if (job.isGlobal) {
      const channelId = "1087476743142637579";
      await announce(channelId);
    } else {
      for (const recipient_id of discordIds) {
        const dmBody: DMBody = { recipient_id };
        const channel = (await discord.post(v10.Routes.userChannels(), {
          body: dmBody,
        })) as DMResult;

        await announce(channel.id);
      }
    }
    await prisma.cronJob.update({
      where: { id: job.id },
      data: { lastRun: new Date() },
    });

    console.log("posted to discord");
  }),
});
