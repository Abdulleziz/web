import Link from "next/link";

type PanelProps = { children?: React.ReactNode };
export const Panel: React.FC<PanelProps> = ({ children }) => {
  return <div className="p-16">{children}</div>;
};

export const CEOPanel: React.FC = () => {
  return (
    <Panel>
      <div className="menu">
        <div className="menu-title">İşlemler</div>
        <div className="menu-item">Duyuru yayınla</div>
        <div className="menu-item">Çalışanları yönet</div>
        <div className="menu-item">Megan ekle</div>
      </div>
    </Panel>
  );
};

export const GlobalEmployeePanel: React.FC = () => {
  return (
    <Panel>
      <div className="menu">
        <div className="menu-title">İşlemler</div>
        <Link className="menu-item" href="/forum">
          Foruma git
        </Link>
        <div className="menu-item">Çay söylet</div>
      </div>
    </Panel>
  );
};
export const ServantPanel: React.FC = () => {
  return (
    <Panel>
      <div className="menu">
        <div className="menu-title">İşlemler</div>
        <div className="menu-item">Çay doldur</div>
        <div className="menu-item">Çay tazele</div>
        <div className="menu-item">Çay demle</div>
        <div className="menu-item">İntihar et</div>
      </div>
    </Panel>
  );
};
