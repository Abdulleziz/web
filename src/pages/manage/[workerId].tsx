import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Layout } from "~/components/Layout";
import { useGetProfile } from "~/utils/useProfile";
import { UserId } from "~/utils/zod-utils";
import Image from "next/image";
import { LoadingDashboard } from "~/components/LoadingDashboard";
import classNames from "classnames";
import { Profile } from "~/components/Profile";

const Worker: NextPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center pb-32">
      <div className="flex w-full flex-1 flex-col">
        <ManageWorker />
      </div>
    </div>
  );
};

const ManageWorker: React.FC = () => {
  const router = useRouter();

  const parseProfileId = UserId.parse(router.query.workerId);

  const { data: worker, isLoading } = useGetProfile(parseProfileId);

  return isLoading ? (
    <LoadingDashboard />
  ) : (
    <Layout title="Manage Worker - Abdulleziz Corp.">
      <div className="flex-grow">
        <main className="space-y-6 p-6 sm:p-10">
          <div className="flex flex-row items-center ">
            {worker?.image && (
              <Image
                className="rounded-full"
                src={worker.image}
                width={128}
                height={128}
                alt="Profile Image"
              />
            )}
            <div className="flex flex-col">
              <h1 className="ml-8 text-3xl">{worker?.name}</h1>
              {worker?.member.roles.map((role) => (
                <h1
                  className="ml-8"
                  key={role.id}
                  style={{ color: `#${role.color.toString(16)}` }}
                >
                  {role.name}
                </h1>
              ))}
            </div>
          </div>
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-4 rounded-lg bg-base-100 p-8 shadow"></div>
            <div className="flex flex-col items-center gap-4 rounded-lg bg-base-100 p-8 shadow">
              <button className="btn-success btn">Promote</button>
              <button className="btn-error btn">Demote</button>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
};
export default Worker;
