import classNames from "classnames";
import { signIn, useSession } from "next-auth/react";

export const WelcomeComponent: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-12 py-20">
      <div className="cursor-default transition-all hover:scale-125">
        <h1 className="bg-gradient-to-r from-[#95FFFF] via-[#9C99FF] to-[#FD5DAD] bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-[5rem]">
          Abdulleziz Corp.
        </h1>
        <h2 className="bg-gradient-to-r from-[#95FFFF] via-[#9C99FF] to-[#FD5DAD] bg-clip-text text-2xl font-extrabold text-transparent">
          Early Alpha
        </h2>
      </div>
      <SignComponent />
    </div>
  );
};

export const SignComponent: React.FC = () => {
  const { data: session, status } = useSession();

  return (
    <div className="flex flex-col items-center gap-2">
      {status !== "loading" && (
        <p className="text-2xl text-white">
          {!!session ? (
            <>Hoş Geldin {session.user.name}</>
          ) : (
            <>Lütfen giriş yap</>
          )}
        </p>
      )}
      {session ? (
        <></>
      ) : (
        <button
          className={classNames("btn-primary btn", {
            ["loading"]: status === "loading",
          })}
          disabled={status === "loading"}
          onClick={() => void signIn("discord")}
        >
          Giriş Yap
        </button>
      )}
    </div>
  );
};
