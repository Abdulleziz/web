import Link from "next/link";
import { createPanel } from "./utils";
import { usePaymentsHistory } from "~/utils/usePayments";
import type { RouterOutputs } from "~/utils/api";
import { useGetAllCrons } from "~/utils/useCron";
import { useGetForumThreads } from "~/utils/useForum";
import { getSystemEntityById } from "~/utils/entities";
import { useConsumeTeaHistory } from "~/utils/useConsumable";

type PaymentData = RouterOutputs["payments"]["getAll"][number];
type CronData = RouterOutputs["cron"]["getAll"][number];
type ThreadData = RouterOutputs["forum"]["getThreads"][number];
type ConsumeTeaData = RouterOutputs["consumable"]["tea"]["history"][number];

type HistoryStep =
  | {
      type: "payment";
      data: PaymentData;
    }
  | {
      type: "cron";
      data: CronData;
    }
  | {
      type: "thread";
      data: ThreadData;
    }
  | {
      type: "consumeTea";
      data: ConsumeTeaData;
    };

const HistoryStep: React.FC<{ step: HistoryStep }> = ({ step }) => {
  switch (step.type) {
    case "consumeTea": {
      const { createdAt, amountGram, consumer } = step.data;
      return (
        <li
          className="step-primary step flex items-center space-x-4"
          data-content="★"
        >
          <div className="text-sm">
            {consumer.name} kardeşimiz güzelinden{" "}
            <span className="text-success">{(amountGram / 5).toFixed()} </span>
            çay içti. tarih:{" "}
            <span className="text-accent">
              {createdAt.toLocaleString("tr-TR")}
            </span>
          </div>
        </li>
      );
    }
    case "thread": {
      const { id, creator, title, createdAt, pin } = step.data;
      return (
        <li
          className="step-accent step flex items-center space-x-4"
          data-content="★"
        >
          <div className="text-sm">
            Thread:{" "}
            <Link className="link-secondary link" href={`/forum/threads/${id}`}>
              {title}
            </Link>{" "}
            oluşturan: {creator.name} pinli: {pin ? "✅" : "🟥"} tarih:{" "}
            <span className="text-accent">
              {createdAt.toLocaleString("tr-TR")}
            </span>
            {!!pin && <> pin tarihi: {pin.createdAt.toLocaleString("tr-TR")}</>}
          </div>
        </li>
      );
    }
    case "cron": {
      const { cron, isGlobal, listeners, title, createdAt } = step.data;
      const url = new URL("/cron", window.location.href);
      url.searchParams.set("exp", cron);
      return (
        <li
          className="step-secondary step flex items-center space-x-4"
          data-content="★"
        >
          <div className="text-sm">
            Cron:{" "}
            <Link className="link-secondary link" href={url}>
              {title}
            </Link>{" "}
            exp: {cron} Herkese Açık: {isGlobal ? "✅" : "🟥"}{" "}
            {isGlobal && (
              <>
                dinleyiciler:{" "}
                <span className="text-xs">
                  {listeners.map((l) => l.listener.name).join(", ")}
                </span>
              </>
            )}
            <span className="text-accent">
              {" "}
              {createdAt.toLocaleString("tr-TR")}
            </span>
          </div>
        </li>
      );
    }
    case "payment":
      {
        const { type, createdAt } = step.data;
        if (type === "salary") {
          const { pool } = step.data;
          const total = pool.reduce((acc, s) => acc + s.amount, 0);
          const users = pool.map((s) => s.to);
          return (
            <li
              className="step-success step flex items-center space-x-4"
              data-content="$"
            >
              <div className="text-sm">
                Maaş: <span className="text-success">${total}</span>{" "}
                kullanıcılar: ({users.length} kullanıcı) tarih:{" "}
                <span className="text-accent">
                  {createdAt.toLocaleString("tr-TR")}
                </span>
              </div>
            </li>
          );
        }
        if (type === "transfer") {
          const { from, to, amount } = step.data;
          return (
            <li
              className="step-info step flex items-center space-x-4"
              data-content="$"
            >
              Transfer kimden: {from.name} kime: {to.name} miktar: ${amount}
            </li>
          );
        }
        if (type === "invoice") {
          const { to, pool: poolRaw } = step.data;
          const pool = poolRaw.map((p) => ({
            ...p,
            entity: getSystemEntityById(p.entityId),
          }));
          const EntityDetails = (props: { data: (typeof pool)[number] }) => {
            const { entity, amount } = props.data;
            let name: string;
            switch (entity.type) {
              case "tea":
                name = entity.tea.name;
                break;

              case "phone":
                name = `${entity.phone.brand} ${entity.phone.model}`;
                break;

              case "car":
                name = `${entity.car.brand} ${entity.car.model} ${entity.car.year}`;
                break;
            }

            return (
              <div className="text-xs">
                {name}: {amount}x
                <span className="text-primary">${entity.price}</span>=
                <span className="text-success">${amount * entity.price}</span>
              </div>
            );
          };

          const total = pool.reduce(
            (acc, s) => acc + s.amount * s.entity.price,
            0
          );
          return (
            <li
              className="step-primary step flex items-center space-x-4"
              data-content="$"
            >
              <div>
                Satın Alma:
                {pool.map((d, i) => (
                  <EntityDetails key={i} data={d} />
                ))}{" "}
                alıcı: {to.name} toplam:{" "}
                <span className="text-success">${total}</span> tarih:{" "}
                <span className="text-accent">
                  {createdAt.toLocaleString("tr-TR")}
                </span>
              </div>
            </li>
          );
        }
      }
      break;
    default:
      const _exhaustiveCheck: never = step; // eslint-disable-line @typescript-eslint/no-unused-vars
      throw new Error(`Unhandled step type`);
  }
  return null;
};

