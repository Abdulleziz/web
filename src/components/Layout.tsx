import Head from "next/head";
import { Navbar } from "./Navbar";

type Props = {
  children?: React.ReactNode;
  theme?: string;
  title?: string;
  location?: string;
};

export const Layout: React.FC<Props> = ({
  children,
  theme = "dracula",
  title = "Abdulleziz Corp.",
  location = "",
}) => {
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
      <main className="min-h-screen bg-base-300" data-theme={theme}>
        <Navbar />
        {children}
      </main>
    </>
  );
};
