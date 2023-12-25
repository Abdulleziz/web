import type { NextPage } from "next";
import { Layout } from "~/components/Layout";
import { useHydrated } from "~/pages/_app";
import { useCheckout } from "..";
import { getSystemEntityById } from "~/utils/entities";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { EntityDetails } from "../EntityCard";
import { Button } from "~/components/ui/button";
import { PlusCircleIcon, MinusCircleIcon, Trash2Icon } from "lucide-react";
import { useBuyEntities, useGetWallet } from "~/utils/usePayments";
import { Input } from "~/components/ui/input";

const Cart: NextPage = () => {
  const hydrated = useHydrated();
  const store = useCheckout((state) => state.items).map(([i, amount]) => ({
    ...getSystemEntityById(i),
    amount,
  }));
  const items = hydrated ? store : [];
  const buy = useBuyEntities();
  const addItems = useCheckout((state) => state.addItems);
  const removeItems = useCheckout((state) => state.removeItems);
  const updateItems = useCheckout((state) => state.updateItem);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.amount,
    0
  );
  const userBalance = useGetWallet().data?.balance ?? 0;

  return (
    <Layout>
      <CardHeader className="text-2xl">Sepet</CardHeader>
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
        <div className="flex flex-col gap-3 md:col-span-3">
          {items.map((item) => {
            return (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-start gap-3">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      width={100}
                      height={100}
                      className="rounded "
                      alt={`image-${item.id}`}
                    />
                  )}
                  <EntityDetails entity={item} />
                </CardHeader>
                <CardContent>
                  <div className="flex  justify-between">
                    <div className="flex flex-row items-center justify-start gap-4 ">
                      <Button
                        variant={"default"}
                        onClick={() => addItems([item.id])}
                      >
                        <PlusCircleIcon />
                      </Button>
                      <Input
                        min="0"
                        onChange={(e) => {
                          if (e.target.value.includes("-")) {
                            e.target.value = "0";
                          }
                          updateItems(item.id, Number(e.target.value));
                        }}
                        defaultValue={item.amount}
                        value={item.amount}
                      />
                      <Button
                        variant={item.amount !== 1 ? "default" : "destructive"}
                        onClick={() => removeItems([item.id])}
                        disabled={item.amount === 0}
                      >
                        {item.amount === 1 ? (
                          <Trash2Icon />
                        ) : (
                          <MinusCircleIcon />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-row gap-4">
                      <div>
                        <p>Birim Fiyat</p>
                        <p>{`$${item.price}`}</p>
                      </div>
                      <div>
                        <p>Total</p>
                        <p>{`$${item.price * item.amount}`}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="col-span-1">
          <Card>
            <CardHeader>Şiparişi Tamamla</CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex justify-between">
                <div>
                  <p>Total</p>
                  <p>{`$${totalPrice}`}</p>
                </div>
                <div>
                  <p>Bakiye</p>
                  <p className="text-green-600">{`$${userBalance}`}</p>
                </div>
              </div>
              <Button
                disabled={buy.isLoading}
                isLoading={buy.isLoading}
                onClick={() => buy.mutate(items)}
              >
                Satın Al
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