export const HistoryPanel = createPanel([], () => {
  const buyHistory = usePaymentsHistory().data ?? [];
  const cronHistory = useGetAllCrons().data ?? [];
  const threadHistory = useGetForumThreads().data ?? [];
  const consumeTeaHistory = useConsumeTeaHistory().data ?? [];

  //   // DEMO, TEST DATA
  //   const barkin = users.find((u) => u.user.id === "288397394465521664")!;
  //   const bora = users.find((u) => u.user.id === "222663527784120320")!;
  //   const bugra = users.find((u) => u.user.id === "282535915203723265")!;
  //   const kerem = users.find((u) => u.user.id === "852595277037568031")!;

  //   const historyTESTDATA = [
  //     ["step-warning", `${barkin.nick!} Çaycıya kızdı`, barkin],
  //     [`step-success`, `${bora.nick!} Şirkete Megan Hediye etti!`, bora],
  //     [`step-primary`, `${bora.nick!} Forum'da bir şeyler yazdı`, bora],
  //     [`step-primary`, `${bora.nick!} Forum'da Thread Pinledi`, bora],
  //     [`step-success`, `${bugra.nick!} CEO'luktan Driver'a atandı`, bugra],
  //     [`step-warning`, `${bora.nick!} Çaycıya kızdı`, bora],
  //     [`step-secondary`, "Kerem oylamaya katıldı", kerem],
  //     [`step-error`, `${barkin.nick!} CEO'yu kovdu`, barkin],
  //     [`step-error`, `${barkin.nick!} CTO'yu kovdu`, barkin],
  //     [`step-error`, `${barkin.nick!} CSO'yu kovdu`, barkin],
  //     [`step-error`, `${barkin.nick!} CMO'yu kovdu`, barkin],
  //   ] as const;

  const history: HistoryStep[] = [
    // tüm historyleri birleştiriyoruz
    ...consumeTeaHistory.map((c) => ({ type: "consumeTea" as const, data: c })),
    ...threadHistory.map((t) => ({ type: "thread" as const, data: t })),
    ...cronHistory.map((c) => ({ type: "cron" as const, data: c })),
    ...buyHistory.map((b) => ({ type: "payment" as const, data: b })),
  ].sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());

  return (
    <div className="row-span-3 rounded-lg bg-base-100 shadow">
      <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
        <span>Geçmiş Paneli</span>
      </div>
      <div className="overflow-y-auto">
        <ul className="steps steps-vertical p-6">
          {history.map((h) => (
            <HistoryStep
              key={`${h.type}-${h.data.createdAt.getTime()}`}
              step={h}
            />
          ))}
        </ul>
      </div>
    </div>
  );
});
