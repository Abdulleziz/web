// import Link from "next/link";
// import { createPanel } from "./utils";
// import { usePaymentsHistory } from "~/utils/usePayments";
// import type { RouterOutputs } from "~/utils/api";
// import { useGetAllCrons } from "~/utils/useCron";
// import { useGetForumThreads } from "~/utils/useForum";
// import { getSystemEntityById } from "~/utils/entities";
// import { useConsumeTeaHistory } from "~/utils/useConsumable";
// import { useAutoAnimate } from "@formkit/auto-animate/react";
// import { Card } from "../ui/card";
// import { Button } from "../ui/button";
// import { AbdullezizUser } from "../AbdullezizUser";

// type PaymentData = RouterOutputs["payments"]["getAll"][number];
// type CronData = RouterOutputs["cron"]["getAll"][number];
// type ThreadData = RouterOutputs["forum"]["getThreads"][number];
// type ConsumeTeaData = RouterOutputs["consumable"]["tea"]["history"][number];

// type HistoryStep =
//   | { type: "payment"; data: PaymentData }
//   | { type: "cron"; data: CronData }
//   | { type: "thread"; data: ThreadData }
//   | { type: "consumeTea"; data: ConsumeTeaData };

// const HistoryStep: React.FC<{ step: HistoryStep }> = ({ step }) => {
//   switch (step.type) {
//     case "consumeTea": {
//       const { amountGram, consumer } = step.data;
//       const quantity = amountGram / 5;
//       return (
//         <li className="flex items-center justify-center space-x-4">
//           <div className="flex items-center justify-center gap-1 text-sm">
//             <AbdullezizUser data={consumer} /> kardeşimiz güzelinden{" "}
//             {quantity > 1 && <span className="text-success">{quantity} </span>}
//             çay içti.
//           </div>
//         </li>
//       );
//     }
//     case "thread": {
//       const { id, creator, title, pin } = step.data;
//       return (
//         <li className="flex flex-col items-center justify-center gap-1 md:flex-row">
//           <p>Yeni Thread</p>
//           <Link href={`/forum/threads/${id}`}>
//             <Button
//               className="max-w-[15rem] truncate md:max-w-md"
//               variant={pin ? "default" : "outline"}
//               size="sm"
//             >
//               {title}
//             </Button>
//           </Link>
//           <AbdullezizUser data={creator} />
//           {!!pin && <p> Pin: {pin.createdAt.toLocaleString("tr-TR")}</p>}
//         </li>
//       );
//     }
//     case "cron": {
//       const { cron, isGlobal, title } = step.data;
//       const url = new URL("/cron", window.location.href);
//       url.searchParams.set("exp", cron);
//       return (
//         <li className="flex items-center justify-center gap-2">
//           Yeni Hatırlatıcı{" "}
//           <Link href={url}>
//             <Button
//               className="max-w-[15rem] truncate md:max-w-md"
//               variant={isGlobal ? "outline" : "default"}
//               size="sm"
//             >
//               <span>
//                 {title} ({cron})
//               </span>
//             </Button>
//           </Link>
//         </li>
//       );
//     }
//     case "payment":
//       {
//         const { type } = step.data;
//         if (type === "salary") {
//           const { pool } = step.data;
//           const total = pool.reduce((acc, s) => acc + s.amount, 0);
//           const users = pool.map((s) => s.to);
//           return (
//             <li className="flex items-center justify-center space-x-4">
//               <div className="flex items-center justify-center gap-1 text-sm">
//                 Maaş: <span className="text-success">${total}</span>{" "}
//                 kullanıcılar:{" "}
//                 <span className="text-xs">
//                   {users.map((l) => l.name).join(", ")}
//                 </span>
//               </div>
//             </li>
//           );
//         }
//         if (type === "transfer") {
//           const { from, to, amount } = step.data;
//           return (
//             <li className="flex flex-col items-center justify-center gap-2">
//               <p>
//                 Para Transferi{" "}
//                 <span className="text-green-700">(${amount})</span>
//               </p>
//               <div className="flex items-center justify-center space-x-2">
//                 <AbdullezizUser data={from} />
//                 <span>{"->"}</span>
//                 <AbdullezizUser data={to} />
//               </div>
//             </li>
//           );
//         }
//         if (type === "invoice") {
//           const { to, pool: poolRaw } = step.data;
//           const pool = poolRaw.map((p) => ({
//             ...p,
//             entity: getSystemEntityById(p.entityId),
//           }));
//           const EntityDetails = (props: { data: (typeof pool)[number] }) => {
//             const { entity, amount } = props.data;
//             let name: string;
//             switch (entity.type) {
//               case "tea":
//                 name = entity.tea.name;
//                 break;

