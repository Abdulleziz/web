import { REST } from "@discordjs/rest";
import {
  type APIExternalGuildScheduledEvent,
  type GuildScheduledEventPrivacyLevel,
  type GuildScheduledEventEntityType,
  GuildScheduledEventStatus,
  Routes,
} from "discord-api-types/v10";
import type {
  RESTPostAPIGuildScheduledEventJSONBody,
  RESTPatchAPIGuildScheduledEventJSONBody,
} from "discord-api-types/rest/v10";
import { env } from "~/env.mjs";
import { ABDULLEZIZ_SERVER_ID } from "./guild";

const discord = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

type Event = APIExternalGuildScheduledEvent;

const EVENTS_SERVER_ID =
  env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? ABDULLEZIZ_SERVER_ID
    : "261518869498298368";

export async function getGuildEvents(guildId = EVENTS_SERVER_ID) {
  return (await discord.get(Routes.guildScheduledEvents(guildId))) as Event[];
}

export async function getGuildEvent(
  eventId: string,
  guildId = EVENTS_SERVER_ID
) {
  return (await discord.get(
    Routes.guildScheduledEvent(guildId, eventId)
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
  const body: RESTPostAPIGuildScheduledEventJSONBody = {
    entity_metadata: {
      location,
    },
    name,
    privacy_level: 2 satisfies GuildScheduledEventPrivacyLevel,
    description,
    scheduled_start_time: new Date(Date.now() + 2 * 1000).toISOString(),
    scheduled_end_time: endTime.toISOString(),
    entity_type: 3 satisfies GuildScheduledEventEntityType,
    image,
  };

  return (await discord.post(Routes.guildScheduledEvents(guildId), {
    body,
  })) as Event;
}

export async function modifyGuildEvent(
  eventId: string,
  status: "Scheduled" | "Active" | "Completed" | "Canceled",
  guildId = EVENTS_SERVER_ID
) {
  const body: RESTPatchAPIGuildScheduledEventJSONBody = {
    status: GuildScheduledEventStatus[status],
  };

  return (await discord.patch(Routes.guildScheduledEvent(guildId, eventId), {
    body,
  })) as Event;
}
