import { type NextPage } from "next";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import { DataTable } from "~/components/tables/generic-table";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  useCreateBankTransaction,
  useDistributeSalary,
  useGetHistory,
  useTriggerEmergency,
} from "~/utils/useBank";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import { useGetWallet } from "~/utils/usePayments";
import { columns } from "./columns";
import { SalaryCounter } from "~/components/panels";

const BankPage: NextPage = () => {
  const wallet = useGetWallet();
  const user = useGetAbdullezizUser();
  const transaction = useCreateBankTransaction();
  const paySalary = useDistributeSalary();
  const triggerOhal = useTriggerEmergency();
  const history = useGetHistory();

  const [amount, setAmount] = useState(0);

  const canTriggerOhal = history.data?.events.find(
    (e) =>
      e.type === "salary" &&
      !e.paidAt &&
      e.createdAt.getTime() + 1000 * 60 * 60 * 24 < Date.now()
  );

  if (user.isLoading) return <div>Loading...</div>;
  if (!user.data) return <div>Not logged in</div>;

  return (
    <Layout>
      <div className="p-3">
        <Card>
          <CardHeader>
            <CardTitle>Abdulleziz Bankası</CardTitle>
          </CardHeader>
          <CardContent className=" overflow-x-scroll px-6 py-5 font-semibold xl:overflow-x-hidden">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>İşlemler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.data.perms.includes("banka geçmişini gör") ? (
                      <div className="justify-centers flex flex-col items-center gap-3">
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
                      </div>
                    ) : (
                      <div>Yetersiz Yetki...</div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Maaş Yönetim</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      {history.data?.events.map((event) => {
                        //TODO: parse id to name
                        if (event.type === "salary") {
                          if (event.paidAt) {
                            return (
                              <div
                                className="flex flex-col items-center justify-center gap-3"
                                key={event.id}
                              >
                                <CardTitle>Maaşlar ödendi!</CardTitle>
                                <div className="flex flex-col items-center justify-center gap-3">
                                  <p>Sonraki Maaş Ödemesine</p>
                                  <SalaryCounter />
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div
                              className="flex flex-col items-center justify-center gap-3"
                              key={event.id}
                            >
                              <CardTitle>Maaşlar ödenmek için hazır!</CardTitle>

                              <div>
                                {event.salaries.map((salary) => {
                                  return (
                                    <div key={salary.toId}>
                                      <p>{`${salary.toId} kişisine $${
                                        salary.severity * event.multiplier
                                      }`}</p>
                                    </div>
                                  );
                                })}
                              </div>
                              <p>{`Total $${
                                event.multiplier *
                                event.salaries.reduce(
                                  (p, c) => p + c.severity,
                                  0
                                )
                              } ödenecek.`}</p>
                              <p>Onaylıyor musunuz?</p>
                              <Button
                                disabled={
                                  !!event.paidAt ||
                                  !user.data.perms.includes("bankayı işlet") ||
                                  paySalary.isLoading
                                }
                                isLoading={paySalary.isLoading}
                                onClick={() => paySalary.mutate()}
                              >
                                {event.paidAt ? "Ödenmiş" : "Maaşları öde!"}
                              </Button>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {history.data?.events && (
                <DataTable
                  data={history.data?.events}
                  columns={columns}
                  pagination
                  columnFilter={[
                    {
                      title: "Type",
                      columnToFilter: "type",
                      options: [
                        { label: "Transfer", value: "transfer" },
                        { label: "Invoice", value: "invoice" },
                        { label: "Salary", value: "salary" },
                      ],
                    },
                  ]}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BankPage;
