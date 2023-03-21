import Head from "next/head";
import { Navbar } from "./Navbar";
import { useSession } from "next-auth/react";

type Props = {
  children?: React.ReactNode;
  theme?: string;
  title?: string;
};

export const Layout: React.FC<Props> = ({
  children,
  theme = "dracula",
  title = "Abdulleziz Corp.",
}) => {
  const { data: session } = useSession();
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Abdulleziz Corp. Early Alpha" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-base-300" data-theme={theme}>
        <Navbar />
        {children}
      </main>
    </>
  );
};
