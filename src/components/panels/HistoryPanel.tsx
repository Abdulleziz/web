import Link from "next/link";
import { createPanel } from "./utils";
import { usePaymentsHistory } from "~/utils/usePayments";
import type { RouterOutputs } from "~/utils/api";
import { useGetAllCrons } from "~/utils/useCron";
import { useGetForumThreads } from "~/utils/useForum";
import { getSystemEntityById } from "~/utils/entities";
import { useConsumeTeaHistory } from "~/utils/useConsumable";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { AbdullezizUser } from "../AbdullezizUser";
import { EntityDetails } from "~/pages/store/EntityCard";
import { useGetEmergencyHistory } from "~/utils/useBank";

type PaymentData = RouterOutputs["payments"]["getAll"];

type PaymentSalary = PaymentData["salaries"][number];
type PaymentTransfer = PaymentData["transfers"][number];
type PaymentInvoice = PaymentData["invoices"][number];

type CronData = RouterOutputs["cron"]["getAll"][number];
type ThreadData = RouterOutputs["forum"]["getThreads"][number];
type ConsumeTeaData = RouterOutputs["consumable"]["tea"]["history"][number]; // Deprecated
type EmergencyData = RouterOutputs["emergency"]["history"][number];

type HistoryStep =
  | { type: "buy.salary"; data: PaymentSalary }
  | { type: "buy.transfer"; data: PaymentTransfer }
  | { type: "buy.invoice"; data: PaymentInvoice }
  | { type: "cron"; data: CronData }
  | { type: "thread"; data: ThreadData }
  | { type: "consumeTea"; data: ConsumeTeaData }
  | { type: "emergency"; data: EmergencyData };

const HistoryStep: React.FC<{ step: HistoryStep }> = ({ step }) => {
  switch (step.type) {
    case "consumeTea": {
      const { amountGram, consumer } = step.data;
      const quantity = amountGram / 5;
      return (
        <li className="flex items-center justify-center space-x-4">
          <div className="flex items-center justify-center gap-1 text-sm">
            <AbdullezizUser data={consumer} /> kardeşimiz güzelinden{" "}
            {quantity > 1 && <span className="text-success">{quantity} </span>}
            çay içti.
          </div>
        </li>
      );
    }
    case "thread": {
      const { id, creator, title, pin } = step.data;
      return (
        <li className="flex flex-col items-center justify-center gap-1 md:flex-row">
          <p>Yeni Thread</p>
          <Link href={`/forum/threads/${id}`}>
            <Button
              className="max-w-[15rem] truncate md:max-w-md"
              variant={pin ? "default" : "outline"}
              size="sm"
            >
              {title}
            </Button>
          </Link>
          <AbdullezizUser data={creator} />
          {!!pin && <p> Pin: {pin.createdAt.toLocaleString("tr-TR")}</p>}
        </li>
      );
    }
    case "cron": {
      const { cron, isGlobal, title } = step.data;
      const url = new URL("/cron", window.location.href);
      url.searchParams.set("exp", cron);
      return (
        <li className="flex items-center justify-center gap-2">
          Yeni Hatırlatıcı{" "}
          <Link href={url}>
            <Button
              className="max-w-[15rem] truncate md:max-w-md"
              variant={isGlobal ? "outline" : "default"}
              size="sm"
            >
              <span>
                {title} ({cron})
              </span>
            </Button>
          </Link>
        </li>
      );
    }
    case "buy.salary": {
      const { salaries, multiplier, paidAt } = step.data;
      const total = salaries.reduce(
        (acc, s) => acc + s.severity * multiplier,
        0
      );
      const users = salaries.map((s) => s.to);
      return (
        <li className="flex items-center justify-center space-x-4">
          <div className="flex flex-col items-center justify-center gap-1 text-sm">
            <div>
              Maaş: <span className="text-success">${total}</span>{" "}
              <span className="text-xs">({multiplier}x)</span>
            </div>
            <div className="line-clamp-1">
              <span className="text-xs">
                {users.map((l) => l.name).join(", ")}
              </span>
            </div>
            {paidAt ? "ödendi" : "ödenmedi"}
          </div>
        </li>
      );
    }
    case "buy.transfer": {
      const { from, to, amount } = step.data;
      return (
        <li className="flex flex-col items-center justify-center gap-2">
          <p>
            Para Transferi <span className="text-green-700">(${amount})</span>
          </p>
          <div className="flex items-center justify-center space-x-2">
            {from ? <AbdullezizUser data={from} /> : <span>Bilinmeyen</span>}
            <span>{"->"}</span>
            <AbdullezizUser data={to} />
          </div>
        </li>
      );
    }
    case "buy.invoice": {
      const { to, entities: e } = step.data;
      const entities = e.map((e) => ({
        ...e,
        entity: getSystemEntityById(e.entityId),
      }));

      const total = entities.reduce(
        (acc, e) => acc + e.quantity * e.entity.price,
        0
      );

      return (
        <li className="flex flex-col items-center justify-center gap-1">
          <p>
            Satın Alma <span className="text-green-700">${total}</span>
          </p>
          {entities.map((e) => (
            <div key={e.id}>
              {e.quantity} x <EntityDetails entity={e.entity} />
            </div>
          ))}{" "}
          <AbdullezizUser data={to} />
        </li>
      );
    }
    case "emergency": {
      const { endedAt } = step.data;
      return (
        <li className="flex flex-col items-center justify-center gap-1">
          <p>OHAL</p>
          <p>(bitiş tarihi: {endedAt?.toLocaleString("tr-TR")})</p>
        </li>
      );
    }

    default:
      const _exhaustiveCheck: never = step; // eslint-disable-line @typescript-eslint/no-unused-vars
      throw new Error(`Unhandled step type`);
  }
};

