import { Layout } from "./Layout";
import {
  GlobalPanel,
  ServantPanel,
  AdminPanel,
  DriveablePabel,
  MemberPanel,
} from "./Panel";
import { useGetAbdullezizUser } from "~/utils/useDiscord";

export const Dashboard: React.FC = () => {
  const { isLoading, data } = useGetAbdullezizUser();
  const panels =
    !isLoading && !!data
      ? [AdminPanel, ServantPanel, DriveablePabel, MemberPanel, GlobalPanel]
      : [GlobalPanel];

  return (
    <Layout>
      <div className="flex min-h-screen flex-wrap items-center justify-center gap-4">
        {isLoading && <button className="loading btn">Yükleniyor</button>}
        {!isLoading && !data && <button className="btn">Error</button>}
        {panels.map((Panel, i) => (
          <div className="max-w-sm">
            <Panel key={i} />
          </div>
        ))}
      </div>
    </Layout>
  );
};
