import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { Layout } from "~/components/Layout";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { LoadingDashboard } from "~/components/LoadingDashboard";
import { api } from "~/utils/api";

const Manage: NextPage = () => {
  const { isLoading } = useGetAbdullezizUsers();

  return isLoading ? (
    <LoadingDashboard />
  ) : (
    <Layout>
      <div className="flex min-h-screen flex-col items-center justify-center pb-32">
        <div className="">
          <Members />
        </div>
      </div>
    </Layout>
  );
};

export const Members: React.FC = () => {
  const { data, isLoading } = useGetAbdullezizUsers();

  const members = (data ?? [])
    .filter((m) => !m.user.bot) // filter out bots
    .sort((m1, m2) => {
      // sort members by highest role
      const s1 = m1.roles[0];
      const s2 = m2.roles[0];
      return (s2?.position ?? 0) - (s1?.position ?? 0);
    });

  const memberFromId = (id: string) => {
    const member = members.find((m) => m.user.id === id);
    if (!member) throw new Error(`No member with id ${id}`);
    return member;
  };

  const events = api.discord.role.getVotes.useQuery(undefined, {
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

  return isLoading || events.isLoading ? (
    <LoadingDashboard />
  ) : (
    <div>
      <div className="row-span-3 rounded-lg bg-base-200 shadow ">
        <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
          <span>Abdulleziz Çalışanları</span>
          <span>Yönetmek İstediğiniz Çalışanı Seçin</span>
        </div>
        <div className="overflow-y-auto ">
          <ul className="grid gap-5 space-y-6 p-6 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => {
              const avatar = getAvatarUrl(member.user, member.avatar);
              const style = member.roles[0]
                ? { color: `#${member.roles[0].color.toString(16)}` }
                : { color: "white" };
              return (
                <li
                  key={member.user.id}
                  className="mt-auto cursor-pointer rounded bg-base-100 transition-all hover:scale-110 hover:bg-info-content"
                >
                  {member.user.id && (
                    <Link
                      href={`manage/${member.user.id}`}
                      className="mt-5 mb-5 ml-5 mr-5 flex flex-col items-center"
                    >
                      <div className="avatar-group">
                        {avatar && (
                          <Image
                            className="avatar w-14"
                            src={avatar}
                            alt="Profile photo"
                            width={256}
                            height={256}
                          />
                        )}
                      </div>
                      {<p style={style}>{member.nick}</p>}
                      <p className="text-gray-400">{member.user.username}</p>

                      {member.roles[0] ? (
                        <p style={style}>({member.roles[0].name})</p>
                      ) : (
                        "(Unemployeed 🤣)"
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
            <span>Oylama Etkinlikleri</span>
            <ul>
              {events.data?.map((event) => (
                <li key={event.id}>
                  Rol: {event.role} Oylar:{" "}
                  {event.votes.map((v) => v.voter.user.username).join(", ")}
                  Kullanıcı: {event.target.nick}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manage;
