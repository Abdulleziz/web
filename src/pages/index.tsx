import { type NextPage } from "next";
import { useSession } from "next-auth/react";

import { useState } from "react";
import { Dashboard } from "~/components/Dashboard";
import { Layout } from "~/components/Layout";
import { WelcomeComponent } from "~/components/WelcomeComponents";
import { Button } from "~/components/ui/button";

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
              <Button
                disabled={!session.user.inAbdullezizServer}
                onClick={() => setShowDashboard(true)}
              >
                {session.user.inAbdullezizServer
                  ? "Kontrol Paneline Git"
                  : "Önce Abdulleziz Sunucusuna Katıl!"}
              </Button>
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
