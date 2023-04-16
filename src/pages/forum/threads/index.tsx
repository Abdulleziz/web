import type { ForumPin } from "@prisma/client";
import classNames from "classnames";
import type { NextPage } from "next";
import Image from "next/image";
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
                <li className=" relative bg-base-200 transition-all hover:bg-base-300">
                  <Link href={`/forum/threads/${thread.id}`}>
                    <div className="p-3">
                      {!!thread.pin && (
                        <span>Pinned by {thread.pin.pinnedBy.name}</span>
                      )}
                      <h4 className="text-lg text-white">{thread.title}</h4>
                      <div className="flex flex-row items-center py-2">
                        {thread.creator.image && (
                          <Image
                            alt="Profile Image"
                            src={thread.creator.image}
                            className="w-8 rounded-full"
                            width={128}
                            height={128}
                          />
                        )}
                        <p className="px-2">{thread.creator.name}</p>
                        <div className="ml-auto flex items-center justify-center gap-4 text-sm">
                          <p>
                            Oluşturuldu: {thread.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {canPin && (
                    <div className="absolute top-3 right-3">
                      {!thread.pin ? (
                        <button
                          onClick={() => createPin.mutate(thread.id)}
                          className={classNames(
                            "btn-accent btn-sm btn rounded-full",
                            {
                              loading: createPin.isLoading,
                              disabled: createPin.isLoading,
                            }
                          )}
                        >
                          <PinSVG />
                        </button>
                      ) : (
                        <button
                          onClick={() => deletePin.mutate(thread.id)}
                          className={classNames(
                            "btn-error btn-sm btn rounded-full",
                            {
                              loading: deletePin.isLoading,
                              disabled: createPin.isLoading,
                            }
                          )}
                        >
                          <UnpinSVG />
                        </button>
                      )}
                    </div>
                  )}
                </li>
                <div className="divider m-0 bg-base-200" />
              </div>
            ))}
        </ul>
      )}
    </div>
  );
};

export const PinSVG: React.FC = () => {
  return (
    <>
      <svg
        width="30px"
        height="30px"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.579 14.579L11.6316 17.5264L10.7683 16.6631C10.3775 16.2723 10.1579 15.7422 10.1579 15.1894V13.1053L7.21052 10.158L5 9.42111L9.42111 5L10.158 7.21052L13.1053 10.1579L15.1894 10.1579C15.7422 10.1579 16.2722 10.3775 16.6631 10.7683L17.5264 11.6316L14.579 14.579ZM14.579 14.579L19 19"
          stroke="#464455"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </>
  );
};

export const UnpinSVG: React.FC = () => {
  return (
    <>
      <svg
        width="30px"
        height="30px"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.579 14.579L11.6316 17.5264L11.0526 16.9474M14.579 14.579L17.5264 11.6316L16.9474 11.0526M14.579 14.579L19 19M5 19L10.1579 13.8421M19 5L13.8421 10.1579M13.8421 10.1579L13.1053 10.1579L10.158 7.21052L9.42111 5L5 9.42111L7.21052 10.158L10.1579 13.1053V13.8421M13.8421 10.1579L10.1579 13.8421"
          stroke="#464455"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </>
  );
};

export default Threads;
