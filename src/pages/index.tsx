import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { Layout } from "~/components/Layout";
import { WelcomeComponent } from "~/components/WelcomeComponents";
import Dashboard from "./dashboard";

const Home: NextPage = () => {
  const { data: session } = useSession();
  return !!session ? (
    <Dashboard />
  ) : (
    <Layout>
      <WelcomeComponent />
    </Layout>
  );
};

export default Home;
