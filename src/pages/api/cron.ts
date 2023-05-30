import type { NextApiRequest, NextApiResponse, NextConfig } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";
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
import { CreateSalary } from "~/server/api/routers/payments";
import { getSalaryTakers } from "~/server/discord-api/trpc";
import { getDomainUrl } from "~/utils/api";

// const CronHeader = z.object({
//   "upstash-message-id": z.string(),
// });

export const CronBody = z.discriminatedUnion("type", [
  z.object({
    type: z.undefined(),
    cron: z.string(),
    debug: z.boolean().default(false),
  }),
  CreateSalary.extend({
    type: z.literal("salary"),
    fromId: z.string().cuid().optional(),
  }),
]);

type DMBody = RESTPostAPICurrentUserCreateDMChannelJSONBody;
type DMResult = RESTPostAPICurrentUserCreateDMChannelResult;

type MessageBody = RESTPostAPIChannelMessageJSONBody;

// const messageId = CronHeader.parse(headers)["upstash-message-id"];
// const c = new Client({ token: env.QSTASH_TOKEN });
// const message = await c.messages.get({ id: messageId });
// const jobId = (message as typeof message & { scheduleId?: string }).scheduleId;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const parsed = CronBody.parse(req.body);

    if (parsed.type === "salary") {
      // connect to trpc
      const salaryTakers = await getSalaryTakers();
      const result = await prisma.payment.createMany({
        data: salaryTakers.map((u) => ({
          type: "salary",
          toId: u.id,
          fromId: parsed.fromId,
          amount:
            // highest_role.severity x multiplier (90 * 10 = 900)
            u.severity * parsed.multiplier,
        })),
      });
      console.log({ result });

      if (result.count < 1) {
        res.status(500).send("Failed to create any payment");
        return;
      }

      res.status(200).send("OK - salary");
      return;
    }

    const { debug, cron } = parsed;

    const job = await prisma.cronJob.findUnique({
      where: { cron },
      include: { listeners: { include: { listener: true } } },
    });

    console.log({ job });

    if (!job) {
      res.status(404).send("Job not found");
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
