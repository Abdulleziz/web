import type { NextPage } from "next";
import Link from "next/link";
import { Layout } from "~/components/Layout";
import Threads from "./threads/index";
import { Button } from "~/components/ui/button";

const Forum: NextPage = () => {
  return (
    <Layout>
      <div className="flex min-h-screen flex-col items-center justify-center pb-32">
        <div className="flex w-full flex-1 flex-col">
          <ForumWelcome />
        </div>
      </div>
    </Layout>
  );
};

const ForumWelcome: React.FC = () => {
  return (
    <>
      <div className="navbar flex flex-col pt-8 sm:flex-row">
        <div className="navbar-start"></div>
        <div className="navbar-center">
          <h1 className="px-16 text-xl font-extrabold tracking-tight text-current md:text-3xl">
            Abdulleziz Forumuna Hoş Geldin!
          </h1>
        </div>
        <div className="navbar-end">
          <Link
            href="/forum/threads/new"
            className="mr-7 p-2 font-semibold transition-all hover:scale-110"
          >
            <Button size="relative-lg">Yeni Thread</Button>
          </Link>
        </div>
      </div>
      <Threads />
    </>
  );
};

export default Forum;
