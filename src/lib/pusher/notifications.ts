import { env } from "~/env.mjs";
import { useHydrated } from "~/pages/_app";
import { useEffect, useRef } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { PushSubscription } from "~/utils/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type NotificationSyncStore = {
  // false -> unsubscribed, deleted, or not supported
  // true -> subscribed
  // undefined -> not yet determined
  isSync?: boolean;
  setSync: (isSync?: boolean) => void;
};

export const notificationSyncStore = create<NotificationSyncStore>()((set) => ({
  setSync: (isSync = true) => set({ isSync }),
}));

type NotificationSettingsStore = {
  deleted?: boolean;
  setDeleted: (deleted?: boolean) => void;
};

export const notificationSettingsStore = create<NotificationSettingsStore>()(
  persist(
    (set) => ({
      deleted: false,
      setDeleted: (deleted = true) => set({ deleted }),
    }),
    { name: "notification-settings" }
  )
);

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

  try {
    return await swr.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: env.NEXT_PUBLIC_VAPID_KEY,
    });
  } catch (error) {
    if (error instanceof DOMException)
      await (await swr.pushManager.getSubscription())?.unsubscribe();

    return await swr.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: env.NEXT_PUBLIC_VAPID_KEY,
    });
  }
};

export const deleteNotificationSubscription = async () => {
  if (!(typeof window !== "undefined" && "Notification" in window)) {
    console.error("[PSN] Notifications are not supported");
    return;
  }

  if (Notification.permission !== "granted") {
    console.error("[PSN] Notification permission not granted");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    console.error("[PSN] Service workers are not supported");
    return;
  }

  const swr = await navigator.serviceWorker.ready;
  const subscription = await swr.pushManager.getSubscription();
  if (!subscription) return;

  await subscription.unsubscribe();
  // TODO: Delete subscription from server
  console.info("[PSN] Deleted subscription");
};

// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Display_badge_on_app_icon

export const useRegisterSW = () => {
  const session = useSession();
  const pushSyncStore = notificationSyncStore();
  const pushSettingsStore = notificationSettingsStore();
  const sync = api.notifications.syncSubscription.useMutation({
    onSuccess: () => {
      console.log("[PSN (internal)] Successfully fetched token");
      done.current = true;
      pushSyncStore.setSync();
    },
    onError: () => pushSyncStore.setSync(false),
  });
  const done = useRef(false);
  const hydrated = useHydrated();

  useEffect(() => {
    if (
      !hydrated ||
      done.current ||
      session.status !== "authenticated" ||
      pushSyncStore.isSync === false ||
      pushSettingsStore.deleted
    )
      return;
    void (async () => {
      try {
        done.current = true;
        await registerServiceWorker();
        const subscription = await createNotificationSubscription(true);
        if (!subscription) {
          pushSyncStore.setSync(false);
          return;
        }

        const validated = PushSubscription.parse(subscription.toJSON());
        await sync.mutateAsync(validated);
      } catch (error) {
        console.error("[PSN] Failed to optimisticly sync: ", error);
        done.current = true;
        pushSyncStore.setSync(false);
      }
    })();
  }, [
    hydrated,
    session.status,
    sync,
    done,
    pushSyncStore,
    pushSettingsStore.deleted,
  ]);
};
