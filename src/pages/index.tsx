import { type NextPage } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import { WelcomeComponent } from "~/components/WelcomeComponents";
import { Button } from "~/components/ui/button";

const Home: NextPage = () => {
  const { data: session } = useSession();

  return (
    <Layout>
      <WelcomeComponent />
      {!!session && (
        <div className="flex flex-col items-center justify-center">
          <Button disabled={!session.user.inAbdullezizServer}>
            <Link href="/dashboard">Got to Dashboard</Link>
          </Button>
        </div>
      )}
    </Layout>
  );
};

export default Home;
