import { Navbar } from "./Navbar";
import { useState } from "react";
import classnames from "classnames";

export const Dashboard: React.FC = () => {
  // paneller nası olmalı

  // CEO Paneli
  // -> diğerleri??
  // Abdulleziz Employee Paneli
  const [activeTab, setActiveTab] = useState<"CEO" | "Default">("Default");

  const panels = {
    CEO: <CEOPanel />,
    Default: <GlobalEmployeePanel />,
  } as const;

  const panelNames: Record<typeof activeTab, string> = {
    CEO: "CEO Paneli",
    Default: "Abdulleziz Employee Paneli",
  } as const;

  return (
    <>
      <Navbar />
      <div className="flex max-w-screen-2xl items-center justify-center">
        <div className="tabs">
          {Object.keys(panels).map((panel) => (
            <a
              onClick={() => setActiveTab(panel as typeof activeTab)}
              className={classnames("tab-bordered tab", {
                "tab-active": activeTab === panel,
              })}
            >
              {panelNames[panel as typeof activeTab]}
            </a>
          ))}
        </div>
      </div>
      <div className="flex max-w-screen-2xl items-center justify-center">
        {panels[activeTab]}
      </div>
    </>
  );
};

const CEOPanel: React.FC = () => {
  return (
    <div className="p-16">
      <div className="menu">
        <div className="menu-title">İşlemler</div>
        <div className="menu-item">Duyuru yayınla</div>
        <div className="menu-item">Çalışanları yönet</div>
        <div className="menu-item">Megan ekle</div>
      </div>
    </div>
  );
};

const GlobalEmployeePanel: React.FC = () => {
  return (
    <div className="p-16">
      <div className="menu">
        <div className="menu-title">İşlemler</div>
        <div className="menu-item">Foruma git</div>
        <div className="menu-item">Çay söylet</div>
      </div>
    </div>
  );
};
