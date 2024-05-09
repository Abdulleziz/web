import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Layout } from "~/components/Layout";
import { DiscordId } from "~/utils/zod-utils";

import { ManageWorker } from "~/components/manageWorkerComponents/VoteCard";
import Image from "next/image";
import {
  useGetAbdullezizUser,
  useGetVoteEventsWithMembers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { formatName } from "~/utils/abdulleziz";
import { LoadingDashboard } from "~/components/LoadingDashboard";
import { TableCard } from "~/components/manageWorkerComponents/TableCard";

const Worker: NextPage = () => {
  const router = useRouter();
  const parseProfileId = DiscordId.safeParse(router.query.workerId);
  const { data: worker, isLoading } = useGetAbdullezizUser(
    parseProfileId.success ? parseProfileId.data : ""
  );
  const { data: voteEvents } = useGetVoteEventsWithMembers();
  const workerImage = worker && getAvatarUrl(worker.user, worker?.avatar);

  if (!parseProfileId.success)
    return (
      <Layout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p>Gerçek bir Discord id gibi durmuyor!</p>
          <div
            className="btn btn-primary"
            onClick={() => void router.push("/manage")}
          >
            Geri Dön
          </div>
        </div>
      </Layout>
    );
  if (isLoading || !worker) {
    return <LoadingDashboard />;
  }
  return (
    <Layout
      title={`Manage ${
        worker ? formatName(worker) : "Worker"
      } - Abdulleziz Corp.`}
    >
      <div className="flex min-h-screen w-full flex-1 flex-col">
        <main className="flex flex-col space-y-6 p-6 sm:p-10">
          <div className="flex flex-row items-center ">
            {workerImage && (
              <Image
                className="rounded-full"
                src={workerImage}
                width={128}
                height={128}
                alt="Profile Image"
              />
            )}
            <div className="flex flex-col">
              <h1 className="ml-8 text-3xl">
                {worker ? formatName(worker) : "Worker"}
              </h1>
              {worker?.roles.map((role) => (
                <h1
                  className="ml-8"
                  key={role.id}
                  style={{
                    color: `#${role.color.toString(16).padStart(6, "0")}`,
                  }}
                >
                  {role.name}
                </h1>
              ))}
            </div>
          </div>
          <div className=" grid grid-cols-1 gap-3 md:grid-cols-2">
            {voteEvents && (
              <>
                <ManageWorker worker={worker} />
                <TableCard voteEvents={voteEvents} worker={worker} />
              </>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Worker;
