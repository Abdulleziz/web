import type { VerifiedAbdullezizRole } from "~/utils/zod-utils";
import classnames from "classnames";
import { useState } from "react";
import { Layout } from "./Layout";
import { Panel, CEOPanel, GlobalEmployeePanel, ServantPanel } from "./Panel";
import { useGetVerifiedAbdullezizRoles } from "~/utils/useDiscord";
import { useSession } from "next-auth/react";

type AbdullezizRecord<T> = Record<VerifiedAbdullezizRole, T>;

export const Dashboard: React.FC = () => {
  const { data: session } = useSession();
  const roles = useGetVerifiedAbdullezizRoles();
  const [activeTab, setActiveTab] =
    useState<VerifiedAbdullezizRole>("@everyone");

  const panels: AbdullezizRecord<JSX.Element> = {
    CEO: <CEOPanel />,
    CTO: <Panel>CTO</Panel>,
    CIO: <Panel>CIO</Panel>,
    "Product Manager": <Panel>Product Manager</Panel>,
    "Advertisement Lead": <Panel>Advertisement Lead</Panel>,
    "QA Lead": <Panel>QA Lead</Panel>,
    HR: <Panel>HR</Panel>,
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
    Intern: "Intern Paneli",
    Servant: "Çaycı Paneli",
    "@everyone": "Abdulleziz Employee Paneli",
  } as const;

  const visiblePanels = roles.data?.map((role) => role.name) ?? [];
  if (session?.user?.inAbdullezizServer) visiblePanels.push("@everyone");

  return (
    <Layout>
      <div className="flex max-w-screen-2xl items-center justify-center">
        <div className="tabs">
          {roles.isLoading && <div className="btn loading">Loading...</div>}
          {visiblePanels.map((panel) => (
            <a
              key={panel}
              onClick={() => setActiveTab(panel)}
              className={classnames("tab-bordered tab", {
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