//               case "phone":
//                 name = `${entity.phone.brand} ${entity.phone.model}`;
//                 break;

//               case "car":
//                 name = `${entity.car.brand} ${entity.car.model} ${entity.car.year}`;
//                 break;

//               case "human":
//                 name = `${entity.human.name} ${entity.human.surname}`;
//                 break;
//             }

//             return (
//               <div className="text-xs">
//                 {amount > 1 && <span>{amount} adet </span>}
//                 {amount > 1 && (
//                   <span className="text-red-400">${entity.price}</span>
//                 )}{" "}
//                 {name}{" "}
//                 <span className="text-green-700">
//                   (${amount * entity.price})
//                 </span>
//               </div>
//             );
//           };

//           const total = pool.reduce(
//             (acc, s) => acc + s.amount * s.entity.price,
//             0
//           );
//           return (
//             <li className="flex flex-col items-center justify-center gap-1">
//               <p>
//                 Satın Alma <span className="text-green-700">${total}</span>
//               </p>
//               {pool.map((d, i) => (
//                 <EntityDetails key={i} data={d} />
//               ))}{" "}
//               <AbdullezizUser data={to} />
//             </li>
//           );
//         }
//       }
//       break;
//     default:
//       const _exhaustiveCheck: never = step; // eslint-disable-line @typescript-eslint/no-unused-vars
//       throw new Error(`Unhandled step type`);
//   }
//   return null;
// };

// export const HistoryPanel = createPanel([], () => {
//   const buyHistory = usePaymentsHistory().data ?? [];
//   const cronHistory = useGetAllCrons().data ?? [];
//   const threadHistory = useGetForumThreads().data ?? [];
//   const consumeTeaHistory = useConsumeTeaHistory().data ?? [];
//   const [ref] = useAutoAnimate();

//   const history: HistoryStep[] = [
//     // tüm historyleri birleştiriyoruz
//     ...consumeTeaHistory.map((c) => ({ type: "consumeTea" as const, data: c })),
//     ...threadHistory.map((t) => ({ type: "thread" as const, data: t })),
//     ...cronHistory.map((c) => ({ type: "cron" as const, data: c })),
//     ...buyHistory.map((b) => ({ type: "payment" as const, data: b })),
//   ].sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());

//   return (
//     <Card className="row-span-3 rounded-lg shadow md:col-span-2">
//       <div className="flex items-center justify-between border-b border-base-200 px-6 py-5 font-semibold">
//         <span>Geçmiş Paneli</span>
//       </div>
//       <div className="overflow-hidden overflow-y-auto">
//         <ul ref={ref}>
//           {history.map((h) => (
//             <div
//               className="space-y-1 border-b border-base-200 px-1 py-5 font-semibold"
//               key={`${h.type}-${h.data.createdAt.getTime()}`}
//             >
//               <HistoryStep step={h} />
//               <div className="flex items-center justify-center gap-1 font-mono text-sm text-accent">
//                 {h.data.createdAt.toLocaleString("tr-TR")}
//               </div>
//             </div>
//           ))}
//         </ul>
//       </div>
//     </Card>
//   );
// });
