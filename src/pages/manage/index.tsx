import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { Layout } from "~/components/Layout";
import {
  useGetAbdullezizUsersSorted,
  useGetVoteEventsWithMembers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { LoadingDashboard } from "~/components/LoadingDashboard";
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
import ManageVoteEvents from "~/components/tables/ManageVoteEvents";

export function colorMapping(targetColor: string) {
  const color = targetColor.startsWith("#")
    ? targetColor.substring(1, 7)
    : targetColor;
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
  const { data: events, isLoading: eventsLoading } =
    useGetVoteEventsWithMembers();

  if (isLoading || eventsLoading) {
    return <LoadingDashboard />;
  }

  return (
    <Layout>
      <div className="inline-block w-full items-center justify-center gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Card className="rounded-lg shadow">
            <CardHeader>
              <CardTitle>Abdulleziz Çalışanları</CardTitle>
              <CardDescription>
                Yönetmek İstediğiniz Çalışanı Seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <ul className="grid gap-3 space-y-6 p-4 md:grid-cols-2 xl:grid-cols-3">
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
                          className="flex flex-col items-center p-3"
                        >
                          <div className="avatar-group">
                            {avatar && (
                              <Image
                                className="avatar w-8 md:w-14"
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
          {!!events && (
            <Card className="rounded sm:col-span-1">
              <CardHeader>
                <CardTitle>Oylama Etkinlikleri!</CardTitle>
              </CardHeader>
              <CardContent className="flex max-h-screen flex-col items-center px-6 py-5 font-semibold">
                <ManageVoteEvents />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export const getSeverity = (role?: AbdullezizRole) =>
  role ? abdullezizRoleSeverities[role] : 1;

export const getRequiredSeverity = (event: VoteEventWithMember) => {
  const done = !!event.endedAt;
  const userSeverity = getSeverity(
    done ? event.beforeRole?.name : event.target.roles[0]?.name
  );
  const quit = done
    ? event.beforeRole?.name
    : event.target.roles[0]?.name === event.role.name;
  const severity = getSeverity(event.role.name);
  const promote = severity >= userSeverity && !quit;
  return promote ? PROMOTE * severity : DEMOTE * userSeverity;
};

export default Manage;
