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

// const CronHeader = z.object({
//   "upstash-message-id": z.string(),
// });

const CronBody = z.object({
  cron: z.string(),
  debug: z.boolean().default(false),
});

type DMBody = RESTPostAPICurrentUserCreateDMChannelJSONBody;
type DMResult = RESTPostAPICurrentUserCreateDMChannelResult;

type MessageBody = RESTPostAPIChannelMessageJSONBody;

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
      (env.NODE_ENV === "production"
        ? "https://abdulleziz.com"
        : env.NEXTAUTH_URL) + "/cron"
    );
    url.searchParams.set("exp", cron);

    const postBody: MessageBody = {
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

    console.log("posted to discord");
    res.status(200).send("OK");
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
