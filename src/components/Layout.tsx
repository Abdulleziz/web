import Head from "next/head";
import { Navbar } from "./Navbar";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHydrated } from "~/pages/_app";

export const Themes = [
  "dracula",
  "night",
  "coffee",
  "business",
  "retro",
  "cyberpunk",
  "halloween",
  "dark",
  "black",
  "light",
] as const;

export type Theme = (typeof Themes)[number];

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const emptyThemeStore = { theme: "dracula" } as const;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      ...emptyThemeStore,
      setTheme: (theme) => set({ theme }),
    }),
    { name: "theme-store" }
  )
);

type Props = {
  children?: React.ReactNode;
  forcedTheme?: Theme;
  title?: string;
  location?: string;
};

export const Layout: React.FC<Props> = ({
  children,
  forcedTheme = "",
  title = "Abdulleziz Corp.",
  location = "",
}) => {
  const { theme } = useThemeStore();
  const isHydrated = useHydrated();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={
            "Abdulleziz Corp. Early Alpha" + (location ? " - " : "") + location
          }
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" />
        <link rel="icon" href="/android-chrome-512x512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <main
        className="min-h-screen bg-base-300"
        data-theme={isHydrated ? forcedTheme || theme : emptyThemeStore.theme}
      >
        <Navbar />
        {children}
      </main>
    </>
  );
};
