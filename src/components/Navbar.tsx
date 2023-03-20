import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export const Navbar: React.FC = () => {
  const { data: session } = useSession();

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown-hover dropdown">
          <Link
            href="/"
            className="btn-ghost btn m-1 bg-gradient-to-r from-[#95FFFF] via-[#9C99FF] to-[#FD5DAD] bg-clip-text text-2xl normal-case text-transparent hover:bg-clip-padding hover:text-black"
          >
            Abdulleziz Corp.
          </Link>
          <ul className="dropdown-content menu rounded-box w-52 bg-base-100 p-2">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/forum">Forum</Link>
            </li>
            <li>
              <a>CEO Panel (linki yok D:)</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="navbar-center"></div>
      <div className="navbar-end flex-none gap-2">
        <div className="dropdown  ">
          <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
            <div className="w-10 rounded-full">
              {!!session?.user.image && <img src={session.user.image} />}
            </div>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 bg-gray-700 p-2 shadow"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <button onClick={() => void signOut()}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
