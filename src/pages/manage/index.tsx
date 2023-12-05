import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { Layout } from "~/components/Layout";
import {
  useGetAbdullezizUser,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { AbdullezizUser } from "~/components/AbdullezizUser";
import { Button } from "~/components/ui/button";
import ManageVoteEvents from "~/components/tables/ManageVoteEvents";

export function colorMapping(targetColor: string) {
  const color =
    targetColor.charAt(0) === "#" ? targetColor.substring(1, 7) : targetColor;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  const uicolors = [r / 255, g / 255, b / 255] as const;
  const c = uicolors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92;
    }
    return Math.pow((col + 0.055) / 1.055, 2.4);
  }) as unknown as typeof uicolors;
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return L > 0.179 ? "light" : "dark";
}

export type VoteEventWithMember = NonNullable<
  ReturnType<typeof useGetVoteEventsWithMembers>["data"]
>[number];

const Manage: NextPage = () => {
  const { data, isLoading } = useGetAbdullezizUsersSorted();
  const members = data ?? [];
  const events = useGetVoteEventsWithMembers();

  if (isLoading) {
    return <LoadingDashboard />;
  }

  return (
    <Layout>
      <div className="flex min-h-screen flex-row items-center justify-center pb-32">
        <div className="flex flex-col gap-6 sm:flex-row">
          <Card className="rounded-lg shadow">
            <CardHeader>
              <CardTitle>Abdulleziz Çalışanları</CardTitle>
              <CardDescription>
                Yönetmek İstediğiniz Çalışanı Seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <ul className="grid gap-5 space-y-6 p-6 md:grid-cols-2 xl:grid-cols-3">
                {members.map((member) => {
                  const highestRole = member.roles[0];
                  const avatar = getAvatarUrl(member.user, member.avatar);
                  const color =
                    "#" +
                    (highestRole
                      ? highestRole.color.toString(16).padStart(6, "0")
                      : "ffffff");

                  const style = {
                    color: color === "#000001" ? "#fafafa" : color,
                  };
                  return (
                    <Card
                      key={member.user.id}
                      className="mt-auto cursor-pointer rounded bg-slate-300 transition-all hover:scale-110 hover:bg-info-content dark:bg-zinc-950"
                    >
                      {member.user.id && (
                        <Link
                          href={`manage/${member.user.id}`}
                          className="mb-5 ml-5 mr-5 mt-5 flex flex-col items-center"
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
                          <p className="text-gray-400">
                            {member.user.username}
                          </p>

                          {highestRole ? (
                            <p style={style}>({highestRole.name})</p>
                          ) : (
                            "(Unemployeed 🤣)"
                          )}
                        </Link>
                      )}
                    </Card>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
          {!!events.data && (
            <Card className="rounded sm:col-span-1">
              <CardHeader>
                <CardTitle>Oylama Etkinliği Mevcut!</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center px-6 py-5 font-semibold">
                <ManageVoteEvents />
              </CardContent>
            </Card>
          )}
        </div>
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

  function getVoteMessage() {
    if (event.endedAt) {
      return `Oylama ${event.endedAt.toLocaleString("tr-TR")} tarihinde bitti`;
    }

    if (quit) {
      if (userSelf) {
        return "Ayrıl";
      }

      if (instant) {
        return "Kovmak için son oyu ver!";
      }

      return `Kovma oyu ver (+${selfSeverity})YD`;
    }

    if (promote) {
      if (instant) {
        return "Yükseltmek için son oyu ver!";
      }

      return `Yükseltme oyu ver (+${selfSeverity})YD`;
    }

    if (instant) {
      return "Düşürmek için son oyu ver!";
    }

    return `Düşürme oyu ver (+${selfSeverity})YD`;
  }

  return (
    <div className={`flex flex-col rounded`}>
      <ul className="flex flex-col items-center justify-center p-2">
        <li>
          {event.target.exist && event.target.id ? (
            <AbdullezizUser
              size={"lg-long"}
              variant={"ghost"}
              data={{
                id: event.target.id,
                name: formatName(event.target),
                image: getAvatarUrl(event.target.user, event.target.avatar),
              }}
              fallback=""
            />
          ) : (
            <div>
              <span>{"KAYITSIZ: "}</span>
              <span>{event.target.user.username}</span>
            </div>
          )}
        </li>
        <li style={style}>
          {!quit ? (
            <span>
              {event.beforeRole?.name ?? "Unemployee"} {"->"} {event.role.name}
            </span>
          ) : (
            <span>{event.role.name} istifa</span>
          )}
        </li>
        <li>
          <div className="flex gap-2">
            {event.votes.length} oy
            <UsersModal id={event.id} votes={event.votes} />{" "}
            <label htmlFor={event.id} className=" btn btn-xs">
              (oylar)
            </label>
          </div>
        </li>
        <li>
          <span className="text-2xl font-bold">{collected}</span>/
          <span>{required}</span>
        </li>
      </ul>
      <Button
        disabled={!!event.endedAt}
        variant={
          event.endedAt
            ? "ghost"
            : quit
            ? "destructive"
            : instant
            ? "default"
            : "secondary"
        }
        onClick={() => {
          vote.mutate({
            role: event.role.name,
            user: event.target.user.id ?? "",
          });
        }}
      >
        {getVoteMessage()}
      </Button>
      {/* line divider */}
      <div className="divider m-0" />
    </div>
  );
};

export default Manage;
