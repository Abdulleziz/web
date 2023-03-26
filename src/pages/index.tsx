import { type NextPage } from "next";
import { useSession } from "next-auth/react";

import { useState } from "react";
import { Dashboard } from "~/components/Dashboard";
import { Layout } from "~/components/Layout";
import { WelcomeComponent } from "~/components/WelcomeComponents";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <>
      {!showDashboard ? (
        <Layout>
          <WelcomeComponent />
          {!!session && (
            <div className="flex flex-col items-center justify-center">
              <button
                className="btn-primary btn disabled:btn-error"
                disabled={!session.user.inAbdullezizServer}
                onClick={() => setShowDashboard(true)}
              >
                {session.user.inAbdullezizServer
                  ? "Kontrol Paneline Git"
                  : "Önce Abdulleziz Sunucusuna Katıl!"}
              </button>
            </div>
          )}
        </Layout>
      ) : (
        <Dashboard />
      )}
    </>
  );
};

export default Home;
