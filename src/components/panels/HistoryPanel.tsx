import { createPanel } from "./utils";
import { usePaymentsHistory } from "~/utils/usePayments";
import type { RouterOutputs } from "~/utils/api";

type PaymentData = RouterOutputs["payments"]["getAll"][number];

type HistoryStep = {
  // only one history step for now
  type: "payment";
  data: PaymentData;
};
const HistoryStep: React.FC<{ step: HistoryStep }> = ({ step }) => {
  switch (step.type) {
    case "payment":
      const { id, type, to, toId, amount, createdAt } = step.data;
      if (type === "salary") {
        return (
          <li className="step-warning step flex items-center space-x-4">
            <div>
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
        const { entityId, entity } = step.data;
        return (
          <li className="step-warning step flex items-center space-x-4">
            <div>
              Invoice: entity:{entityId} type:{entity.type} date:{" "}
              <span className="text-accent">
                {createdAt.toLocaleString("tr-TR")}
              </span>
            </div>
          </li>
        );
      }
      break;
    default:
      const _exhaustiveCheck: never = step.type;
      throw new Error(`Unhandled step type`);
  }
  return null;
};

export const HistoryPanel = createPanel([], () => {
  const buyHistory = usePaymentsHistory().data ?? [];

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
    // şimdilik sadece payment var
    ...buyHistory.map((b) => ({ type: "payment" as const, data: b })),
    // TODO: aynı anda dağıtılan payment'ler için pool oluştur ve
    // tek bir step olarak göster
    // NOTE: pool oluşturmak için step.createAt.getTime() identifier olarak kullanılabilir! 😎
  ];

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
