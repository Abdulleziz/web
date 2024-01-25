import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { Layout } from "~/components/Layout";
import { LoadingDashboard } from "~/components/LoadingDashboard";
import CreateCronCard from "~/components/cronComponents/CreateCron";
import CronTable from "~/components/cronComponents/CronTable";
import { useGetAllCrons } from "~/utils/useCron";

const Reminder: NextPage = () => {
  const { data: session } = useSession();
  const { data } = useGetAllCrons();

  if (!session || !data) {
    return <LoadingDashboard />;
  }

  return (
    <Layout>
      <CreateCronCard />
      {!!data && <CronTable data={data} />}
    </Layout>
  );
};

export default Reminder;
