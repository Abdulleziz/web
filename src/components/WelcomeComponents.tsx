import { signIn, signOut, useSession } from "next-auth/react";

export const WelcomeComponent: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-12 px-4 py-16">
      <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
        Abdulleziz Corp.
      </h1>
      <h2 className="text-2xl font-extrabold text-white">Early Alpha</h2>

      <SignComponent />
    </div>
  );
};

export const SignComponent: React.FC = () => {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-2xl text-white">
        {!!session ? <>Signed in as {session.user.name}</> : <>Not Signed in</>}
      </p>
      <button
        className="btn-primary btn"
        onClick={() => (!!session ? void signOut() : void signIn("discord"))}
      >
        {!!session ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
