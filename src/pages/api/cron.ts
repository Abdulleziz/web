/**
 * @deprecated This file is deprecated and will be removed
 * after the merge past a week or so.
 * 
 * @use ~/server/api/routers/qstash.ts
 */

import type { NextApiRequest, NextApiResponse, NextConfig } from "next";
import { verifySignature } from "@upstash/qstash/dist/nextjs";
import { z } from "zod";
import { prisma } from "~/server/db";
import type {
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPICurrentUserCreateDMChannelJSONBody,
  RESTPostAPICurrentUserCreateDMChannelResult,
} from "discord-api-types/v10";
import { Routes } from "discord-api-types/v10";
import { env } from "~/env.mjs";
import { REST } from "@discordjs/rest";
import { getSalaryTakers, informEmergency } from "~/server/discord-api/trpc";
import { getDomainUrl } from "~/utils/api";
import { Client } from "@upstash/qstash";
import { Vote } from "~/server/api/routers/discord/roles";
import { sendNotification } from "~/server/api/trpc";

// const CronHeader = z.object({
//   "upstash-message-id": z.string(),
// });

export const CronBody = z.discriminatedUnion("type", [
  z.object({
    type: z.undefined(),
    cron: z.string(),
    debug: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("push"),
    title: z.string(),
    body: z.string().optional(),
    silent: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("salary.check"),
  }),
  z.object({
    type: z.literal("salary.create"),
    income: z.number().min(1_000).max(10_000).optional(),
    multiplier: z.number().min(10).max(20).default(10),
  }),
  Vote.extend({
    type: z.literal("vote"),
  }),
]);
export type CronBody = z.infer<typeof CronBody>;

type DMBody = RESTPostAPICurrentUserCreateDMChannelJSONBody;
type DMResult = RESTPostAPICurrentUserCreateDMChannelResult;

type MessageBody = RESTPostAPIChannelMessageJSONBody;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const parsed = CronBody.parse(req.body);

    if (parsed.type === "push") {
      const subs = await prisma.pushSubscription.findMany();
      const notif = await sendNotification(subs, parsed);

      console.log("push notif result in cron", { notif });
      res.status(200).send("OK - push");
      return;
    }

    if (parsed.type === "vote") {
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
      if (!event) {
        res.status(404).send("Vote event not found");
      } else {
        const data = { where: { id: event.id }, data: { endedAt: new Date() } };
        if (role === "CEO") {
          await prisma.voteEventCEO.update(data);
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
        } else await prisma.voteEvent.update(data);

        res.status(200).send("OK - vote");
      }
      return;
    }

    if (parsed.type === "salary.create") {
      const income =
        parsed.income ??
        1_000 *
          // 3 dice, pick the highest
          Math.ceil(
            Math.max(Math.random() * 10, Math.random() * 10, Math.random() * 10)
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
      res.status(200).send("OK - salary.create");
      return;
    }

    if (parsed.type === "salary.check") {
      const unpaidSalaries = await prisma.bankSalary.findMany({
        where: { paidAt: null },
      });

      if (unpaidSalaries.length > 3) {
        console.log("3'ten fazla ödenmemiş maaş var");
      }

      if (unpaidSalaries.length === 0) {
        res.status(200).send("OK - salary.check");
        return;
      }

      await informEmergency(unpaidSalaries.length);

      res.status(201).send("ACTION TAKEN - salary.check");
      return;
    }

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
        res.status(410).send("Job not found - cron.deleted");
      } else {
        res.status(404).send("Job not found");
      }
      return;
    }

    if (job.listeners.some((l) => !l.isActive)) {
      res.status(200).send("OK - cron.inactive");
      return;
    }

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
          type: 1,
          components: [
            {
              type: 2,
              label: "Hatırlatıcıyı göster",
              style: 5,
              url: url.toString(),
            },
          ],
        },
      ],
    };
    console.log("posting to discord");

    const discord = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
    const announce = (id: string) =>
      discord.post(Routes.channelMessages(id), { body: postBody });

    if (job.isGlobal) {
      const channelId = "1087476743142637579";
      await announce(channelId);
    } else {
      for (const recipient_id of discordIds) {
        const dmBody: DMBody = { recipient_id };
        const channel = (await discord.post(Routes.userChannels(), {
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
    res.status(200).send("OK - cron");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
}

export default verifySignature(handler);

export const config: NextConfig = {
  api: {
    bodyParser: false,
  },
};
