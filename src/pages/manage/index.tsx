import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { Layout } from "~/components/Layout";
import {
  useGetAbdullezizUsers,
  useGetAbdullezizUsersSorted,
  useGetVoteEventsWithMembers,
  useVote,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { LoadingDashboard } from "~/components/LoadingDashboard";
import { formatName } from "~/utils/abdulleziz";
import { createModal } from "~/utils/modal";
import { useState } from "react";

const Manage: NextPage = () => {
  const { isLoading } = useGetAbdullezizUsers();

  return isLoading ? (
    <LoadingDashboard />
  ) : (
    <Layout>
      <div className="flex min-h-screen flex-row items-center justify-center pb-32">
        <Members />
      </div>
    </Layout>
  );
};

export const Members: React.FC = () => {
  const { data, isLoading } = useGetAbdullezizUsersSorted();
  const members = data ?? [];
  const vote = useVote();
  const events = useGetVoteEventsWithMembers();

  return isLoading || events.isLoading ? (
    <LoadingDashboard />
  ) : (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="rounded-lg bg-base-200 shadow">
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
                      <p style={style}>{member.nick}</p>
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
      </div>
      {events && (
        <div className="rounded bg-base-200 sm:col-span-1">
          <div className="flex flex-col items-center  border-b border-base-200 px-6 py-5 font-semibold">
            <h1 className="mb-3">Oylama Etkinliği Mevcut!</h1>
            <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-1 ">
              {events.data?.map((event) => {
                const boxStyle = event.target.roles[0]
                  ? `[#${event.target.roles[0].color.toString(16)}]`
                  : "base-100";
                return (
                  <div
                    key={event.id}
                    className={`flex flex-col rounded bg-${boxStyle}`}
                  >
                    <ul className="flex list-disc flex-col p-2">
                      <li>Oylanan Kullanıcı: {formatName(event.target)}</li>
                      <li>Yeni Rol: {event.role}</li>
                      <li>Toplam Oy: {event.votes.length}</li>
                    </ul>
                    <button
                      className="btn-xs btn mx-2 mb-2"
                      onClick={() => {
                        vote.mutate({
                          role: event.role,
                          user: event.target.user.id ?? "",
                        });
                      }}
                    >
                      Oy Ver!
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manage;
