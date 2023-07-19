import { type FC } from "react";
import { Layout } from "./Layout";

export const LoadingDashboard: FC = () => {
  return (
    <Layout>
      <div className="flex-grow">
        <main className="space-y-6 p-6 sm:p-10">
          <section className="grid animate-pulse gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center rounded-lg bg-base-100 p-4 shadow">
              <div className="p-20"></div>
            </div>
            <div className="flex items-center justify-center rounded-lg bg-base-100 p-4"></div>
            <div className="flex items-center justify-center rounded-lg bg-base-100 p-4"></div>
            <div className="flex items-center justify-center rounded-lg bg-base-100 p-4"></div>
            <div className="flex items-center justify-center rounded-lg bg-base-100 p-4">
              <div className="p-20"></div>
            </div>
            <div className="flex items-center justify-center rounded-lg bg-base-100 p-4"></div>
          </section>
          <section className="grid animate-pulse gap-6 md:grid-cols-2 xl:grid-flow-col xl:grid-cols-4 xl:grid-rows-3">
            <div className="row-span-2 rounded-lg bg-base-100 shadow">
              <div className="py-52"></div>
            </div>
            <div className="row-span-2 rounded-lg bg-base-100 shadow"></div>

            <div className="col-span-2 row-span-2 rounded-lg bg-base-100 shadow"></div>
          </section>
        </main>
      </div>
    </Layout>
  );
};
