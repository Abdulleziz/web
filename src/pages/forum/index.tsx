import type { NextPage } from "next";
import Link from "next/link";
import { Layout } from "~/components/Layout";
import Threads from "./threads/index";

const Forum: NextPage = () => {
  return (
    <Layout theme="dark">
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
      <div className="navbar pt-8">
        <div className="navbar-start"></div>
        <div className="navbar-center">
          <h1 className="px-16 text-3xl font-extrabold tracking-tight text-white">
            Welcome to Abdulleziz Forum!
          </h1>
        </div>
        <div className="navbar-end">
          <Link
            href="/forum/threads/new"
            className="transtion-all text-1xl mr-7 rounded-full bg-lime-500 p-2 font-semibold text-white"
          >
            New Thread
          </Link>
        </div>
      </div>
      <Threads />
    </>
  );
};

export default Forum;
