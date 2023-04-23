import { signOut, signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useGetWallet } from "~/utils/usePayments";
import { type Theme, useThemeStore, Themes } from "./Layout";
import { createModal } from "~/utils/modal";
import { useHydrated } from "~/pages/_app";
import { useState } from "react";

export const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const wallet = useGetWallet();
  const hydrated = useHydrated();
  const balance = wallet.data?.balance ?? 0;
  const { theme, setTheme } = useThemeStore();
  const [modalOpen, setModalOpen] = useState(false); // disable (outside-click +or+ on re-render) closing

  const { Modal: SettingsModal, ModalTrigger: SettingsModalTrigger } =
    createModal("user-settings", "settings", modalOpen, setModalOpen);

  return (
    <div className="navbar sticky top-0 z-50 bg-base-300">
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
                  Profile
                </Link>
              </li>
              <li>
                <SettingsModalTrigger onClick={() => setModalOpen(true)} />
              </li>
              <li>
                <button onClick={() => void signOut()}>Logout</button>
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
      {hydrated && (
        <SettingsModal>
          <p className="text-bold text-xl text-primary">Settings</p>
          <div className="modal-body p-4">
            <p className="text-accent">Theme</p>
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
          </div>
        </SettingsModal>
      )}
    </div>
  );
};
