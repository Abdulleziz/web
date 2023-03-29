import { Layout } from "./Layout";
import {
  GlobalPanel,
  ServantPanel,
  AdminPanel,
  DriveablePabel,
  MemberPanel,
} from "./Panel";
import { useGetAbdullezizUser, useGetDiscordMembers } from "~/utils/useDiscord";
import { useSession } from "next-auth/react";
import { getAvatarUrl } from "~/server/discord-api/utils";

export const Dashboard: React.FC = () => {
  const { data: session } = useSession();
  const { isLoading, data } = useGetAbdullezizUser();
  const getDcMembers = useGetDiscordMembers();

  const members = (getDcMembers.data ?? [])
    .map((m) => ({ ...m, user: m.user! })) // assert user is defined
    .filter((m) => !m.user.bot); // filter out bots

  const panels =
    !isLoading && !!data
      ? [
          AdminPanel,
          ServantPanel,
          DriveablePabel,
          MemberPanel,
          GlobalPanel,
        ].filter(
          // if any of the visibleBy permissions are not in the user's perms,
          // don't show the panel
          (p) =>
            p.visibleBy?.some((perm) => data.perms.includes(perm)) ||
            p.visibleBy === undefined
        )
      : [GlobalPanel];

  return (
    <>
      <Layout>
        <div className="flex-grow">
          <main className="space-y-6 p-6 sm:p-10">
            <div className="flex flex-col justify-between space-y-6 md:flex-row md:space-y-0">
              <div className="mr-6">
                <h1 className="mb-2 text-4xl font-semibold text-white">
                  Welcome {session?.user.name}
                </h1>
              </div>
            </div>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <div className="flex items-center rounded-lg bg-base-100 p-8 shadow">
                <div className="mr-6 inline-flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-base-300 text-purple-600">
                  <svg
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="block text-2xl font-bold">
                    {members.length}
                  </span>
                  <span className="block text-gray-500">Workers</span>
                </div>
              </div>
              {panels.map((Panel, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-lg bg-base-100 p-4"
                >
                  <Panel />
                </div>
              ))}
            </section>
            <section className="grid gap-6 md:grid-cols-2 xl:grid-flow-col xl:grid-cols-4 xl:grid-rows-3">
              <div className="row-span-3 rounded-lg bg-base-100 shadow">
                <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
                  <span>Abdulleziz Members</span>
                </div>
                <div className="overflow-y-auto">
                  <ul className="space-y-6 p-6">
                    {members.map((member) => {
                      const avatar = getAvatarUrl(member.user, member.avatar);
                      return (
                        <li key={member.user.id} className="flex items-center">
                          <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
                            {avatar && <img src={avatar} alt="Profile photo" />}
                          </div>
                          <span className="text-white">{member.nick}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col rounded-lg bg-base-100 shadow md:col-span-2 md:row-span-2">
                <div className="border-b border-gray-100 px-6 py-5 font-semibold">
                  Work in Progress
                </div>
                <div className="flex-grow p-4">
                  <div className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-gray-200 bg-base-300 px-4 py-16 text-3xl font-semibold text-gray-400">
                    Chart
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </Layout>
    </>
  );
};
