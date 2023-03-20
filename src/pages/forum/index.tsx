import type { NextPage } from "next";
import Link from "next/link";
import { Layout } from "~/components/Layout";

const Forum: NextPage = () => {
  return (
    <Layout theme="dark">
      <div className="flex min-h-screen flex-col items-center justify-center pb-32">
        <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
          <ForumWelcome />
        </div>
      </div>
    </Layout>
  );
};

const ForumWelcome: React.FC = () => {
  return (
    <div>
      <h1 className="px-16 text-6xl font-extrabold tracking-tight text-white sm:text-[5rem]">
        Abdulleziz Forumuna hoş geldin!
      </h1>
      <div className="flex flex-col items-center justify-center">
        <Link
          href="/forum/threads/new"
          className="p-4 text-success text-2xl font-extrabold"
        >
          Yeni Thread oluştur!
        </Link>
        <Link
          href="/forum/threads"
          className="p-4 text-2xl font-extrabold text-info"
        >
          Forumları görüntüle!
        </Link>
      </div>
    </div>
  );
};

export default Forum;
