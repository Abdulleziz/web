import type { AbdullezizRole } from "~/utils/zod-utils";
import classnames from "classnames";
import { useState } from "react";
import { Layout } from "./Layout";
import { Panel, CEOPanel, GlobalEmployeePanel, ServantPanel } from "./Panel";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import { useSession } from "next-auth/react";

type AbdullezizRecord<T> = Record<AbdullezizRole | "@everyone", T>;

export const Dashboard: React.FC = () => {
  const user = useGetAbdullezizUser();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<AbdullezizRole | "@everyone">(
    "@everyone"
  );

  const panels: AbdullezizRecord<JSX.Element> = {
    CEO: <CEOPanel />,
    CTO: <Panel>CTO</Panel>,
    CIO: <Panel>CIO</Panel>,
    "Product Manager": <Panel>Product Manager</Panel>,
    "Advertisement Lead": <Panel>Advertisement Lead</Panel>,
    "QA Lead": <Panel>QA Lead</Panel>,
    HR: <Panel>HR</Panel>,
    Driver: <Panel>Driver</Panel>,
    Intern: <Panel>Intern</Panel>,
    Servant: <ServantPanel />,
    "@everyone": <GlobalEmployeePanel />,
  } as const;

  const panelNames: AbdullezizRecord<string> = {
    CEO: "CEO Paneli",
    CTO: "CTO Paneli 😎💻",
    CIO: "CIO Paneli",
    "Product Manager": "Product Manager Paneli",
    "Advertisement Lead": "Advertisement Lead Paneli",
    "QA Lead": "QA Lead Paneli",
    HR: "HR Paneli",
    Driver: "Sürücü Paneli",
    Intern: "Intern Paneli",
    Servant: "Çaycı Paneli",
    "@everyone": "Abdulleziz Employee Paneli",
  } as const;

  const visiblePanels =
    user.data?.roles.map((role) => role.name) ??
    ([] as (AbdullezizRole | "@everyone")[]);
  if (session?.user?.inAbdullezizServer) visiblePanels.push("@everyone");

  return (
    <Layout>
      <div className="flex max-w-screen-2xl items-center justify-center">
        <div className="tabs">
          {user.isLoading && <div className="animate-pulse">Loading...</div>}
          {visiblePanels.map((panel) => (
            <a
              key={panel}
              onClick={() => setActiveTab(panel)}
              className={classnames("tab-bordered tab transition-all", {
                "tab-active": activeTab === panel,
              })}
            >
              {panelNames[panel]}
            </a>
          ))}
        </div>
      </div>
      <div className="flex max-w-screen-2xl items-center justify-center">
        {panels[activeTab]}
      </div>
    </Layout>
  );
};
