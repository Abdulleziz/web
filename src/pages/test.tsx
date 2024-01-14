/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import { Layout } from "~/components/Layout";
import AblyProvider from "~/lib/ably/AblyProvider";
import { useHydrated } from "./_app";
import dynamic from "next/dynamic";

const TestComponent = dynamic(() => import("~/components/Test"), {
  ssr: false,
});

const TextPage: NextPage = () => {
  const hydrated = useHydrated();
  return (
    <Layout>
      {hydrated && (
        <AblyProvider>
          <TestComponent />
        </AblyProvider>
      )}
    </Layout>
  );
};

export default TextPage;
