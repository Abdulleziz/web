import Link from "next/link";
import { createPanel } from "./utils";
import { usePaymentsHistory } from "~/utils/usePayments";
import type { RouterOutputs } from "~/utils/api";
import { useGetAllCrons } from "~/utils/useCron";
import { useGetForumThreads } from "~/utils/useForum";
import { getSystemEntityById } from "~/utils/entities";

type PaymentData = RouterOutputs["payments"]["getAll"][number];
type CronData = RouterOutputs["cron"]["getAll"][number];
type ThreadData = RouterOutputs["forum"]["getThreads"][number];

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
    };

const HistoryStep: React.FC<{ step: HistoryStep }> = ({ step }) => {
  switch (step.type) {
    case "thread": {
      const { id, creator, title, createdAt, pin } = step.data;
      return (
        <li className="step-warning step flex items-center space-x-4">
          <div className="text-sm">
            Thread:{" "}
            <Link className="link-secondary link" href={`/forum/threads/${id}`}>
              {title}
            </Link>{" "}
            by: {creator.name} pin: {pin ? "✅" : "🟥"} date:{" "}
            <span className="text-accent">
              {createdAt.toLocaleString("tr-TR")}
            </span>
            {!!pin && <> pin date: {pin.createdAt.toLocaleString("tr-TR")}</>}
          </div>
        </li>
      );
    }
    case "cron": {
      const { cron, isGlobal, listeners, title, createdAt, lastRun } =
        step.data;
      const url = new URL("/cron", window.location.href);
      url.searchParams.set("exp", cron);
      return (
        <li className="step-warning step flex items-center space-x-4">
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
        const { id, type, to, toId, amount, createdAt } = step.data;
        if (type === "salary") {
          return (
            <li className="step-warning step flex items-center space-x-4">
              <div className="text-sm">
                Salary: <span className="text-success">${amount}</span> to:{" "}
                {to.name} date:{" "}
                <span className="text-accent">
                  {createdAt.toLocaleString("tr-TR")}
                </span>
              </div>
            </li>
          );
        }
        if (type === "transfer") {
          const { from, fromId } = step.data;
          return (
            <li className="step-warning step flex items-center space-x-4">
              payment id: {id} from: {from.name} to: {to.name} amount: ${amount}
            </li>
          );
        }
        if (type === "invoice") {
          const { entityId } = step.data;
          const entity = getSystemEntityById(entityId);
          return (
            <li className="step-warning step flex items-center space-x-4">
              <div>
                Invoice: {entity.type.toUpperCase()} {amount}x
                <span className="text-primary">${entity.price}</span>=
                <span className="text-success">${amount * entity.price}</span>{" "}
                to: {to.name} date:{" "}
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
      const _exhaustiveCheck: never = step;
      throw new Error(`Unhandled step type`);
  }
  return null;
};

export const HistoryPanel = createPanel([], () => {
  const buyHistory = usePaymentsHistory().data ?? [];
  const cronHistory = useGetAllCrons().data ?? [];
  const threadHistory = useGetForumThreads(undefined, false).data ?? [];

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
    ...threadHistory.map((t) => ({ type: "thread" as const, data: t })),
    ...cronHistory.map((c) => ({ type: "cron" as const, data: c })),
    ...buyHistory.map((b) => ({ type: "payment" as const, data: b })),
    // TODO: aynı anda dağıtılan payment'ler için pool oluştur ve
    // tek bir step olarak göster
    // NOTE: pool oluşturmak için step.createAt.getTime() identifier olarak kullanılabilir! 😎
  ].sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());

  return (
    <div className="row-span-3 rounded-lg bg-base-100 shadow">
      <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
        <span>Geçmiş Paneli</span>
      </div>
      <div className="overflow-y-auto">
        <ul className="steps steps-vertical p-6">
          {history.map((h) => (
            <HistoryStep key={`${h.type}-${h.data.id}`} step={h} />
          ))}
        </ul>
      </div>
    </div>
  );
});
