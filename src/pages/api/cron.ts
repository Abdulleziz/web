import type { NextApiRequest, NextApiResponse, NextConfig } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";
import { z } from "zod";
import { prisma } from "~/server/db";
import {
  type RESTPostAPIChannelMessageJSONBody,
  Routes,
} from "discord-api-types/v10";
import { env } from "~/env.mjs";
import { REST } from "@discordjs/rest";

// const CronHeader = z.object({
//   "upstash-message-id": z.string(),
// });

const CronBody = z.object({
  cron: z.string(),
  debug: z.boolean().default(false),
});

// const messageId = CronHeader.parse(headers)["upstash-message-id"];
// const c = new Client({ token: env.QSTASH_TOKEN });
// const message = await c.messages.get({ id: messageId });
// const jobId = (message as typeof message & { scheduleId?: string }).scheduleId;

async function handler({ body }: NextApiRequest, res: NextApiResponse) {
  try {
    const { debug, cron } = CronBody.parse(body);

    const job = await prisma.cronJob.findUnique({
      where: { cron },
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

    const url = new URL(
      env.NODE_ENV === "production"
        ? "https://abdulleziz.com"
        : env.NEXTAUTH_URL
    );
    url.searchParams.set("exp", cron);

    const postBody: RESTPostAPIChannelMessageJSONBody = {
      content,
      embeds: [
        {
          title: `${job.title} hatırlatıcısı!`,
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

    const channelId = "1087476743142637579";
    const discord = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
    await discord.post(Routes.channelMessages(channelId), { body: postBody });

    console.log("posted to discord");
    res.status(200);
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
