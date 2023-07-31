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
import Image from "next/image";
import { type CSSProperties, useEffect, useState, useCallback } from "react";

import {
  useGetAbdullezizUser,
  useGetAbdullezizUsers,
  useGetCEOVoteEvent,
  useGetDiscordMembers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import classNames from "classnames";
import { toast } from "react-hot-toast";
import { useBuyEntities, useNextSalaryDate } from "~/utils/usePayments";
import { createPanel } from "./utils";
import { useConsumeTea, useGetRemainingTea } from "~/utils/useConsumable";

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
  const canRequestBonus = data.perms.includes("bonus iste");
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
          <button className="btn-sm btn" disabled={!canRequestBonus}>
            Bonus iste
            {/* CEO uyarıp fazladan maaş iste */}
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

export const AdminPanel = createPanel(undefined, () => {
  const { data, isLoading } = useGetAbdullezizUser();

  if (isLoading) return <button className="loading btn">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;

  const manageForum = data.perms.includes("forumu yönet");
  const manageForumPins = data.perms.includes("forum thread pinle");

  return (
    <Panel>
      <div className="menu flex items-center gap-4">
        <div className="menu-title">Yönetici İşlemleri</div>
        <div className="menu-item">
          <Link href="/manage">
            <button className="btn-sm btn">Çalışanları Yönet!</button>
          </Link>
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
});

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

  const remainingTea = useGetRemainingTea();
  const consumeTea = useConsumeTea();
  const buyEntities = useBuyEntities();

  if (isLoading) return <button className="loading btn">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;

  const canBuy = data.perms.includes("çay satın al");
  const canServe = data.perms.includes("çay koy");
  const canShout = data.perms.includes("çaycıya kız");
  const ummmmm = data.perms.includes("*i*n-t*i.h?a_r ½e(t=");

  return (
    <Panel>
      <div className="menu flex items-center gap-4">
        <div className="menu-title">Çay Paneli</div>
        <div className="menu-item">
          <span className="font-mono text-primary">Kalan çay</span>
          <span className="p-2 font-mono font-bold">
            {remainingTea.isLoading ||
            consumeTea.isLoading ||
            !remainingTea.data
              ? "..."
              : remainingTea.data.amountGram}
            gr
          </span>
        </div>
        <div className="menu-item">
          <button
            className="btn-sm btn"
            disabled={!remainingTea.data?.amountGram || consumeTea.isLoading}
            onClick={() => consumeTea.mutate()}
          >
            {canServe ? "Çay koy" : "Çay söylet"}
          </button>
        </div>
        <div className="menu-item">
          <button
            className={classNames("btn-sm btn gap-2", {
              ["btn-warning"]: !remainingTea.data?.amountGram,
              ["loading"]: buyEntities.isLoading,
            })}
            disabled={!canBuy || buyEntities.isLoading}
            onClick={() => {
              // TODO: ilerde bu button direkt mağazaya götürsün...
              toast.loading("Çay satın alınıyor", { id: "buyTea" });
              buyEntities.mutate(
                [
                  { entityId: 1, amount: 1 }, // 1kg
                  { entityId: 2, amount: 5 }, // 200gr * 5 = 1kg
                  // toplam 2kg çay 🤣🍔😭😎
                ],
                {
                  onSuccess: () => {
                    toast.success(
                      "Çay satın alındı (1kg + 5x200gr) (400 serving)",
                      { id: "buyTea" }
                    );
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
  const vote = useGetCEOVoteEvent();

  const members = (getDcMembers.data ?? []).filter((m) => !m.user.bot); // filter out bots

  const ChartOptions: ChartOptions<"radar"> = {
    scales: {
      r: { ticks: { display: false, count: 6 }, grid: { color: "white" } },
    },
  };

  const chartData: ChartData<"radar"> = {
    labels: members.map((m) => m.nick || m.user.username),
    datasets: [
      {
        label: "Oy sayısı",
        data: members.map(
          (m) =>
            vote.data?.votes.filter((v) => v.target === m.user.id).length ?? 0
        ),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="flex items-center justify-center rounded-md border-2 border-dashed border-gray-200 bg-base-300 px-4 py-4 text-3xl font-semibold text-gray-400">
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
            const style = member.roles[0]
              ? {
                  color: `#${member.roles[0].color.toString(16)}`,
                }
              : { color: "white" };

            return (
              <li
                key={member.user.id}
                className="flex flex-col items-center justify-center text-center"
              >
                <div className="avatar-group">
                  {avatar && (
                    <Image
                      className="avatar w-12"
                      src={avatar}
                      alt="Profile photo"
                      width={128}
                      height={128}
                    />
                  )}
                </div>
                {<p style={style}>{member.nick}</p>}
                <p className="text-gray-400">
                  {member.user.username}#{member.user.discriminator}
                </p>

                {member.roles[0] ? (
                  <p style={style}>({member.roles[0].name})</p>
                ) : (
                  "(Unemployeed 🤣)"
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
});

export { HistoryPanel } from "./HistoryPanel";
