import { Layout } from "~/components/Layout";
import type { NextPage } from "next";
import EntityCard, { EntityDetails } from "./EntityCard";
import {
  SystemEntities,
  getSystemEntityById,
  type SystemEntity,
} from "~/utils/entities";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHydrated } from "../_app";
import { Button } from "~/components/ui/button";
import { ShoppingCartIcon, XCircleIcon } from "lucide-react";
import { CardTitle } from "~/components/ui/card";
import Link from "next/link";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

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
  const store = useCheckout((state) => state.items).map(([i, amount]) => ({
    ...getSystemEntityById(i),
    amount,
  }));
  const items = hydrated ? store : [];
  const total = items.reduce((acc, item) => acc + item.price * item.amount, 0);

  return (
    <Layout>
      {/* checkout popup */}
      <div className="flex flex-col items-end justify-center gap-3 p-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button className="flex gap-1">
              <ShoppingCartIcon />
              <p>Sepet</p>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col items-start justify-center gap-3 rounded p-5">
            <CardTitle>Sepet</CardTitle>

            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-center">
                <p>{`${item.amount} x`} </p> <EntityDetails entity={item} />
              </div>
            ))}
            <p>Toplam: {total}$</p>

            <Link href="/store/cart">
              <Button>Sepete Git</Button>
            </Link>

            <PopoverClose className="absolute right-2 top-2">
              <XCircleIcon height={25} width={25} />
            </PopoverClose>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-1 gap-3 p-24 sm:grid-cols-4">
        {SystemEntities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </Layout>
  );
};

export default Store;
