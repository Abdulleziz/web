import { REST } from "@discordjs/rest";
import * as v10 from "discord-api-types/v10";
import { env } from "~/env.mjs";
import { ABDULLEZIZ_SERVER_ID } from "./guild";

const discord = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

type Event = v10.APIExternalGuildScheduledEvent;

const EVENTS_SERVER_ID =
  env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? ABDULLEZIZ_SERVER_ID
    : "261518869498298368";

export async function getGuildEvents(guildId = EVENTS_SERVER_ID) {
  return (await discord.get(
    v10.Routes.guildScheduledEvents(guildId)
  )) as Event[];
}

export async function getGuildEvent(
  eventId: string,
  guildId = EVENTS_SERVER_ID
) {
  return (await discord.get(
    v10.Routes.guildScheduledEvent(guildId, eventId)
  )) as Event;
}

export async function createGuildEvent(
  name: string,
  description: string,
  endTime: Date,
  location = "https://discord.com/channels/918833527389315092/1101080549763854406",
  image = "https://utfs.io/f/b778b0ad-5d72-457e-a799-23735b8e0f09_FxTNln1XwAYUcCU.png",
  guildId = EVENTS_SERVER_ID
) {
  const body: v10.RESTPostAPIGuildScheduledEventJSONBody = {
    entity_metadata: { location },
    name,
    privacy_level: v10.GuildScheduledEventPrivacyLevel.GuildOnly,
    description,
    scheduled_start_time: new Date(Date.now() + 2 * 1000).toISOString(),
    scheduled_end_time: endTime.toISOString(),
    entity_type: v10.GuildScheduledEventEntityType.External,
    image,
  };

  return (await discord.post(v10.Routes.guildScheduledEvents(guildId), {
    body,
  })) as Event;
}

export async function modifyGuildEvent(
  eventId: string,
  status: "Scheduled" | "Active" | "Completed" | "Canceled",
  guildId = EVENTS_SERVER_ID
) {
  const body: v10.RESTPatchAPIGuildScheduledEventJSONBody = {
    status: v10.GuildScheduledEventStatus[status],
  };

  return (await discord.patch(
    v10.Routes.guildScheduledEvent(guildId, eventId),
    { body }
  )) as Event;
}
