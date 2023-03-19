
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";


import { api } from "~/utils/api";

const Home: NextPage = () => {
  const member = api.discord.getAbdullezizMember.useQuery();
  const allRoles = api.discord.getAbdullezizRoles.useQuery()

  const removeRole = api.discord.role.removeAbdullezizRole.useMutation({
    onSettled: async () => {
      // when user removes a role, we need to refetch the roles to stay up to date
      await member.refetch();
    },
  });

  const addRole = api.discord.role.addAbdullezizRole.useMutation({
    onSettled: async () => {
      // when user adds a role, we need to refetch the roles to stay up to date
      await member.refetch();
    }
  })

  

  

  return (
    <>
    <Navbar />
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
              {member.isLoading ? (
                <p>Loading Abdulleziz Employee data...</p>
              ) : (
                <div>
                  <div className="container flex flex-col gap-4 p-4">
                    <p>
                      has {member.data?.roles.length ?? 0} roles in Abdulleziz
                      Corp.
                    </p>
                  </div>
                  <div className=" dropdown dropdown-left dropdown-end gap-2 ">
                    <label tabIndex={0} className={"btn m-1"}>Select a role to add</label>
                    <ul id="roles" tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                      {allRoles.data?.roles.map(role => (
                         <li key={role.id} value={role.id} ><a onClick={()=>addRole.mutate(role.id)} >{role.name}</a></li> 
                      ))}
                    </ul>
                  </div>
                  <div className="divider"></div> 
                  <div className="flex flex-col items-start gap-2">
                    {member.data?.roles.map((role) => (
                      <div key={role.id} className="flex flex-row gap-4">
                        <p style={{ color: `#${role.color.toString(16)}` }}>
                          {role.allah ? "[Allah!]" : <>[#{role.position}]</>}{" "}
                          Role name: {role.name}
                        </p>

                        <button
                          className="btn-error btn-sm btn rounded-3xl"
                          disabled={
                            removeRole.isLoading ||
                            removeRole.isError ||
                            role.allah
                          }
                          onClick={() => removeRole.mutate(role.id)}
                        >
                          Remove Role
                        </button>
                      </div>
                    ))}
                    {removeRole.isError && (
                      <div>
                        <p className="text-red-500">
                          Cannot remove role: {removeRole.error?.message}
                        </p>
                        <button
                          className="btn-error btn-sm btn rounded-3xl"
                          onClick={() => removeRole.reset()}
                        >
                          Ok, I understand
                        </button>
                      </div>
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

const Navbar: React.FC = () => {
  const { data: session } = useSession();
  
  return(
        <>
        <div className="navbar bg-base-100">
  <div className="navbar-start">
    <div className="dropdown">
      <label tabIndex={0} className="btn btn-ghost btn-circle">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
      </label>
      <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
        <li><a>Role Editor</a></li>
      </ul>
    </div>
  </div>
  <div className="navbar-center">
    <Link href="/" className="capitalize btn btn-ghost text-2xl font-bold tracking-tight text-white sm:text-[5rem]l" >Abdulleziz Corp.</Link>
  </div>
  <div className="navbar-end">
    <div className="dropdown dropdown-end">
      {session ? (<><label tabIndex={0} className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full">
          <img alt="Profile Photo" src={session?.user.image} />
        </div>
      </label>
      <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
        <li><a onClick={() => void signOut()} >Sign Out</a></li>
      </ul></>) : (<button
        className="capitalize btn rounded-md bg-gray-800 px-4 py-2 text-lg font-semibold text-white"
        onClick={() => void signIn("discord")}
      >
        Sign in
      </button>)}
    </div>
  </div>
</div>
        </>)
};

export default Home;
