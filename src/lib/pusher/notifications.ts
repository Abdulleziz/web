import { env } from "~/env.mjs";
import { useHydrated } from "~/pages/_app";
import { useEffect, useRef } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { PushSubscription } from "~/utils/shared";

export const getEnv = () => {
  const e = env.NEXT_PUBLIC_VERCEL_ENV;
  return e === "development" ? "debug" : e;
};

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator))
    return console.error("[Main Worker] Service workers are not supported.");

  try {
    const registeration = await navigator.serviceWorker.register("/sw.js");
    console.log("[Main Worker] SW registered (for PSN): ", registeration.scope);
  } catch (error) {
    console.error("[Main Worker] SW registration failed: ", error);
  }
};

export const askForNotificationPermission = async () => {
  if (!(typeof window !== "undefined" && "Notification" in window)) {
    console.error("[PSN] Notifications are not supported");
    return "unsupported";
  }

  console.info("[PSN] Asking for notification permission");
  const permission = await Notification.requestPermission();
  console.info(`[PSN] Notification permission: ${permission}`);
  return permission;
};

export const createNotificationSubscription = async (optimistic = false) => {
  console.info(`[PSN] Creating Notification Service`);
  if (!(typeof window !== "undefined" && "Notification" in window)) {
    console.error("[PSN] Notifications are not supported");
    return;
  }

  if (Notification.permission !== "granted") {
    if (!optimistic) console.error("[PSN] Notification permission not granted");
    return;
  }

  console.info(`[PSN] Created PSN with permission: ${Notification.permission}`);

  if (!("serviceWorker" in navigator)) {
    console.error("[PSN] Service workers are not supported");
    return;
  }

  const swr = await navigator.serviceWorker.ready;

  return await swr.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: env.NEXT_PUBLIC_VAPID_KEY,
  });
};

export const useRegisterSW = () => {
  const session = useSession();
  const sync = api.notifications.syncSubscription.useMutation({
    onSuccess: () => {
      console.log("[PSN (internal)] Successfully fetched token");
      done.current = true;
    },
  });
  const done = useRef(false);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated || done.current || session.status !== "authenticated") return;
    void (async () => {
      try {
        done.current = true;
        await registerServiceWorker();
        const subscription = await createNotificationSubscription(true);
        if (!subscription) return;

        const validated = PushSubscription.parse(subscription.toJSON());
        await sync.mutateAsync(validated);
      } catch (error) {
        console.error("[PSN] Failed to optimisticly sync: ", error);
        done.current = true;
      }
    })();
  }, [hydrated, session.status, sync, done]);
};
