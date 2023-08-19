import { Layout } from "./Layout";
import {
  GlobalPanel,
  ServantPanel,
  AdminPanel,
  DriveablePabel,
  MemberPanel,
  VoteChart,
  MembersPanel,
  HistoryPanel,
  CEOVotePanel,
} from "./panels";
import {
  useGetAbdullezizUser,
  useGetAbdullezizUsersSorted,
} from "~/utils/useDiscord";
import { useSession } from "next-auth/react";
import { LoadingDashboard } from "./LoadingDashboard";
import { type AbdullezizPerm } from "~/utils/abdulleziz";
import { Users } from "lucide-react";
import { Card } from "./ui/card";

export const Dashboard: React.FC = () => {
  const { data: session } = useSession();
  const { isLoading, data } = useGetAbdullezizUser();
  const members = useGetAbdullezizUsersSorted().data ?? [];

  const panels =
    !isLoading && !!data
      ? [
          AdminPanel,
          ServantPanel,
          DriveablePabel,
          MemberPanel,
          GlobalPanel,
          CEOVotePanel,
        ].filter(
          // if any of the visibleBy permissions are not in the user's perms,
          // don't show the panel
          (p) => {
            const visibleBy = p.visibleBy as AbdullezizPerm[] | undefined;
            return (
              visibleBy === undefined ||
              visibleBy.some((perm) => data.perms.includes(perm))
            );
          }
        )
      : [GlobalPanel];

  return isLoading ? (
    <LoadingDashboard />
  ) : (
    <>
      <Layout>
        <div className="flex-grow">
          <main className="space-y-6 p-6 sm:p-10">
            <div className="flex flex-col justify-between space-y-6 md:flex-row md:space-y-0">
              <div className="mr-6">
                <h1 className="overflow-hidden pb-2 text-4xl font-semibold text-white">
                  Hoş geldin {session?.user.name}!
                </h1>
              </div>
            </div>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Card className="flex items-center rounded-lg p-8 shadow">
                <Users className="h-16 w-16" />
                <div>
                  <span className="block text-2xl font-bold">
                    {members.length}
                  </span>
                  <span className="block text-gray-500">
                    Abdülleziz Çalışanı
                  </span>
                </div>
              </Card>
              {panels.map((Panel, i) => (
                <Panel key={i} />
              ))}
            </section>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-flow-col xl:grid-cols-4 xl:grid-rows-3">
              <MembersPanel />
              <HistoryPanel />
              <Card className="flex flex-col rounded-lg shadow md:col-span-2 md:row-span-2">
                <div className="border-b border-gray-100 px-6 py-5 font-semibold">
                  Oylar!
                </div>
                <div className="flex-grow p-4">
                  <VoteChart />
                </div>
              </Card>
            </section>
          </main>
        </div>
      </Layout>
    </>
  );
};
