import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const member = api.discord.getAbdullezizMember.useQuery();

  const removeRole = api.discord.role.removeAbdullezizRole.useMutation({
    onSettled: async () => {
      // when user removes a role, we need to refetch the roles to stay up to date
      await member.refetch();
    },
  });

  return (
    <>
      <Head>
        <title>Abdulleziz Corp.</title>
        <meta name="description" content="Abdulleziz Corp." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className="flex min-h-screen flex-col items-center justify-center bg-base-100"
        data-theme="black"
      >
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Abdulleziz Corp.
          </h1>
          <h2 className="text-2xl font-extrabold text-white">Early Alpha</h2>

          <SignComponent />

          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl text-white">
              {!member.data ? (
                <p>Loading Abdulleziz Employee data...</p>
              ) : (
                <div>
                  <div className="container flex flex-col gap-4 p-4">
                    <p>
                      has {member.data.roles.length} roles in Abdulleziz Corp.
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    {member.data.roles.map((role) => (
                      <div key={role} className="flex flex-row gap-4">
                        <p>Role ID: {role}</p>
                        <button
                          className="btn-error btn-sm btn rounded-3xl"
                          disabled={removeRole.isLoading || removeRole.isError}
                          onClick={() => removeRole.mutate(role)}
                        >
                          Remove Role
                        </button>
                      </div>
                    ))}
                    {removeRole.isError && (
                      <p className="text-red-500">
                        Cannot remove role: {removeRole.error?.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

const SignComponent: React.FC = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl text-white">Signed in as {session.user.name}</p>
        <button
          className="rounded-md bg-gray-800 px-4 py-2 text-lg font-semibold text-white"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-2xl text-white">Not signed in</p>
      <button
        className="rounded-md bg-gray-800 px-4 py-2 text-lg font-semibold text-white"
        onClick={() => void signIn("discord")}
      >
        Sign in
      </button>
    </div>
  );
};

export default Home;
