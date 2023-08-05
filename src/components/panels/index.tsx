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
  useGetAbdullezizUsersSorted,
  useGetCEOVoteEvent,
  useGetCEOVoteEventWithMembers,
  useGetDiscordMembers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import classNames from "classnames";
import { toast } from "react-hot-toast";
import { useBuyEntities, useNextSalaryDate } from "~/utils/usePayments";
import { useConsumeTea, useGetRemainingTea } from "~/utils/useConsumable";
import { createPanel } from "./utils";
import { formatName } from "~/utils/abdulleziz";

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
  const voteCEO = useGetCEOVoteEvent();
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
          <Link href="/manage">
            <button
              className={classNames("btn-sm btn", {
                ["loading"]: voteCEO.isLoading,
              })}
              disabled={voteCEO.isLoading || (!voteCEO.data && !canVote)}
            >
              {voteCEO.data ? "Oylamaya katıl" : "Oylama başlat"}
            </button>
          </Link>
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

export const CEOVotePanel = createPanel(
  undefined,
  () => {
    const { data, isLoading } = useGetCEOVoteEventWithMembers();

    if (isLoading)
      return (
        <button className="loading btn">CEO oylamasına bakılıyor...</button>
      );
    if (!data) return null;

    return (
      // should be black theme
      <div className="menu flex items-center overflow-x-auto overflow-y-auto rounded-lg bg-black p-4 text-zinc-400 lg:w-max">
        <div className="menu-title">CEO Oylaması</div>
        <div className="menu-item flex">
          <div className="menu-item flex flex-col items-center p-2">
            <span className="font-mono text-primary">Oy sayısı</span>
            <span className="px-2 font-mono font-bold">
              {data.votes.length} oy ({data.required} olan kazanır)
            </span>
          </div>
          {data.estimated && (
            <div className="menu-item flex flex-col items-center p-2">
              <span className="font-mono text-primary">Tahmini bitiş</span>
              <span className="px-2 font-mono font-bold">
                {data.estimated.toLocaleString("tr-TR")}
              </span>
            </div>
          )}
          {data.endedAt && (
            <div className="menu-item flex flex-col items-center p-2">
              <span className="font-mono text-primary">Bitti</span>
              <span className="px-2 font-mono font-bold">
                Oylama {data.endedAt.toLocaleString("tr-TR")} tarihinde bitti.
              </span>
              {data.sitUntil && (
                <span className="px-2 font-mono font-bold">
                  CEO {data.sitUntil.toLocaleString("tr-TR")}
                  {"'e"} kadar koltuktan kaldırılamaz.
                </span>
              )}
            </div>
          )}
        </div>
        <div className="menu-item flex flex-col items-center whitespace-nowrap">
          <span className="font-mono text-primary">Oy verenler</span>
          {data.votes.map((v) => (
            <span key={v.id} className="px-2 font-mono font-bold">
              {`${formatName(v.voter)} -> ${formatName(v.target)}`}
            </span>
          ))}
        </div>
      </div>
    );
  },
  { notAChild: true }
);

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
    labels: members.map(formatName),
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
  const getMembers = useGetAbdullezizUsersSorted();
  const members = getMembers.data ?? [];

  return (
    <div className="row-span-3 rounded-lg bg-base-100 shadow">
      <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
        <span>Abdulleziz Çalışanları</span>
      </div>
      <div className="overflow-y-auto">
        <ul className="space-y-6 p-6">
          {members.map((member) => {
            const highestRole = member.roles[0];
            const avatar = getAvatarUrl(member.user, member.avatar);
            const style = highestRole
              ? { color: `#${highestRole.color.toString(16).padStart(6, "0")}` }
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
                <p style={style}>{member.nick}</p>
                <p className="text-gray-400">{member.user.username}</p>

                {highestRole ? (
                  <p style={style}>({highestRole.name})</p>
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
