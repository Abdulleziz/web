import PushNotifications from "@pusher/push-notifications-server";

import { env } from "~/env.mjs";

export const pushNotification = new PushNotifications({
  instanceId: env.NEXT_PUBLIC_BEAMS,
  secretKey: env.BEAMS_SECRET,
});
