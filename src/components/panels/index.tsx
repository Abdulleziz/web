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
  useGetDiscordMembers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import classNames from "classnames";
import { toast } from "react-hot-toast";
import { useBuyEntities, useNextSalaryDate } from "~/utils/usePayments";
import { createPanel } from "./utils";
import { createModal } from "~/utils/modal";
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

    const { Modal, ModalTrigger } = createModal(
      "manage-members",
      "Çalışanları yönet"
    );

    const o7 =
      "https://github.com/Abdulleziz/web/tree/main/src/components/panels/index.tsx#119";

    return (
      <Panel>
        {/* <Modal>
          <h3 className="text-lg font-bold">
            Çalışanları Yönet{" "}
            <span className="badge-secondary badge badge-lg">Beta</span>{" "}
            <span className="badge badge-lg">Work In Progress</span>
          </h3>
          <div className="py-4">
            <div className="font-bold text-primary">
              Bu paneli tamamlamak için yardım lazım. <br />
              Fikirleriniz çok önemli. <br />
              <a href={o7} className="link text-secondary">
                Github: src/components/panels/index.tsx
              </a>
            </div>
            <ul className="gap-2 p-4">
              <p className="p-2 text-xl font-bold">Yapılacaklar...</p>
              <li className="list-disc">
                Kullanıcıları yönet (Rolleri vb...) <br />
                <span className={manageUsers ? "text-success" : "text-error"}>
                  (you are {!manageUsers && "not "}
                  eligible)
                </span>
                <br />
                #1: Kovmak için birden fazla kurul üyesi oy vermeli <br />
                #2: Intern{"'"}lere Pozisyon vermek <br />
                #3: Rol düşürmek/yükseltmek <br />
                #4: Hayko Cepkin{"'"}e laf etmek ban sebebi <br />
              </li>
              <li className="list-disc">
                Manuel/Ekstra Maaş dağıt (kullanım alanları: özel günlerde){" "}
                <br />
                <span className={manageUsers ? "text-success" : "text-error"}>
                  (you are {!manageUsers && "not "}
                  eligible)
                </span>
              </li>
              <li className="list-disc">
                Daha aklıma gelmedi, fikirleriniz varsa{" "}
                <a href={o7} className="link-primary link">
                  buraya
                </a>{" "}
                ekleyin <br />
                <span className="text-success">(you are eligible 🤣)</span>
              </li>
            </ul>
          </div>
        </Modal> */}
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

  const members = (getDcMembers.data ?? []).filter((m) => !m.user.bot); // filter out bots

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
