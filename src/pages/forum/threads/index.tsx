import type { ForumPin } from "@prisma/client";
import classNames from "classnames";
import type { NextPage } from "next";
import Link from "next/link";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import {
  useCreateForumPin,
  useDeleteForumPin,
  useGetForumThreads,
} from "~/utils/useForum";

const Threads: NextPage = () => {
  const threads = useGetForumThreads();

  const currentUser = useGetAbdullezizUser();
  const createPin = useCreateForumPin();
  const deletePin = useDeleteForumPin();
  const canPin =
    currentUser.data?.perms.includes("forum thread pinle") ?? false;

  const sortByPin = (a: ForumPin | null, b: ForumPin | null) => {
    // threads with pins first
    if (a && !b) return -1;
    if (!a && b) return 1;
    return 0;
  };

  return (
    <div className="flex flex-col justify-center p-10">
      <h1 className="rounded-t bg-base-100 p-2 text-2xl text-white">
        Threadler
      </h1>
      {threads.isLoading && (
        <p className="animate-pulse p-4 text-lg">Yükleniyor...</p>
      )}
      {threads.isError && <p className="text-error">Hata!</p>}
      {threads.data && (
        <ul>
          {threads.data
            .sort((a, b) => sortByPin(a.pin, b.pin))
            .map((thread) => (
              <div key={thread.id}>
                <li className="bg-base-200 transition-all hover:bg-base-300">
                  <Link href={`/forum/threads/${thread.id}`}>
                    <div className="p-3">
                      {!!thread.pin && (
                        <span>Pined by {thread.pin.pinnedBy.name}</span>
                      )}
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
                        <div className="ml-auto flex items-center justify-center gap-4 text-sm">
                          {canPin && (
                            <>
                              {!thread.pin ? (
                                <button
                                  onClick={() => createPin.mutate(thread.id)}
                                  className={classNames(
                                    "btn-accent btn-sm btn",
                                    { loading: createPin.isLoading }
                                  )}
                                >
                                  Pinle!
                                </button>
                              ) : (
                                <button
                                  onClick={() => deletePin.mutate(thread.id)}
                                  className={classNames(
                                    "btn-error btn-sm btn",
                                    { loading: deletePin.isLoading }
                                  )}
                                >
                                  Pin{"'"}i Kaldır!
                                </button>
                              )}
                            </>
                          )}
                          <p>
                            Oluşturulma: {thread.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
                <div className="divider m-0 bg-base-200" />
              </div>
            ))}
        </ul>
      )}
    </div>
  );
};

export default Threads;
