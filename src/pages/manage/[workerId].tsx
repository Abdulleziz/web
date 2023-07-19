import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Layout } from "~/components/Layout";
import { useGetProfile } from "~/utils/useProfile";
import { UserId } from "~/utils/zod-utils";

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

  const parseProfileId = UserId.safeParse(router.query.workerId);
  //? eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  //! deli amk kendi kendine kızıyo. eğer data yok ise nasıl çalıştırıcam bilmiyorum ama çalışıyo şuan. :D
  //TODO: const worker = useGetProfile(parseProfileId.data).data;
  if (!parseProfileId.success) {
    return (
      <Layout>
        {/* TODO: custom 404page */}
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p>Kullanıcı bulunamadı</p>
          <div
            className="btn-primary btn"
            onClick={() => void router.push("/")}
          >
            Geri Dön
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Worker - Abdulleziz Corp.">
      <div className="flex-grow">
        <main className="space-y-6 p-6 sm:p-10">
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center rounded-lg bg-base-100 p-8 shadow"></div>
          </section>
        </main>
      </div>
    </Layout>
  );
};

export default Worker;
