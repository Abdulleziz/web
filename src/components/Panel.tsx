import Link from "next/link";
import type { CSSProperties } from "react";
import type { AbdullezizPerm } from "~/utils/abdulleziz";
import { useGetAbdullezizUser } from "~/utils/useDiscord";

type PanelProps = { children?: React.ReactNode };
export const Panel: React.FC<PanelProps> = ({ children }) => {
  return <div className="card bg-base-100 p-8">{children}</div>;
};

export const GlobalPanel: React.FC = () => {
  return (
    <Panel>
      <div className="menu flex items-center gap-4">
        <div className="menu-title">Kullanıcı İşlemleri</div>
        <Link className="menu-item" href="/forum">
          Foruma git
        </Link>
        <Link className="menu-item" href="/cron">
          Hatırlatıcıya git
        </Link>
      </div>
    </Panel>
  );
};

export const MemberPanel: React.FC = () => {
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
};

export const AdminPanel: React.FC = () => {
  const visibleBy: AbdullezizPerm[] = [
    "çalışanları yönet",
    "forumu yönet",
    "forum thread pinle",
  ];
  const { data, isLoading } = useGetAbdullezizUser();

  if (isLoading) return <button className="loading btn">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;
  if (!data.perms.some((perm) => visibleBy.includes(perm))) return null;

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
};

export const DriveablePabel: React.FC = () => {
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
};

export const ServantPanel: React.FC = () => {
  const { data, isLoading } = useGetAbdullezizUser();
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
          <span className="text-primary">Kalan çay</span>
          <div
            className="radial-progress m-1 text-xs text-primary"
            style={
              { "--value": 70, "--size": "2rem", "--thickness": "2px" } as CSSProperties
            }
          >
            70
          </div>
        </div>
        <div className="menu-item">
          <button className="btn-sm btn">
            {canServe ? "Çay koy" : "Çay söylet"}
          </button>
        </div>
        <div className="menu-item">
          <button className="btn-sm btn gap-2" disabled={!canBuy}>
            Çay satın al
          </button>
        </div>
        {!canServe && (
          <div className="menu-item">
            <button className="btn-warning btn-sm btn" disabled={!canShout}>
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
};

const DemoCounter: React.FC = () => {
  const nextDay = new Date();
  return (
    <div className="grid auto-cols-max grid-flow-col gap-5 text-center">
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": 10 } as CSSProperties}></span>
        </span>
        saat
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": 24 } as CSSProperties}></span>
        </span>
        dakika
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": 47 } as CSSProperties}></span>
        </span>
        saniye
      </div>
    </div>
  );
};
