import { Layout } from "~/components/Layout";
import type { NextPage } from "next";
import EntityCard from "./EntityCard";
import {
  SystemEntities,
  getSystemEntityById,
  type SystemEntity,
} from "~/utils/entities";
import { Card } from "~/components/ui/card";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHydrated } from "../_app";
import { Button } from "~/components/ui/button";

type Checkout = {
  items: Array<SystemEntity["id"]>;
  addItems: (items: Array<SystemEntity["id"]>) => void;
};

const checkoutDefault = {
  items: [],
} satisfies Partial<Checkout>;

export const useCheckout = create<Checkout>()(
  persist(
    (set, get) => ({
      ...checkoutDefault,
      addItems: (items) => set({ items: get().items.concat(items) }),
    }),
    { name: "store-checkout" }
  )
);

const Store: NextPage = () => {
  const hydrated = useHydrated();
  const items = useCheckout((state) => state.items);
  const total = hydrated
    ? items.map(getSystemEntityById).reduce((acc, item) => acc + item.price, 0)
    : 0;
  return (
    <Layout>
      <div className="grid grid-cols-4 gap-3 p-24">
        {SystemEntities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>

      {/* checkout popup */}
      <Card>
        <div className="flex flex-col items-center justify-center gap-3 p-3">
          <h1>Satın al</h1>
          <p>Toplam: {total}$</p>
          <Button>Ödeme Yap</Button>
        </div>
      </Card>
    </Layout>
  );
};

export default Store;
