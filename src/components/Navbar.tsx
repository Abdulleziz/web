import { signOut, signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useGetWallet, useSendMoney } from "~/utils/usePayments";
import { type Theme, useThemeStore, Themes } from "./Layout";
import { createModal } from "~/utils/modal";
import { useHydrated } from "~/pages/_app";
import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  useGetUserNotification,
  useSetUserNotification,
} from "~/utils/useForum";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import classNames from "classnames";

export const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const wallet = useGetWallet();
  const sendMoney = useSendMoney();
  const hydrated = useHydrated();
  const forumNotif = useGetUserNotification();
  const setForumNotif = useSetUserNotification();
  const users = useGetAbdullezizUsers();
  const balance = wallet.data?.balance ?? 0;
  const { theme, setTheme } = useThemeStore();

  const [ref] = useAutoAnimate();

  const [settingsModalOpen, setSettingsModalOpen] = useState(false); // disable (outside-click +or+ on re-render) closing
  const { Modal: SettingsModal, ModalTrigger: SettingsModalTrigger } =
    createModal(
      "user-settings",
      "Ayarlar",
      settingsModalOpen,
      setSettingsModalOpen
    );

  // TODO: since our modal is flashing every render (so annoying), we should use `headlessui`
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState(0);
  const [paymentTarget, setPaymentTarget] = useState<string | null>(null);
  const { Modal: PaymentModal, ModalTrigger: PaymentModalTrigger } =
    createModal(
      "send-money",
      "Para gönder",
      paymentModalOpen,
      setPaymentModalOpen
    );

  return (
    <div className="navbar sticky top-0 z-50 bg-base-300" ref={ref}>
      <div className="navbar-start">
        <div className="dropdown-hover dropdown">
          <Link
            href="/"
            className="btn-ghost btn m-1 bg-gradient-to-r from-[#95FFFF] via-[#9C99FF] to-[#FD5DAD] bg-clip-text text-sm normal-case text-transparent hover:bg-clip-padding hover:text-black md:text-xl"
          >
            Abdulleziz Corp.
          </Link>
          <ul className="dropdown-content menu rounded-box w-52 bg-base-300 p-2">
            <li>
              <Link href="/">Anasayfa</Link>
            </li>
            <li>
              <Link href="/forum">Forum</Link>
            </li>
            <li>
              <Link href="/cron">Hatırlatıcı</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="navbar-center"></div>
      <div className="navbar-end">
        {session ? (
          <div className="dropdown dropdown-end">
            <div className="flex flex-row items-center gap-2">
              <span>{session.user.name}</span>
              <span className="text-success">
                ${wallet.isLoading ? "..." : balance}
              </span>
              <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
                <div className="w-10 rounded-full">
                  {!!session.user.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile photo"
                      width={128}
                      height={128}
                    />
                  )}
                </div>
              </label>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-300 p-2 shadow"
            >
              <li>
                <Link
                  className="justify-between"
                  href={`/profiles/${session.user.id}`}
                >
                  Profil
                </Link>
              </li>
              <li>
                <PaymentModalTrigger
                  onClick={() => setPaymentModalOpen(true)}
                />
              </li>
              <li>
                <SettingsModalTrigger
                  onClick={() => setSettingsModalOpen(true)}
                />
              </li>
              <li>
                <button onClick={() => void signOut()}>Çıkış yap</button>
              </li>
            </ul>
          </div>
        ) : (
          <button
            className="btn-primary btn"
            onClick={() => void signIn("discord")}
          >
            Sign In
          </button>
        )}
      </div>
      <PaymentModal>
        <p className="text-bold text-xl text-primary">Para gönder</p>
        <div className="modal-body p-4">
          <p className="text-accent">Miktar</p>
          <div className="form-control flex-row items-center justify-center">
            <input
              className="input w-full max-w-xs"
              type="number"
              placeholder="0"
              inputMode="numeric"
              value={moneyAmount}
              onChange={(e) => setMoneyAmount(e.target.valueAsNumber)}
            />
            <button
              className="btn-secondary btn-xs btn"
              onClick={() => setMoneyAmount(balance)}
            >
              Hepsi
            </button>
          </div>
          <p className="text-accent">Alıcı</p>
          <select
            className="select max-w-xs"
            onChange={(e) =>
              setPaymentTarget(
                users.data?.find((u) => u.user.username === e.target.value)
                  ?.id || null
              )
            }
          >
            <option className="hidden">
              {users.data?.find((u) => u.id === paymentTarget)?.user.username ||
                "--Kullanıcı seçin--"}
            </option>
            {users.data
              ?.filter((u) => u.id)
              .map((u) => (
                <option
                  className="disabled:text-primary"
                  key={u.id}
                  defaultValue={u.id}
                  disabled={!u.id}
                >
                  {u.user.username}
                </option>
              ))}
          </select>
          <button
            className={classNames("btn-primary btn mt-4 w-full", {
              ["loading"]: sendMoney.isLoading,
            })}
            disabled={!paymentTarget || moneyAmount <= 0}
            onClick={() => {
              if (paymentTarget)
                sendMoney.mutate({
                  amount: moneyAmount,
                  toId: paymentTarget,
                });
            }}
          >
            Gönder
          </button>
        </div>
      </PaymentModal>
      {hydrated && (
        <SettingsModal>
          <p className="text-bold text-xl text-primary">Ayarlar</p>
          <div className="modal-body p-4">
            <p className="text-accent">Tema</p>
            <select
              className="select max-w-xs"
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              <option className="hidden">{theme}</option>
              {Themes.map((t) => (
                <option
                  className="disabled:text-primary"
                  key={t}
                  defaultValue={t}
                  disabled={theme === t}
                >
                  {t}
                </option>
              ))}
            </select>
            {!!forumNotif.data && (
              <>
                <p className="text-accent">Forum Bildirimleri</p>
                <select
                  className="select max-w-xs"
                  disabled={
                    forumNotif.isLoading ||
                    !forumNotif.data ||
                    setForumNotif.isLoading
                  }
                  onChange={(e) =>
                    setForumNotif.mutate(e.target.value as "all" | "mentions")
                  }
                >
                  {/* TODO: toggle */}
                  {/* hızlıca yaptım düzenlicem... */}
                  <option className="hidden">
                    {forumNotif.data.defaultThreadNotify}
                  </option>
                  <option
                    defaultValue={
                      forumNotif.data.defaultThreadNotify === "all"
                        ? "mentions"
                        : "all"
                    }
                  >
                    {forumNotif.data.defaultThreadNotify === "all"
                      ? "mentions"
                      : "all"}
                  </option>
                </select>
              </>
            )}
          </div>
        </SettingsModal>
      )}
    </div>
  );
};
