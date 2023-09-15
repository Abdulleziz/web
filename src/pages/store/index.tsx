import { Layout } from "~/components/Layout";
import type { NextPage } from "next";
import ItemCard from "./Itemcard";

const Store: NextPage = () => {
  return (
    <Layout>
      <div className="ml-28 mr-28 grid grid-cols-4 grid-rows-4 gap-3 p-8">
        <ItemCard />
        <ItemCard />
        <ItemCard />
        <ItemCard />
      </div>
    </Layout>
  );
};

export default Store;
