import { Layout } from "~/components/Layout";
import type { NextPage } from "next";
import EntityCard, { EntityDetails } from "./EntityCard";
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
import { useBuyEntities } from "~/utils/usePayments";

type Checkout = {
  items: Array<[SystemEntity["id"], number]>;
  addItems: (items: Array<SystemEntity["id"]>) => void;
  removeItems: (item: Array<SystemEntity["id"]>) => void;
};

const checkoutDefault = {
  items: [],
} satisfies Partial<Checkout>;

export const useCheckout = create<Checkout>()(
  persist(
    (set, get) => ({
      ...checkoutDefault,
      addItems: (newItems) => {
        const oldItems = get().items;
        newItems.forEach((i) => {
          const old = oldItems.find((old) => old[0] === i);
          // has before
          if (old) old[1] = old[1] + 1;
          else oldItems.push([i, 1]);
          set({ items: [...oldItems] });
        });
      },
      removeItems: (ids) => {
        const oldItems = get().items;
        ids.forEach((id) => {
          const old = oldItems.find((old) => old[0] === id);
          if (old) {
            // has before
            if (old[1] > 1) old[1] = old[1] - 1;
            else oldItems.splice(oldItems.indexOf(old), 1);
            set({ items: [...oldItems] });
          }
        });
      },
    }),
    { name: "store-checkout" }
  )
);

const Store: NextPage = () => {
  const hydrated = useHydrated();
  const buy = useBuyEntities();
  const store = useCheckout((state) => state.items).map(([i, amount]) => ({
    ...getSystemEntityById(i),
    amount,
  }));
  const items = hydrated ? store : [];
  const total = items.reduce((acc, item) => acc + item.price * item.amount, 0);

  return (
    <Layout>
      {/* checkout popup */}
      <Card>
        <div className="flex flex-col items-center justify-center gap-3 p-3">
          <h1>Satın al</h1>
          <p>Toplam: {total}$</p>
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-center text-3xl">
              <p>{item.amount}x</p>
              <EntityDetails entity={item} />
            </div>
          ))}
          <Button disabled={buy.isLoading} onClick={() => buy.mutate(items)}>
            Ödeme Yap
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-4 gap-3 p-24">
        {SystemEntities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </Layout>
  );
};

export default Store;
