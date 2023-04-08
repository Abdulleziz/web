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
import { type CSSProperties, useEffect, useState, useCallback } from "react";
import {
  useGetAbdullezizUser,
  useGetAbdullezizUsers,
  useGetDiscordMembers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import classNames from "classnames";
import { toast } from "react-hot-toast";
import { useBuyEntities, useNextSalaryDate } from "~/utils/usePayments";
import { createPanel } from "./utils";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export type PanelProps = { children?: React.ReactNode };

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
            <SalaryCounter />
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

  const [remainingTea, setRemainingTea] = useDescendingNumberTest(70);

  const buyEntities = useBuyEntities();

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
          <button
            className="btn-sm btn"
            disabled={!remainingTea}
            onClick={() => {
              setRemainingTea(remainingTea >= 10 ? remainingTea - 10 : 0);
              toast.success("Çay koyuldu");
            }}
          >
            {canServe ? "Çay koy" : "Çay söylet"}
          </button>
        </div>
        <div className="menu-item">
          <button
            className={classNames("btn-sm btn gap-2", {
              ["btn-warning"]: !remainingTea,
              ["loading"]: buyEntities.isLoading,
            })}
            disabled={!canBuy}
            onClick={() => {
              // ilerde bu button direkt mağazaya götürsün...
              toast.loading("Çay satın alınıyor", { id: "buyTea" });
              buyEntities.mutate(
                [
                  { entityId: 1, amount: 1 }, // 1kg
                  { entityId: 2, amount: 5 }, // 200gr * 5 = 1kg
                  // toplam 2kg çay 🤣🍔😭😎
                ],
                {
                  onSuccess: () => {
                    setRemainingTea(
                      remainingTea <= 90 ? remainingTea + 10 : 100
                    );
                    toast.success("Çay satın alındı", { id: "buyTea" });
                  },
                  onError: () =>
                    toast.error("Çay satın alınamadı", { id: "buyTea" }),
                }
              );
            }}
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

export const SalaryCounter = () => {
  const nextSalaryDate = useNextSalaryDate();
  const nextDay = nextSalaryDate.data ?? new Date().getTime();
  const [remains, setRemains] = useState(() => nextDay - new Date().getTime());

  const refreshRemains = useCallback(() => {
    setRemains(nextDay - new Date().getTime());
    if (remains <= 0 && !nextSalaryDate.isLoading)
      void nextSalaryDate.refetch();
  }, [nextDay, remains, nextSalaryDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshRemains();
    }, 1000);
    return () => clearInterval(interval);
  }, [nextDay, refreshRemains]);

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
        data: members.map(() => Math.floor(Math.random() * 10)),
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
  return [value, setValue] as const;
};

export { HistoryPanel } from "./HistoryPanel";
