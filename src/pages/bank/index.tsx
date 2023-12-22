import { type NextPage } from "next";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  useCreateBankTransaction,
  useDistributeSalary,
  useGetBankHistory,
  useTriggerEmergency,
} from "~/utils/useBank";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import { useGetWallet } from "~/utils/usePayments";

const BankPage: NextPage = () => {
  const wallet = useGetWallet();
  const user = useGetAbdullezizUser();
  const transaction = useCreateBankTransaction();
  const paySalary = useDistributeSalary();
  const triggerOhal = useTriggerEmergency();
  const history = useGetBankHistory(undefined, {
    select({ balance, invoices, salaries, transfers }) {
      return {
        balance,
        events: [
          ...invoices.map((i) => ({ ...i, type: "invoice" as const })),
          ...salaries.map((s) => ({ ...s, type: "salary" as const })),
          ...transfers.map((t) => ({ ...t, type: "transfer" as const })),
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      };
    },
  });
  const [amount, setAmount] = useState(0);

  const canTriggerOhal = history.data?.events.find(
    (e) =>
      e.type === "salary" &&
      !e.paidAt &&
      e.createdAt.getTime() > Date.now() - 1000 * 60 * 60 * 24
  );

  if (user.isLoading) return <div>Loading...</div>;
  if (!user.data) return <div>Not logged in</div>;
  return (
    <Layout>
      <main className="text-zinc-50">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-4xl">Abdulleziz Bankası</h1>
          {user.data.perms.includes("ohal başlat") && (
            <Button
              size={"relative-lg"}
              variant={"destructive"}
              disabled={!canTriggerOhal}
              isLoading={triggerOhal.isLoading}
              onClick={() => triggerOhal.mutate()}
            >
              OHAL Başlat
            </Button>
          )}
          {user.data.perms.includes("banka geçmişini gör") ? (
            <>
              <Input
                className="w-1/6"
                placeholder="Miktar"
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.valueAsNumber)}
              />
              <Label className="ml-4 text-xl">
                Cüzdanınız: {wallet.data?.balance ?? 0}
              </Label>
              <Label className="ml-4 text-xl">
                Banka Bakiyesi: {history.data?.balance ?? 0}
              </Label>
              <div className="flex gap-2">
                <Button
                  isLoading={transaction.isLoading}
                  disabled={transaction.isLoading || amount <= 0}
                  onClick={() =>
                    transaction.mutate({
                      amount,
                      operation: "withdraw",
                    })
                  }
                >
                  Para çek
                </Button>
                <Button
                  isLoading={transaction.isLoading}
                  disabled={transaction.isLoading || amount <= 0}
                  onClick={() =>
                    transaction.mutate({
                      amount,
                      operation: "deposit",
                    })
                  }
                >
                  Para yatır
                </Button>
              </div>
              <div>
                <h1>History</h1>
                <ul>
                  {history.data?.events.map((e) => (
                    <li key={e.createdAt.getTime()}>
                      {e.type === "invoice" ? (
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-2xl">Invoice</p>
                          <p>{JSON.stringify(e.entities)}</p>
                        </div>
                      ) : e.type === "salary" ? (
                        <div className="flex items-center justify-center gap-2 border">
                          <p className="text-2xl">Salary</p>
                          <p>multiplier {e.multiplier}</p>
                          <div className="flex flex-col items-center justify-center">
                            {e.salaries.map((s) => (
                              <div key={s.id} className="border">
                                <p>severity: {s.severity}</p>
                                <p>user: {s.toId}</p>
                              </div>
                            ))}
                            {/* TODO: calculate bank salary func */}
                            <p>
                              total:{" "}
                              {e.multiplier *
                                e.salaries.reduce((p, c) => p + c.severity, 0)}
                            </p>
                            <Button
                              disabled={!!e.paidAt || !user.data.perms.includes("bankayı işlet")}
                              isLoading={paySalary.isLoading}
                              onClick={() => paySalary.mutate()}
                            >
                              {e.paidAt ? "Ödenmiş" : "Maaşları öde!"}
                            </Button>
                          </div>
                        </div>
                      ) : e.type === "transfer" ? (
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-2xl">Transfer</p>
                          <p>{e.operation}</p>
                          <p>{e.amount}</p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div>Banka geçmişini görme yetkiniz yok</div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default BankPage;
