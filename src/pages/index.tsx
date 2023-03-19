import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";

import { useState } from "react";
import { Dashboard } from "~/components/Dashboard";
import { WelcomeComponent } from "~/components/WelcomeComponents";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <>
      <Head>
        <title>Abdulleziz Corp.</title>
        <meta name="description" content="Abdulleziz Corp." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-base-100" data-theme="black">
        {!showDashboard ? (
          <div>
            <WelcomeComponent />
            {session !== null && (
              <div className="flex flex-col items-center justify-center">
                <button
                  className="btn-primary btn"
                  onClick={() => setShowDashboard(true)}
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </>
  );
};

export default Home;
