import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Radar } from "react-chartjs-2";

import Link from "next/link";
import { type CSSProperties, useEffect, useState, useCallback } from "react";

import {
  useGetAbdullezizUser,
  useGetAbdullezizUsersSorted,
  useGetCEOVoteEvent,
  useGetCEOVoteEventWithMembers,
  useGetDiscordMembers,
  useVoteCEO,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { toast } from "react-hot-toast";
import { useBuyEntities, useNextSalaryDate } from "~/utils/usePayments";
import { useConsumeTea, useGetRemainingTea } from "~/utils/useConsumable";
import { createPanel } from "./utils";
import { formatName } from "~/utils/abdulleziz";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { useMoneyDialog } from "../SendMoney";
import { AbdullezizUser } from "../AbdullezizUser";
import { MoveRightIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import ResponsivePopup from "../ResponsivePopup";
import useDevice from "~/hooks/useDevice";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export type PanelProps = { children?: React.ReactNode };

export const Panel: React.FC<PanelProps> = ({ children }) => {
  return <div className="">{children}</div>;
};

export const GlobalPanel = createPanel(undefined, () => {
  const openMoneyDialog = useMoneyDialog((s) => s.setOpen);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kullanıcı İşlemleri</CardTitle>
        <CardDescription>Herkesin kullanabildiği işlemler.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Button size="sm" onClick={() => openMoneyDialog()}>
          Para gönder
        </Button>
        <Link href="/forum">
          <Button size="sm">Foruma git</Button>
        </Link>
        <Link href="/cron">
          <Button size="sm">Hatırlatıcıya git</Button>
        </Link>
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-4"></CardFooter>
    </Card>
  );
});

export const MemberPanel = createPanel(undefined, () => {
  const voteCEO = useGetCEOVoteEvent();
  const { data, isLoading } = useGetAbdullezizUser();
  if (isLoading) return <button className="btn loading">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;
  if (data.roles.length === 0) return null;

  const canVote = data.perms.includes("oylamaya katıl");
  const canRequestBonus = data.perms.includes("bonus iste") && false;
  const canTakeSalary = data.perms.includes("maaş al");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Çalışan İşlemleri</CardTitle>
        <CardDescription>
          Abdülleziz çalışanlarının kullanabildiği işlemler.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Link href="/manage">
          <Button
            size="sm"
            isLoading={voteCEO.isLoading}
            disabled={voteCEO.isLoading || (!voteCEO.data && !canVote)}
          >
            {voteCEO.data ? "Oylamaya katıl" : "Oylama başlat"}
          </Button>
        </Link>
        <Button disabled={!canRequestBonus} size="sm">
          Bonus iste
          {/* CEO uyarıp fazladan maaş iste */}
        </Button>
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-4">
        {canTakeSalary && (
          <div>
            Sonraki Maaş
            <SalaryCounter />
          </div>
        )}
      </CardFooter>
    </Card>
  );
});

export const AdminPanel = createPanel(undefined, () => {
  const { data, isLoading } = useGetAbdullezizUser();

  if (isLoading) return <button className="btn loading">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;

  const manageForum = data.perms.includes("forumu yönet");
  const manageForumPins = data.perms.includes("forum thread pinle");
  const seeBank = data.perms.includes("banka geçmişini gör");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yönetici İşlemleri</CardTitle>
        <CardDescription>
          Abdülleziz büyüklerinin kullanabildiği işlemler. Satranç oynamak gibi
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Link href="/manage">
          <Button size="sm">Çalışanları Yönet!</Button>
        </Link>
        <Link href="/forum">
          <Button size="sm" disabled={!manageForum && !manageForumPins}>
            {manageForumPins && !manageForum ? "Thread Pinle" : "Forumu yönet"}
          </Button>
        </Link>
        <Link href="/bank">
          <Button size="sm" disabled={!seeBank}>
            Bankayı yönet
          </Button>
        </Link>
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-4"></CardFooter>
    </Card>
  );
});

