import type { NextApiRequest, NextApiResponse, NextConfig } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";
import { z } from "zod";
import { prisma } from "~/server/db";
import {
  AllowedMentionsTypes,
  type RESTPostAPIWebhookWithTokenFormDataBody,
} from "discord-api-types/v10";
import { env } from "~/env.mjs";

const CronHeader = z.object({
  "upstash-message-id": z.string(),
});

const CronBody = z
  .object({
    debug: z.boolean().default(false),
  })
  .optional();

async function handler(
  { headers, body }: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const jobId = CronHeader.parse(headers)["upstash-message-id"];
    const debug = CronBody.parse(body)?.debug;

    const job = await prisma.cronJob.findUnique({
      where: { jobId },
      include: { listeners: { include: { listener: true } } },
    });

    console.log({ job });

    if (!job) {
      res.status(404).send("Job not found");
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

    let content = `Hatırlatıcı ${discordIds
      .map((id) => `<@${id}>`)
      .join(", ")}`;
    if (debug) content = `[🧪TEST💻] ${content}`;

    const url =
      env.NODE_ENV === "production"
        ? "https://abdulleziz.com"
        : env.NEXTAUTH_URL;

    const postBody: RESTPostAPIWebhookWithTokenFormDataBody = {
      content,
      tts: false,
      allowed_mentions: {
        parse: [AllowedMentionsTypes.User],
      },
      embeds: [
        {
          title: `Test hatırlatıcısı!`,
          color: 0x41ffff,
          fields: [
            {
              name: `Abdulleziz hatırlatıcı tarafından uyarıldınız!`,
              value: `\`\`\`\nCron: ${job.cron}\n\`\`\``,
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
              style: 1,
              url: url + "/cron?jobId=" + jobId,
            },
          ],
        },
      ],
    };

    console.log("posting to discord");
    const r = await fetch(env.DISCORD_WEBHOOK, {
      method: "POST",
      body: JSON.stringify(postBody),
    });
    console.log("posted to discord", r.status);
    res.status(r.status).send(r.statusText);
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
