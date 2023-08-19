import { type FC } from "react";
import { Layout } from "./Layout";
import { Card } from "./ui/card";

export const LoadingDashboard: FC = () => {
  return (
    <Layout>
      <div className="flex-grow">
        <main className="space-y-6 p-6 sm:p-10">
          <section className="grid animate-pulse gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card className="flex items-center rounded-lg p-4 shadow">
              <div className="p-20"></div>
            </Card>
            <Card className="flex items-center justify-center rounded-lg p-4"></Card>
            <Card className="flex items-center justify-center rounded-lg p-4"></Card>
            <Card className="flex items-center justify-center rounded-lg p-4"></Card>
            <Card className="flex items-center justify-center rounded-lg p-4">
              <div className="p-20"></div>
            </Card>
            <Card className="flex items-center justify-center rounded-lg p-4"></Card>
          </section>
          <section className="grid animate-pulse gap-6 md:grid-cols-2 xl:grid-flow-col xl:grid-cols-4 xl:grid-rows-3">
            <Card className="row-span-2 rounded-lg shadow">
              <div className="py-52"></div>
            </Card>
            <Card className="row-span-2 rounded-lg shadow"></Card>

            <Card className="col-span-2 row-span-2 rounded-lg shadow"></Card>
          </section>
        </main>
      </div>
    </Layout>
  );
};
