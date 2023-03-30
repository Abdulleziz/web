import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Radar } from "react-chartjs-2";

import Link from "next/link";
import { type CSSProperties, useEffect, useState, useRef } from "react";
import {
  useGetAbdullezizUser,
  useGetAbdullezizUsers,
  useGetDiscordMembers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import type { AbdullezizPerm } from "~/utils/abdulleziz";
import classNames from "classnames";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const createPanel = <T, V extends AbdullezizPerm[] | undefined>(
  visibleBy: V,
  Component: React.FC<T>
) => {
  const PanelComponent = Component as React.FC<T> & { visibleBy: V };
  PanelComponent.visibleBy = visibleBy;
  return PanelComponent;
};

type PanelProps = { children?: React.ReactNode };

export const Panel: React.FC<PanelProps> = ({ children }) => {
  return <div className="">{children}</div>;
};

export const GlobalPanel = createPanel(undefined, () => {
  return (
    <Panel>
      <div className="menu flex items-center gap-4">
        <div className="menu-title">Kullanıcı İşlemleri</div>
        <Link className="menu-item btn-success btn-sm btn" href="/forum">
          Foruma git
        </Link>
        <Link className="menu-item btn-primary btn-sm btn" href="/cron">
          Hatırlatıcıya git
        </Link>
      </div>
    </Panel>
  );
});

export const MemberPanel = createPanel(undefined, () => {
  const { data, isLoading } = useGetAbdullezizUser();
  if (isLoading) return <button className="loading btn">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;
  if (data.roles.length === 0) return null;

  const canVote = data.perms.includes("oylamaya katıl");
  const canRequestRaise = data.perms.includes("zam iste");
  const canTakeSalary = data.perms.includes("maaş al");

  return (
    <Panel>
      <div className="menu flex items-center gap-4">
        <div className="menu-title">Çalışan İşlemleri</div>
        <div className="menu-item">
          <button className="btn-sm btn" disabled={!canVote}>
            Oylamaya katıl
          </button>
        </div>
        <div className="menu-item">
          <button className="btn-sm btn" disabled={!canRequestRaise}>
            Zam iste
          </button>
        </div>
        {canTakeSalary && (
          <div className="menu-item">
            Sonraki Maaş
            <DemoCounter />
          </div>
        )}
      </div>
    </Panel>
  );
});

export const AdminPanel = createPanel(
  ["çalışanları yönet", "forumu yönet", "forum thread pinle"],
  () => {
    const { data, isLoading } = useGetAbdullezizUser();

    if (isLoading) return <button className="loading btn">Yükleniyor</button>;
    if (!data) return <button className="btn">Error</button>;
    // if (!AdminPanel.visibleBy.every((perm) => data.perms.includes(perm)))
    //   return null;

    const manageUsers = data.perms.includes("çalışanları yönet");
    const manageForum = data.perms.includes("forumu yönet");
    const manageForumPins = data.perms.includes("forum thread pinle");

    return (
      <Panel>
        <div className="menu flex items-center gap-4">
          <div className="menu-title">Yönetici İşlemleri</div>
          <div className="menu-item">
            <button className="btn-sm btn" disabled={!manageUsers}>
              Çalışanları yönet
            </button>
          </div>
          <div className="menu-item">
            <Link href="/forum">
              <button
                className="btn-sm btn"
                disabled={!manageForum && !manageForumPins}
              >
                {manageForumPins && !manageForum
                  ? "Thread Pinle"
                  : "Forumu yönet"}
              </button>
            </Link>
          </div>
        </div>
      </Panel>
    );
  }
);

export const DriveablePabel = createPanel(undefined, () => {
  const { data, isLoading } = useGetAbdullezizUser();
  if (isLoading) return <button className="loading btn">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;

  const canDrive = data.perms.includes("araba sür");
  const canManage = data.perms.includes("arabaları yönet");

  return (
    <Panel>
      <div className="menu flex items-center gap-4">
        <div className="menu-title">Araç İşlemleri</div>
        <div className="menu-item">
          <button className="btn-sm btn" disabled={!canDrive}>
            Araba sür
          </button>
        </div>
        <div className="menu-item">
          <button className="btn-sm btn" disabled={!canManage}>
            Arabaları yönet
          </button>
        </div>
      </div>
    </Panel>
  );
});

export const ServantPanel = createPanel(undefined, () => {
  const { data, isLoading } = useGetAbdullezizUser();

  if (isLoading) return <button className="loading btn">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;

  const canBuy = data.perms.includes("çay satın al");
  const canServe = data.perms.includes("çay koy");
  const canShout = data.perms.includes("çaycıya kız");
  const ummmmm = data.perms.includes("*i*n-t*i.h?a_r ½e(t=");

  const remainingTea = useDescendingNumberTest(70);

  return (
    <Panel>
      <div className="menu flex items-center gap-4">
        <div className="menu-title">Çay Paneli</div>
        <div className="menu-item">
          <span className="text-primary">Kalan çay</span>
          <div
            className="radial-progress m-1 text-xs text-primary"
            style={
              {
                "--value": remainingTea,
                "--size": "2rem",
                "--thickness": "2px",
              } as CSSProperties
            }
          >
            {remainingTea}
          </div>
        </div>
        <div className="menu-item">
          <button className="btn-sm btn" disabled={!remainingTea}>
            {canServe ? "Çay koy" : "Çay söylet"}
          </button>
        </div>
        <div className="menu-item">
          <button
            className={classNames("btn-sm btn gap-2", {
              ["btn-warning"]: !remainingTea,
            })}
            disabled={!canBuy}
          >
            Çay satın al
          </button>
        </div>
        {!canServe && (
          <div className="menu-item">
            <button
              className="btn-warning btn-sm btn"
              disabled={!canShout || !remainingTea}
            >
              Çaycıya kız
            </button>
          </div>
        )}
        {ummmmm && (
          <div className="menu-item">
            <button className="btn-error btn-sm btn">İntihar et</button>
          </div>
        )}
      </div>
    </Panel>
  );
});

export const DemoCounter = () => {
  const nextDay = useRef(new Date(Date.now() + 1000 * 60 * 60 * 24).getTime());
  const [remains, setRemains] = useState(
    () => nextDay.current - new Date().getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemains(nextDay.current - new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(remains / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remains % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((remains % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remains % (1000 * 60)) / 1000);

  return (
    <div className="grid auto-cols-max grid-flow-col gap-5 text-center">
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": days } as CSSProperties}></span>
        </span>
        gün
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": hours } as CSSProperties}></span>
        </span>
        saat
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": minutes } as CSSProperties}></span>
        </span>
        dakika
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": seconds } as CSSProperties}></span>
        </span>
        saniye
      </div>
    </div>
  );
};

export const VoteChart = createPanel(undefined, () => {
  const getDcMembers = useGetDiscordMembers();

  const members = (getDcMembers.data ?? [])
    .map((m) => ({ ...m, user: m.user! })) // assert user is defined
    .filter((m) => !m.user.bot); // filter out bots

  const ChartOptions: ChartOptions<"radar"> = {
    scales: {
      r: {
        ticks: {
          display: false,
        },
      },
    },
  };
  const chartData: ChartData<"radar"> = {
    labels: members.map((m) => m.nick || m.user.username),
    datasets: [
      {
        label: "Oy sayısı",
        data: members.map((m) => Math.floor(Math.random() * 10)),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="flex items-center justify-center rounded-md border-2 border-dashed border-gray-200 bg-base-300 px-4 py-16 text-3xl font-semibold text-gray-400">
      <Radar data={chartData} options={ChartOptions} />
    </div>
  );
});

export const HistoryPanel = createPanel([], () => {
  const users = useGetAbdullezizUsers().data ?? [];
  if (!users.length) return null;

  // DEMO, TEST DATA
  const barkin = users.find((u) => u.user.id === "288397394465521664")!;
  const bora = users.find((u) => u.user.id === "222663527784120320")!;
  const bugra = users.find((u) => u.user.id === "282535915203723265")!;
  const kerem = users.find((u) => u.user.id === "852595277037568031")!;

  const historyTESTDATA = [
    ["step-warning", `${barkin.nick} Çaycıya kızdı`, barkin],
    [`step-success`, `${bora.nick} Şirkete Megan Hediye etti!`, bora],
    [`step-primary`, `${bora.nick} Forum'da bir şeyler yazdı`, bora],
    [`step-primary`, `${bora.nick} Forum'da Thread Pinledi`, bora],
    [`step-success`, `${bugra.nick} CEO'luktan Driver'a atandı`, bugra],
    [`step-warning`, `${bora.nick} Çaycıya kızdı`, bora],
    [`step-secondary`, "Kerem oylamaya katıldı", kerem],
    [`step-error`, `${barkin.nick} CEO'yu kovdu`, barkin],
    [`step-error`, `${barkin.nick} CTO'yu kovdu`, barkin],
    [`step-error`, `${barkin.nick} CSO'yu kovdu`, barkin],
    [`step-error`, `${barkin.nick} CMO'yu kovdu`, barkin],
  ] as const;

  return (
    <div className="row-span-3 rounded-lg bg-base-100 shadow">
      <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
        <span>Geçmiş Paneli</span>
      </div>
      <div className="overflow-y-auto">
        <ul className="steps steps-vertical p-6">
          {historyTESTDATA.map((h) => {
            const url = getAvatarUrl(h[2].user, h[2].avatar);
            return (
              <li
                key={h[1]}
                data-content="★"
                className={classNames("step flex items-center space-x-4", h[0])}
              >
                <div className="flex items-center justify-center gap-4">
                  {!!url && (
                    <img className="avatar w-12 rounded-full" src={url} />
                  )}
                  {h[1]}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
});

export const MembersPanel = createPanel(undefined, () => {
  const getDcMembers = useGetAbdullezizUsers();

  const members = (getDcMembers.data ?? [])
    .map((m) => ({
      ...m,
      roles: m.roles.sort((r1, r2) => r2.position - r1.position), // sort roles
    }))
    .filter((m) => !m.user.bot) // filter out bots
    .sort((m1, m2) => {
      // sort members by highest role
      const s1 = m1.roles[0];
      const s2 = m2.roles[0];
      return (s2?.position ?? 0) - (s1?.position ?? 0);
    });

  return (
    <div className="row-span-3 rounded-lg bg-base-100 shadow">
      <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
        <span>Abdulleziz Çalışanları</span>
      </div>
      <div className="overflow-y-auto">
        <ul className="space-y-6 p-6">
          {members.map((member) => {
            const avatar = getAvatarUrl(member.user, member.avatar);
            return (
              <li
                key={member.user.id}
                className="flex flex-col items-center justify-center text-center"
              >
                <div className="avatar-group">
                  {avatar && (
                    <img
                      className="avatar w-12"
                      src={avatar}
                      alt="Profile photo"
                    />
                  )}
                </div>
                {
                  <p
                    style={
                      member.roles.length > 0
                        ? {
                            color: `#${member.roles[0]!.color.toString(16)}`,
                          }
                        : { color: "white" }
                    }
                  >
                    {member.nick}
                  </p>
                }
                <p className="text-gray-400">
                  {member.user.username}#{member.user.discriminator}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
});

export const useDescendingNumberTest = (valueStart: number) => {
  const [value, setValue] = useState(valueStart);
  useEffect(() => {
    const interval = setInterval(() => {
      setValue((v) => (v <= 0 ? 0 : v - 1));
    }, 1000);
    return () => clearInterval(interval);
  });
  return value;
};
