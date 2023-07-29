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
  useGetAbdullezizUsers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { api } from "~/utils/api";

const Worker: NextPage = () => {
  const router = useRouter();
  const parseProfileId = DiscordId.safeParse(router.query.workerId);
  if (!parseProfileId.success)
    return (
      <Layout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p>Gerçek bir Discord id gibi durmuyor!</p>
          <div
            className="btn-primary btn"
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
  const { data: worker, isLoading } = api.discord.getAbdullezizUsers.useQuery(
    undefined,
    { select: (users) => users.find((u) => u.user.id === profileId) }
  );
  const members = useGetAbdullezizUsers().data ?? [];

  const memberFromId = (id: string) => {
    const member = members.find((m) => m.user.id === id);
    if (!member) throw new Error(`No member with id ${id}`);
    return member;
  };

  const { data: voteEvents } = api.discord.role.getVotes.useQuery(undefined, {
    select(data) {
      return data.map((event) => ({
        ...event,
        target: memberFromId(event.target),
        votes: event.votes.map((v) => ({
          ...v,
          voter: memberFromId(v.voter),
        })),
      }));
    },
  });

  const roles = Object.keys(
    abdullezizRoles
  ) as (keyof typeof abdullezizRoles)[];
  const workerImage = worker && getAvatarUrl(worker.user, worker?.avatar);

  return isLoading || !voteEvents ? (
    <LoadingDashboard />
  ) : (
    <Layout title={`Manage ${worker?.nick || "Worker"} - Abdulleziz Corp.`}>
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
              <h1 className="ml-8 text-3xl">{worker?.nick}</h1>
              {worker?.roles.map((role) => (
                <h1
                  className="ml-8"
                  key={role.id}
                  style={{ color: `#${role.color.toString(16)}` }}
                >
                  {role.name}
                </h1>
              ))}
            </div>
          </div>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-4 rounded-lg bg-base-100 p-8 shadow"></div>
            <div className="flex flex-col items-start gap-4 rounded-lg bg-base-100 p-8 shadow">
              {roles
                .filter((role) => role !== "CEO")
                .map((role) => {
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
                    <div
                      className="flex items-center justify-center gap-4"
                      key={role}
                    >
                      <h1 className="text-2xl">{role}</h1>
                      <button
                        onClick={() =>
                          vote.mutate({ role, user: worker?.user.id ?? "" })
                        }
                        className={classNames(
                          "btn-xs btn",
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
          </section>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {voteEvents
              .filter((e) => e.target.user.id === worker?.user.id)
              .map((voteEvent, index) => {
                const userSelf = worker?.user.id === self.data?.user.id;
                const userRole = worker?.roles[0]?.name;
                const severity =
                  abdullezizRoleSeverities[voteEvent.role as AbdullezizRole];
                const quit = userRole === voteEvent.role;
                // prettier-ignore
                const userSeverity = userRole ? abdullezizRoleSeverities[userRole]: 1;
                // prettier-ignore
                const promote = severity >= userSeverity && !quit;

                return (
                  <div
                    key={voteEvent.id}
                    className={classNames(
                      "flex flex-col items-center gap-4 rounded-lg bg-base-100 p-8 shadow",
                      {
                        "bg-primary-500": voteEvent.votes
                          .map((v) => v.voter.user.id)
                          .includes(worker?.user.id ?? ""),
                      }
                    )}
                  >
                    <h1 className="text-2xl">
                      Rol Etkinliği {index + 1}: istenen rol: {voteEvent.role}
                      Oy verenler:{" "}
                      {voteEvent.votes
                        .map((v) => v.voter.user.username)
                        .join(", ")}
                      (
                      {!!voteEvent.endedAt
                        ? "Oylama Bitti"
                        : quit
                        ? userSelf
                          ? "Ayrılmak için oy ver"
                          : "Kovmak için oy ver"
                        : promote
                        ? "Yükseltmek için oy ver"
                        : "Düşürmek için oy ver"}
                      )
                    </h1>
                    <button
                      className="btn-primary btn"
                      disabled={!!voteEvent.endedAt}
                      onClick={() =>
                        vote.mutate({
                          role: voteEvent.role,
                          user: worker?.user.id ?? "",
                        })
                      }
                    >
                      Oy ver
                    </button>
                  </div>
                );
              })}
          </section>
        </main>
      </div>
    </Layout>
  );
};
export default Worker;
