import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Layout } from "~/components/Layout";
import {
  type AbdullezizRole,
  PROMOTE,
  DEMOTE,
  DiscordId,
  abdullezizRoles,
  abdullezizRoleSeverities,
} from "~/utils/zod-utils";
import Image from "next/image";
import { LoadingDashboard } from "~/components/LoadingDashboard";
import classNames from "classnames";
import {
  useVote,
  useGetAbdullezizUser,
  useGetVoteEventsWithMembers,
  useGetCEOVoteEvent,
  useVoteCEO,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { formatName } from "~/utils/abdulleziz";
import { VoteEvent } from ".";
import { Card } from "~/components/ui/card";

const Worker: NextPage = () => {
  const router = useRouter();
  const parseProfileId = DiscordId.safeParse(router.query.workerId);
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center pb-32">
      <div className="flex w-full flex-1 flex-col">
        <ManageWorker profileId={parseProfileId.data} />
      </div>
    </div>
  );
};

const ManageWorker: React.FC<{ profileId: string }> = ({ profileId }) => {
  const self = useGetAbdullezizUser();
  const vote = useVote();
  const voteCEO = useVoteCEO();
  const voteEventCEO = useGetCEOVoteEvent();
  const { data: worker, isLoading } = useGetAbdullezizUser(profileId);
  const { data: voteEvents } = useGetVoteEventsWithMembers();

  const roles = Object.keys(abdullezizRoles) as AbdullezizRole[];
  const workerImage = worker && getAvatarUrl(worker.user, worker?.avatar);

  return isLoading || !voteEvents ? (
    <LoadingDashboard />
  ) : (
    <Layout
      title={`Manage ${
        worker ? formatName(worker) : "Worker"
      } - Abdulleziz Corp.`}
    >
      <div className="flex-grow">
        <main className="space-y-6 p-6 sm:p-10">
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
          <Card>
            <div className="flex rounded-lg shadow"></div>
            {worker?.roles[0]?.name !== "CEO" ? (
              <div className="flex flex-col gap-2 rounded-lg p-4 shadow lg:gap-4 lg:p-8">
                {roles.map((role) => {
                  if (role === "CEO") {
                    return (
                      <div className="flex items-start gap-4" key={role}>
                        <h1 className="md:text-2xl">{role}</h1>
                        <button
                          disabled={!!voteEventCEO.data?.sitUntil}
                          onClick={() => voteCEO.mutate(worker?.user.id ?? "")}
                          className={classNames(
                            "btn btn-xs bg-black text-zinc-300",
                            { ["loading"]: voteCEO.isLoading }
                          )}
                        >
                          {!voteEventCEO.data || !!voteEventCEO.data.endedAt
                            ? "CEO oylaması başlat"
                            : "CEO oyu ver"}
                        </button>
                      </div>
                    );
                  }

                  const userSelf = worker?.user.id === self.data?.user.id;
                  const userRole = worker?.roles[0]?.name;
                  const selfRole = self.data?.roles[0]?.name;
                  const severity = abdullezizRoleSeverities[role];
                  const quit = userRole === role;
                  // prettier-ignore
                  const userSeverity = userRole ? abdullezizRoleSeverities[userRole]: 1;
                  // prettier-ignore
                  const selfSeverity = selfRole ? abdullezizRoleSeverities[selfRole]: 1;
                  const promote = severity >= userSeverity && !quit;
                  const required = promote
                    ? PROMOTE * severity
                    : DEMOTE * userSeverity;

                  const instant =
                    (userSelf && quit) || required <= selfSeverity;
                  return (
                    <div className="flex items-start gap-4" key={role}>
                      <h1 className="md:text-2xl">{role}</h1>
                      <button
                        onClick={() =>
                          vote.mutate({ role, user: worker?.user.id ?? "" })
                        }
                        className={classNames(
                          "btn btn-xs",
                          quit
                            ? "btn-error"
                            : promote
                            ? "btn-success"
                            : "btn-primary"
                        )}
                      >
                        {quit
                          ? userSelf
                            ? "Ayrıl"
                            : instant
                            ? "Kov"
                            : `Kovma oylaması başlat n: ${required}`
                          : promote
                          ? instant
                            ? "Yükselt"
                            : `Yükseltme oylaması başlat n: ${required}`
                          : instant
                          ? "Düşür"
                          : `Düşürme oylaması başlat n: ${required}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-4 rounded-lg p-8 shadow">
                <p className="text-2xl">{"CEO'yu"} yönetemezsin</p>
              </div>
            )}
          </Card>
          <Card className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {voteEvents
              .filter((e) => e.target.user.id === worker?.user.id)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col items-center rounded-lg p-8 shadow"
                >
                  <VoteEvent event={event} />
                </div>
              ))}
          </Card>
        </main>
      </div>
    </Layout>
  );
};
export default Worker;
