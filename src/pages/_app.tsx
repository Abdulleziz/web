import { useEffect, useState } from "react";
import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

import { api } from "~/utils/api";

import "@uploadthing/react/styles.css";
import "~/styles/globals.css";
import { useRegisterSW } from "~/lib/pusher/notifications";
import { ThemeProvider } from "next-themes";

export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
};

const Notifications = () => {
  useRegisterSW();
  return null;
};

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Notifications />
      <ThemeProvider attribute="class" forcedTheme="dark">
        <Component {...pageProps} />
      </ThemeProvider>
      <Toaster />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