export const HistoryPanel = createPanel([], () => {
  const buy = usePaymentsHistory().data ?? {
    salaries: [],
    transfers: [],
    invoices: [],
  };
  const cronHistory = useGetAllCrons().data ?? [];
  const threadHistory = useGetForumThreads().data ?? [];
  const consumeTeaHistory = useConsumeTeaHistory().data ?? [];
  const emergencyHistory = useGetEmergencyHistory().data ?? [];
  const [ref] = useAutoAnimate();

  const history: HistoryStep[] = [
    // tüm historyleri birleştiriyoruz
    ...consumeTeaHistory.map((c) => ({ type: "consumeTea" as const, data: c })),
    ...threadHistory.map((t) => ({ type: "thread" as const, data: t })),
    ...cronHistory.map((c) => ({ type: "cron" as const, data: c })),
    ...buy.salaries.map((s) => ({ type: "buy.salary" as const, data: s })),
    ...buy.transfers.map((t) => ({ type: "buy.transfer" as const, data: t })),
    ...buy.invoices.map((i) => ({ type: "buy.invoice" as const, data: i })),
    ...emergencyHistory.map((e) => ({ type: "emergency" as const, data: e })),
    // TODO: CEO atamaları
  ].sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());

  return (
    <Card className="row-span-3 rounded-lg shadow md:col-span-2">
      <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
        <span>Geçmiş Paneli</span>
      </div>
      <div className="overflow-hidden overflow-y-auto">
        <ul ref={ref}>
          {history.map((h) => (
            <div
              className="space-y-1 border-b border-base-200 px-1 py-5 font-semibold"
              key={`${h.type}-${h.data.createdAt.getTime()}`}
            >
              <HistoryStep step={h} />
              <div className="flex items-center justify-center gap-1 font-mono text-sm text-accent">
                {h.data.createdAt.toLocaleString("tr-TR")}
              </div>
            </div>
          ))}
        </ul>
      </div>
    </Card>
  );
});
