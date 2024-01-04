import { signIn, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { api } from "~/utils/api";

export const WelcomeComponent: React.FC = () => {
  const message = api.forum.memes.random.useQuery();

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-20">
      <div
        className="cursor-default transition-all hover:rotate-2 hover:scale-125"
        onClick={() => void message.refetch()}
      >
        <h1 className="bg-gradient-to-r from-[#95FFFF] via-[#9C99FF] to-[#FD5DAD] bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-[5rem]">
          Abdulleziz Corp.
        </h1>
        {message.data && (
          <h2 className="bg-gradient-to-r from-[#95FFFF] via-[#9C99FF] to-[#FD5DAD] bg-clip-text text-2xl font-extrabold text-transparent">
            {message.data.name}: {message.data.description}
          </h2>
        )}
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
        <Button
          isLoading={status === "loading"}
          disabled={status === "loading"}
          onClick={() => void signIn("discord")}
        >
          Giriş Yap
        </Button>
      )}
    </div>
  );
};
