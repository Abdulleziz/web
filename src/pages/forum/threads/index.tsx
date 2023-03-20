import type { NextPage } from "next";
import Link from "next/link";
import { useGetForumThreads } from "~/utils/useForum";

const Threads: NextPage = () => {
  const threads = useGetForumThreads();

  return (
    <div className="flex flex-col justify-center p-10">
      <h1 className="rounded-t bg-gray-700 p-2 text-2xl text-white">Threads</h1>
      {threads.isLoading && <p>Yükleniyor...</p>}
      {threads.isError && <p className="text-error">Hata!</p>}
      {threads.data && (
        <ul>
          {threads.data.map((thread) => (
            <li key={thread.id} className="bg-gray-800">
              <Link href={`/forum/threads/${thread.id}`}>
                <div className=" p-3">
                  <h4 className="text-lg text-white">{thread.title}</h4>
                  <div className="flex flex-row items-center py-2">
                    {thread.creator.image && (
                      <img
                        alt="Profile Image"
                        src={thread.creator.image}
                        className="w-8 rounded-full"
                      />
                    )}
                    <p className="px-2">{thread.creator.name}</p>
                    <div className="ml-auto text-sm ">
                      <p>Created at: {thread.createdAt.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="divider m-0"></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Threads;
