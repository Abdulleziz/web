import Link from "next/link";
import { CSSProperties, useEffect, useState } from "react";
import type { AbdullezizPerm } from "~/utils/abdulleziz";
import { useGetAbdullezizUser } from "~/utils/useDiscord";

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
});

export const DemoCounter = () => {
  const nextDay = new Date(Date.now() + 1000 * 60 * 60 * 24).getTime();
  const [remains, setRemains] = useState(() => nextDay - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemains(nextDay - new Date().getTime());
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
