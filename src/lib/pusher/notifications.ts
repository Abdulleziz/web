import { create } from "zustand";
import { Client, RegistrationState } from "@pusher/push-notifications-web";
import { env } from "~/env.mjs";
import { useHydrated } from "~/pages/_app";
import { useEffect, useRef } from "react";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

export const getEnv = () => {
  const e = env.NEXT_PUBLIC_VERCEL_ENV;
  return e === "development" ? "debug" : e;
};

const createBeams = async (swr: ServiceWorkerRegistration) => {
  const setStage = useBeams.setState;
  if (Notification.permission === "default") setStage({ stage: "loading" });
  const stage = await Notification.requestPermission();
  setStage({ stage }); // reactive permission

  console.info("[PSN] Creating beams");
  const b = new Client({
    instanceId: env.NEXT_PUBLIC_BEAMS,
    serviceWorkerRegistration: swr,
  });
  setStage({ beams: b });
  let state = await b.getRegistrationState();
  console.info(`[PSN] Created beams with registration state: ${state}`);

  if (
    state === RegistrationState.PERMISSION_GRANTED_NOT_REGISTERED_WITH_BEAMS
  ) {
    await b.start();
    state = await b.getRegistrationState();
  }
  // TOOD: addDeviceInterest via trpc 😁😅
  if (state === RegistrationState.PERMISSION_GRANTED_REGISTERED_WITH_BEAMS) {
    await b.addDeviceInterest(`${getEnv()}-all`);
    console.info(
      `[PSN] Subscribed to ${(await b.getDeviceInterests()).join(", ")}`
    );
  }
  return b;
};

type BeamsState = {
  beams?: Client;
  stage: "loading" | NotificationPermission;
  set: (beams: Client) => void;
  setStage: (stage: NotificationPermission) => void;
};

const useBeams = create<BeamsState>(() => ({
  stage: "default",
  // Stage is the observable state of the notification permission
  set: (beams) => ({ beams }),
  setStage: (stage) => ({ stage }),
}));

export const useNotificationStage = () => useBeams((s) => s.stage);
export const useGetBeams = () => {
  const b = useBeams((s) => s.beams);
  if (!b) throw new Error("Beams not initialized");
  return b;
};

export const useRegisterSW = () => {
  const session = useSession();
  const getTokenDone = useRef(false);
  const getToken = api.notifications.getToken.useMutation({
    onSuccess: () => {
      console.log("[PSN (internal)] Successfully fetched token");
      getTokenDone.current = true;
    },
  });

  const hydrated = useHydrated();
  const beams = useBeams((s) => s.beams);
  const setBeams = useBeams((s) => s.set);
  useEffect(() => {
    if (hydrated && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "[Main Worker] SW registered (for PSN): ",
            registration.scope
          );
          createBeams(registration).catch((e) =>
            console.error("[PSN] Failed to create beams", e)
          );
        })
        .catch((registrationError) => {
          console.error(
            "[Main Worker] SW registration failed: ",
            registrationError
          );
        });
    }
  }, [hydrated, setBeams]);
  useEffect(() => {
    if (getTokenDone.current || getToken.isLoading) return;
    if (beams && session.data) {
      console.log("[PSN] Setting user id");
      beams
        .setUserId(session.data.user.id, {
          fetchToken: () => getToken.mutateAsync(),
        })
        .catch((e) => {
          console.error("[PSN] Failed to set user id", e);
        });
    }
  }, [
    beams,
    getToken.isLoading,
    getToken.data,
    getTokenDone,
    session.data,
    getToken,
  ]);
};