export const DriveablePabel = createPanel(undefined, () => {
  const { data, isLoading } = useGetAbdullezizUser();
  if (isLoading) return <button className="btn loading">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;

  const canDrive = data.perms.includes("araba sür") && false;
  const canManage = data.perms.includes("arabaları yönet") && false;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Araç İşlemleri</CardTitle>
        <CardDescription>
          Megan sürmek veya araba yönetmek için kullanılan işlemler.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Button size="sm" disabled={!canDrive}>
          Araba sür
        </Button>
        <Button size="sm" disabled={!canManage}>
          Arabaları yönet
        </Button>
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-4"></CardFooter>
    </Card>
  );
});

export const CEOVotePanel = createPanel(undefined, () => {
  const { data, isLoading } = useGetCEOVoteEventWithMembers();
  const { data: abdullezizUsers, isLoading: isAbdullezizUsersLoading } =
    useGetAbdullezizUsersSorted();
  const members = abdullezizUsers ?? [];
  const { isDesktop } = useDevice();
  const [isVotesOpen, setIsVotesOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const voteCEO = useVoteCEO();

  if (!data || isLoading) return <></>;

  return (
    <Card className="flex flex-col md:col-span-2">
      {
        //TODO: redesign when vote event finish.
        data.endedAt ? (
          <>
            <CardHeader>
              <CardTitle>CEO Oylaması Bitti</CardTitle>
              {data.winner ? (
                <CardDescription className="text-xl">{`Kazanan: ${formatName(
                  data.winner
                )}`}</CardDescription>
              ) : (
                <CardDescription className="text-xl">
                  Kazanan çıkmadığı için oylama tekrar başlatılabilir
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start justify-start gap-3">
                <span className="">
                  Oylama {data.endedAt.toLocaleString("tr-TR")} tarihinde bitti.
                </span>
                {data.sitUntil && (
                  <span className="">
                    CEO {data.sitUntil.toLocaleString("tr-TR")}
                    {"'e"} kadar koltuktan kaldırılamaz.
                  </span>
                )}
                {!data.winner && (
                  <ResponsivePopup
                    triggerButtonName="Tekrar Oylama Başlat"
                    headerTitle="CEO oylamasını tekrarla."
                    headerDesc="CEO olmasını istediğin Abduleziz çalışanını seç!"
                    dialogFooter={
                      <Button
                        disabled={
                          voteCEO.isLoading || selectedMember.length < 1
                        }
                        isLoading={voteCEO.isLoading}
                        onClick={() => {
                          voteCEO.mutate(selectedMember);
                        }}
                      >
                        Onayla
                      </Button>
                    }
                  >
                    <Select
                      onValueChange={(value) => {
                        setSelectedMember(value);
                      }}
                    >
                      <SelectTrigger disabled={isAbdullezizUsersLoading}>
                        <SelectValue placeholder="Abdulleziz Çalışanları" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => {
                          return (
                            <SelectItem
                              key={member.user.id}
                              value={member.user.id}
                            >
                              {formatName(member)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </ResponsivePopup>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>CEO Oylaması Mevcut!</CardTitle>

              {data.estimated && (
                <CardDescription>
                  {`Oylamanın tahmini bitiş tarihi: ${data.estimated.toLocaleString(
                    "tr-TR"
                  )}`}
                </CardDescription>
              )}
              <div className="flex flex-row items-center justify-start gap-3">
                <CardDescription>
                  {`Gerekli Oy Sayısı: ${data.required}`}
                </CardDescription>
                <CardDescription>{`Toplam Oy: ${data.votes.length}`}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-3">
                {isDesktop ? (
                  <>
                    <p>Oylar:</p>
                    <div className="flex flex-col items-center justify-center gap-1">
                      {data.votes.map((v) => (
                        <span
                          key={v.id}
                          className="flex flex-row items-center justify-between"
                        >
                          {v.voter.exist && v.voter.id ? (
                            <AbdullezizUser
                              size={"lg-long"}
                              variant={"link"}
                              data={{
                                id: v.voter.id,
                                name: formatName(v.voter),
                                image: getAvatarUrl(
                                  v.voter.user,
                                  v.voter.avatar
                                ),
                              }}
                              fallback=""
                            />
                          ) : (
                            <div>
                              <span>{"KAYITSIZ: "}</span>
                              <span>{v.voter.user.username}</span>
                            </div>
                          )}
                          <MoveRightIcon />
                          {v.target.exist && v.target.id ? (
                            <AbdullezizUser
                              size={"lg-long"}
                              variant={"link"}
                              data={{
                                id: v.target.id,
                                name: formatName(v.target),
                                image: getAvatarUrl(
                                  v.target.user,
                                  v.target.avatar
                                ),
                              }}
                              fallback=""
                            />
                          ) : (
                            <div>
                              <span>{"KAYITSIZ: "}</span>
                              <span>{v.target.user.username}</span>
                            </div>
                          )}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <Drawer open={isVotesOpen} onOpenChange={setIsVotesOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline">Oylar</Button>
                    </DrawerTrigger>
                    <DrawerContent className="p-4">
                      <DrawerHeader>
                        <DrawerTitle>Oylar</DrawerTitle>
                      </DrawerHeader>
                      <div className="flex max-w-full flex-col items-center justify-center p-4">
                        {data.votes.map((v) => (
                          <span
                            key={v.id}
                            className="flex flex-row items-center justify-between gap-1"
                          >
                            {v.voter.exist && v.voter.id ? (
                              <CardDescription>
                                {formatName(v.voter)}
                              </CardDescription>
                            ) : (
                              <div>
                                <span>{"KAYITSIZ: "}</span>
                                <span>{v.voter.user.username}</span>
                              </div>
                            )}
                            <MoveRightIcon />
                            {v.target.exist && v.target.id ? (
                              <CardDescription>
                                {formatName(v.target)}
                              </CardDescription>
                            ) : (
                              <div>
                                <span>{"KAYITSIZ: "}</span>
                                <span>{v.target.user.username}</span>
                              </div>
                            )}
                          </span>
                        ))}
                      </div>
                      <DrawerFooter className="pt-2">
                        <DrawerClose asChild>
                          <Button variant="outline">Kapat</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                )}

                <ResponsivePopup
                  triggerButtonName="Oylar"
                  headerTitle="CEO oyu ver!"
                  headerDesc="CEO olmasını istediğin Abduleziz çalışanını seç!"
                  dialogFooter={
                    <Button
                      disabled={voteCEO.isLoading || selectedMember.length < 1}
                      isLoading={voteCEO.isLoading}
                      onClick={() => {
                        voteCEO.mutate(selectedMember);
                      }}
                    >
                      Onayla
                    </Button>
                  }
                >
                  <Select
                    onValueChange={(value) => {
                      setSelectedMember(value);
                    }}
                  >
                    <SelectTrigger disabled={isAbdullezizUsersLoading}>
                      <SelectValue placeholder="Abdulleziz Çalışanları" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => {
                        return (
                          <SelectItem
                            key={member.user.id}
                            value={member.user.id}
                          >
                            {formatName(member)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </ResponsivePopup>
              </div>
            </CardContent>
          </>
        )
      }
    </Card>
  );
});

export const ServantPanel = createPanel(undefined, () => {
  const { data, isLoading } = useGetAbdullezizUser();

  const remainingTea = useGetRemainingTea();
  const consumeTea = useConsumeTea();
  const buyEntities = useBuyEntities();

  if (isLoading) return <button className="btn loading">Yükleniyor</button>;
  if (!data) return <button className="btn">Error</button>;

  const canBuy = data.perms.includes("çay satın al");
  const canServe = data.perms.includes("çay koy");
  const canShout = data.perms.includes("çaycıyı sinemle");
  const ummmmm = data.perms.includes("*i*n-t*i.h?a_r ½e(t=");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Çay Paneli</CardTitle>
        <CardDescription>
          <span className="font-mono text-primary">Kalan çay</span>
          <span className="p-2 font-mono font-bold">
            {remainingTea.isLoading ||
            consumeTea.isLoading ||
            !remainingTea.data
              ? "..."
              : remainingTea.data.amountGram}
            gr
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Button
          size="sm"
          disabled={!remainingTea.data?.amountGram || consumeTea.isLoading}
          onClick={() => consumeTea.mutate()}
        >
          {canServe ? "Çay koy" : "Çay söylet"}
        </Button>
        <Button
          size="sm"
          isLoading={buyEntities.isLoading}
          variant={!remainingTea.data?.amountGram ? "warning" : undefined}
          disabled={!canBuy || buyEntities.isLoading}
          onClick={() => {
            // TODO: ilerde bu button direkt mağazaya götürsün...
            toast.loading("Çay satın alınıyor", { id: "buyTea" });
            buyEntities.mutate(
              [
                { id: 1, amount: 1 }, // 1kg
                { id: 2, amount: 5 }, // 200gr * 5 = 1kg
                // toplam 2kg çay 🤣🍔😭😎
              ],
              {
                onSuccess: () => {
                  toast.success(
                    "Çay satın alındı (1kg + 5x200gr) (400 serving)",
                    { id: "buyTea" }
                  );
                },
                onError: () =>
                  toast.error("Çay satın alınamadı", { id: "buyTea" }),
              }
            );
          }}
        >
          Çay satın al
        </Button>
        {!canServe && (
          <Button
            size="sm"
            variant="warning"
            disabled={!canShout || !remainingTea}
          >
            Çaycıyı sinemle! (0/5)
          </Button>
        )}
        {ummmmm && <Button variant="destructive">İntihar et</Button>}
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-4"></CardFooter>
    </Card>
  );
});

export const SalaryCounter = () => {
  const nextSalaryDate = useNextSalaryDate();
  const nextDay = nextSalaryDate.data ?? new Date().getTime();
  const [remains, setRemains] = useState(() => nextDay - new Date().getTime());

  const refreshRemains = useCallback(() => {
    setRemains(nextDay - new Date().getTime());
    if (remains <= 0 && !nextSalaryDate.isLoading)
      void nextSalaryDate.refetch();
  }, [nextDay, remains, nextSalaryDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshRemains();
    }, 1000);
    return () => clearInterval(interval);
  }, [nextDay, refreshRemains]);

  const days = Math.floor(remains / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remains % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((remains % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remains % (1000 * 60)) / 1000);

  return (
    <div className="grid auto-cols-max grid-flow-col gap-5 text-center">
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": days } as CSSProperties}></span>
        </span>
        gün
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": hours } as CSSProperties}></span>
        </span>
        saat
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": minutes } as CSSProperties}></span>
        </span>
        dakika
      </div>
      <div className="flex flex-col">
        <span className="countdown font-mono text-2xl">
          <span style={{ "--value": seconds } as CSSProperties}></span>
        </span>
        saniye
      </div>
    </div>
  );
};

export const VoteChart = createPanel(undefined, () => {
  const getDcMembers = useGetDiscordMembers();
  const vote = useGetCEOVoteEvent();

  const members = (getDcMembers.data ?? []).filter((m) => !m.user.bot); // filter out bots

  const ChartOptions: ChartOptions<"radar"> = {
    scales: {
      r: { ticks: { display: false, count: 6 }, grid: { color: "white" } },
    },
  };

  const chartData: ChartData<"radar"> = {
    labels: members.map(formatName),
    datasets: [
      {
        label: "Oy sayısı",
        data: members.map(
          (m) =>
            vote.data?.votes.filter((v) => v.target === m.user.id).length ?? 0
        ),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
      },
    ],
  };

  return (
    <Card className="flex items-center justify-center rounded-md border-2 border-dashed px-4 py-4 text-3xl font-semibold ">
      <Radar data={chartData} options={ChartOptions} />
    </Card>
  );
});

// export { HistoryPanel } from "./HistoryPanel";
