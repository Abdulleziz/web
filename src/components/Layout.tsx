import Head from "next/head";
import { Navbar } from "./Navbar";
import { SendMoneyDialog } from "./SendMoney";

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
        <SendMoneyDialog />
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
