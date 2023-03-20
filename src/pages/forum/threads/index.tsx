import type { NextPage } from "next";
import Link from "next/link";
import { Layout } from "~/components/Layout";
import { useGetForumThreads } from "~/utils/useForum";

const Threads: NextPage = () => {
  const threads = useGetForumThreads();

  return (
    <Layout theme="dark">
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <h1 className="text-2xl">Threadler</h1>
        {threads.isLoading && <p>Yükleniyor...</p>}
        {threads.isError && <p className="text-error">Hata!</p>}
        {threads.data && (
          <ul>
            {threads.data.map((thread) => (
              <li key={thread.id}>
                <Link href={`/forum/threads/${thread.id}`}>{thread.title}</Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/forum/threads/new" className="btn-primary btn">Yeni thread oluştur</Link>
      </div>
    </Layout>
  );
};

export default Threads;
