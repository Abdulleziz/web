import Head from "next/head";
import { createModal } from "~/utils/modal";
import { useNotificationStage } from "~/lib/pusher/notifications";
import { Navbar } from "./Navbar";
import { SendMoneyDialog } from "./SendMoney";
import { useSession } from "next-auth/react";

type Props = {
  children?: React.ReactNode;
  title?: string;
  location?: string;
};

export const Layout: React.FC<Props> = ({
  children,
  title = "Abdulleziz Corp.",
  location = "",
}) => {
  const { data: session } = useSession();
  const notifStage = useNotificationStage();
  const { Modal } = createModal(
    "notif",
    "unreachable",
    notifStage === "loading" && session !== null
  );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={
            "Abdulleziz Corp. Early Alpha" + (location ? " - " : "") + location
          }
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" />
        <link rel="icon" href="/android-chrome-512x512.png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <main className=" min-h-screen bg-white dark:bg-zinc-950">
        <Navbar />
        {/* {notifStage === "denied" && <Alert />} */}
        <SendMoneyDialog />
        <Modal>
          <div className="flex flex-col items-center justify-center">
            <div className="loader h-32 w-32 rounded-full border-8 border-t-8 border-gray-200 ease-linear"></div>
            <h2 className="mt-6 text-center text-3xl font-extrabold">
              Bekleniyor...
            </h2>
            <p className="mt-2 text-center text-sm">
              Abdülleziz bildirimlerini kabul etmeniz bekleniyor.
            </p>
            <p className="mt-2 text-center text-sm text-info">
              Not: Bildirimleri açmak, Abdülleziz{"'"}in daha iyi çalışmasını
              sağlar.
            </p>
          </div>
        </Modal>
        {children}
      </main>
    </>
  );
};

// const Alert = () => {
//   return (
//     <div className="flex items-center justify-center p-4">
//       <div className="alert alert-error flex flex-row shadow-lg">
//         <div>
//           <ErrorSVG />
//           <span>
//             Abdülleziz bildirimleri şu anda kapalı. Bildirimleri açmak için
//             butona tıklayın.
//           </span>
//         </div>
//         <button
//           onClick={() => {
//             void Notification.requestPermission();
//           }}
//         >
//           Bildirimleri aç
//         </button>
//       </div>
//     </div>
//   );
// };

// const ErrorSVG = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     className="h-6 w-6 flex-shrink-0 stroke-current"
//     fill="none"
//     viewBox="0 0 24 24"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth="2"
//       d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// );
