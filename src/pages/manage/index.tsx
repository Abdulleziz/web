import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import classNames from "classnames";
import { Layout } from "~/components/Layout";
import {
  useGetAbdullezizUser,
  useGetAbdullezizUsers,
  useGetAbdullezizUsersSorted,
  useGetVoteEventsWithMembers,
  useVote,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { LoadingDashboard } from "~/components/LoadingDashboard";
import { formatName } from "~/utils/abdulleziz";
import {
  type AbdullezizRole,
  DEMOTE,
  PROMOTE,
  abdullezizRoleSeverities,
} from "~/utils/zod-utils";

export type VoteEventWithMember = NonNullable<
  ReturnType<typeof useGetVoteEventsWithMembers>["data"]
>[number];

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

// WTF
const UsersModal = ({
  id,
  votes,
}: {
  id: string;
  votes: VoteEventWithMember["votes"];
}) => {
  return (
    <div>
      <input type="checkbox" id={id} className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold">Oylayanlar</h3>
          <ul className="ml-4">
            {votes.map((v) => (
              <li className="list-disc" key={v.id}>
                {formatName(v.voter)} (+{getSeverity(v.voter.roles[0]?.name)}) (
                {v.createdAt.toLocaleString("tr-TR")})
              </li>
            ))}
          </ul>
          <div className="modal-action">
            <label htmlFor={id} className="btn">
              Kapat
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getSeverity = (role?: AbdullezizRole) =>
  role ? abdullezizRoleSeverities[role] : 1;

type VoteEventProps = {
  event: VoteEventWithMember;
};
export const VoteEvent: React.FC<VoteEventProps> = ({ event }) => {
  const self = useGetAbdullezizUser();
  const vote = useVote();
  const style = { color: `#${event.role.color.toString(16).padStart(6, "0")}` };

  const done = !!event.endedAt;
  const userSelf = event.target.user.id === self.data?.user.id;
  const userRole = done ? event.beforeRole?.name : event.target.roles[0]?.name;
  const selfRole = self.data?.roles[0]?.name;
  const quit = userRole === event.role.name;
  const severity = getSeverity(event.role.name);
  const userSeverity = getSeverity(userRole);
  const selfSeverity = getSeverity(selfRole);
  const promote = severity >= userSeverity && !quit;
  const required = promote ? PROMOTE * severity : DEMOTE * userSeverity;
  const voted = event.votes.some(
    (vote) => vote.voter.user.id === self.data?.user.id
  );
  const collected = event.votes.reduce(
    (acc, vote) => acc + getSeverity(vote.voter.roles[0]?.name),
    0
  );
  const instant =
    (userSelf && quit) || required <= (!voted ? selfSeverity : 0) + collected;

  return (
    <div className={`flex flex-col rounded`} style={style}>
      <ul className="flex list-disc flex-col p-2">
        <li>Oylanan Kullanıcı: {formatName(event.target)}</li>
        <li>
          {!quit ? (
            <span>
              {promote ? "Yükseltmek" : "Düşürmek"}: {event.role.name}
            </span>
          ) : (
            <span>{event.role.name} istifa</span>
          )}
        </li>
        <li>
          <div className="flex gap-2">
            Toplam Oy: {event.votes.length}
            <UsersModal id={event.id} votes={event.votes} />{" "}
            <label htmlFor={event.id} className=" btn-xs btn">
              (oylar)
            </label>
          </div>
        </li>
        <li>Gereken Yetki Değeri: {required}</li>
        <li>Toplanan Yetki Değeri: {collected}</li>
      </ul>
      <button
        disabled={!!event.endedAt}
        className={classNames(
          "btn-xs btn mx-2 mb-2",
          instant && !quit && "btn-success",
          quit && "btn-error"
        )}
        onClick={() => {
          vote.mutate({
            role: event.role.name,
            user: event.target.user.id ?? "",
          });
        }}
      >
        {!!event.endedAt
          ? `Oylama ${event.endedAt.toLocaleString("tr-TR")}  tarihinde bitti`
          : quit
          ? userSelf
            ? "Ayrıl"
            : instant
            ? "Kovmak için son oyu ver!"
            : `Kovma oyu ver (+${selfSeverity})YD`
          : promote
          ? instant
            ? "Yükseltmek için son oyu ver!"
            : `Yükseltme oyu ver (+${selfSeverity})YD`
          : instant
          ? "Düşürmek için son oyu ver!"
          : `Düşürme oyu ver (+${selfSeverity})YD`}
      </button>
    </div>
  );
};

export const Members: React.FC = () => {
  const { data, isLoading } = useGetAbdullezizUsersSorted();
  const members = data ?? [];
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
              const highestRole = member.roles[0];
              const avatar = getAvatarUrl(member.user, member.avatar);
              const style = highestRole
                ? {
                    color: `#${highestRole.color
                      .toString(16)
                      .padStart(6, "0")}`,
                  }
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

                      {highestRole ? (
                        <p style={style}>({highestRole.name})</p>
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
      {!!events.data && (
        <div className="rounded bg-base-200 sm:col-span-1">
          <div className="flex flex-col items-center  border-b border-base-200 px-6 py-5 font-semibold">
            <h1 className="mb-3">Oylama Etkinliği Mevcut!</h1>
            <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-1 ">
              {/* TODO: CEO VOTE HERE */}
              {events.data.map((event) => (
                <VoteEvent key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Manage;
