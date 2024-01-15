/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import { Layout } from "~/components/Layout";
import AblyProvider from "~/lib/ably/AblyProvider";
import { useHydrated } from "./_app";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const RouletteComponent = dynamic(() => import("~/components/Roulette"), {
  ssr: false,
});

const BlackJackComponent = dynamic(() => import("~/components/BlackJack"), {
  ssr: false,
});

const TextPage: NextPage = () => {
  const hydrated = useHydrated();
  const router = useRouter();
  const initialTab = router.query.tab as string;
  const [activeTab, setActiveTab] = useState(initialTab || "roulette");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push({ query: { tab: value } }).catch(console.error);
  };

  useEffect(() => {
    setActiveTab(router.query.tab as string);
  }, [router.query.tab]);

  return (
    <Layout>
      {hydrated && (
        <AblyProvider>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            defaultValue="roulette"
          >
            <TabsList className="flex items-center justify-center">
              <TabsTrigger value="roulette">Roulette</TabsTrigger>
              <TabsTrigger value="blackjack">BlackJack</TabsTrigger>
            </TabsList>
            <TabsContent value="roulette">
              <RouletteComponent />
            </TabsContent>
            <TabsContent value="blackjack">
              <BlackJackComponent />
            </TabsContent>
          </Tabs>
        </AblyProvider>
      )}
    </Layout>
  );
};

export default TextPage;
