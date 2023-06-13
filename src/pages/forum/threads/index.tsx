import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { ForumPin } from "@prisma/client";
import classNames from "classnames";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { useNotificationStage } from "~/lib/pusher/notifications";
import type { RouterOutputs } from "~/utils/api";
import { createModal } from "~/utils/modal";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import {
  useCreateForumPin,
  useDeleteForumPin,
  useDeleteForumThread,
  useGetForumThreads,
  useGetUserNotification,
  usePrefetchThreads,
  useSetForumUserNotification,
} from "~/utils/useForum";

type Thread = RouterOutputs["forum"]["getThreads"][number];

const Threads: NextPage = () => {
  const threads = useGetForumThreads();
  const prefecth = usePrefetchThreads();
  const [threadRef] = useAutoAnimate();
  const [threadItemsRef] = useAutoAnimate();

  useEffect(() => {
    if (threads.data) prefecth(threads.data);
  }, [prefecth, threads.data]);

  const currentUser = useGetAbdullezizUser();

  const canMute = useNotificationStage() === "granted";
  const canPin =
    currentUser.data?.perms.includes("forum thread pinle") ?? false;
  const canDelete =
    currentUser.data?.perms.includes("forum thread sil") ?? false;

  const sortByPin = (a: ForumPin | null, b: ForumPin | null) => {
    // threads with pins first
    if (a && !b) return -1;
    if (!a && b) return 1;
    return 0;
  };

  return (
    <div className="flex flex-col justify-center p-10" ref={threadRef}>
      <h1 className="rounded-t bg-base-100 p-2 text-2xl text-white">
        Threadler
      </h1>
      {threads.isLoading && (
        <p className="animate-pulse p-4 text-lg">Yükleniyor...</p>
      )}
      {threads.isError && <p className="text-error">Hata!</p>}
      {threads.data && (
        <ul ref={threadItemsRef}>
          {threads.data
            .sort((a, b) => sortByPin(a.pin, b.pin))
            .map((thread) => (
              <div
                key={thread.id}
                className="relative bg-base-200 transition-all hover:bg-base-300"
              >
                <Link href={`/forum/threads/${thread.id}`}>
                  <div className="p-3">
                    {!!thread.pin && (
                      <span>Pinned by {thread.pin.pinnedBy.name}</span>
                    )}
                    <div
                      className="group flex overflow-auto"
                      data-size={thread.title.length > 50 ? "long" : "short"}
                    >
                      <p className="text-ellipsis text-lg text-white">
                        {thread.title.slice(0, 50)}
                      </p>
                      <span className="text-secondary group-data-[size=short]:hidden">
                        ...
                      </span>
                    </div>
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
                        <p>Oluşturuldu: {thread.createdAt.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="absolute top-3 right-3 flex items-center justify-center gap-1 md:gap-2">
                  {canPin && <PinThread thread={thread} />}
                  {canMute && <MuteThread thread={thread} />}
                  {canDelete && <DeleteThread threadId={thread.id} />}
                </div>
                <div className="divider m-0 bg-base-200" />
              </div>
            ))}
        </ul>
      )}
    </div>
  );
};

const DeleteThread = ({ threadId }: { threadId: Thread["id"] }) => {
  const deleteThread = useDeleteForumThread();

  return (
    <button
      onClick={() => deleteThread.mutate(threadId)}
      className={classNames("btn-error btn-sm btn rounded-full", {
        loading: deleteThread.isLoading,
        disabled: deleteThread.isLoading,
      })}
    >
      <DeleteSVG />
    </button>
  );
};

const PinThread = ({ thread }: { thread: Thread }) => {
  const createPin = useCreateForumPin();
  const deletePin = useDeleteForumPin();

  if (!thread.pin)
    return (
      <button
        onClick={() => createPin.mutate(thread.id)}
        className={classNames("btn-info btn-sm btn rounded-full", {
          loading: createPin.isLoading,
          disabled: createPin.isLoading,
        })}
      >
        <PinSVG />
      </button>
    );

  return (
    <button
      onClick={() => deletePin.mutate(thread.id)}
      className={classNames("btn-accent btn-sm btn rounded-full", {
        loading: deletePin.isLoading,
        disabled: createPin.isLoading,
      })}
    >
      <UnpinSVG />
    </button>
  );
};

const MuteThread = ({ thread }: { thread: Thread }) => {
  const options = {
    all: {
      order: 2,
      name: "Bildirimler Açık",
      svg: <UnmutedSVG />,
    },
    mentions: {
      order: 1,
      name: "Sadece Bahsetmeler",
      svg: <PartialMutedSVG />,
    },
    none: {
      order: 0,
      name: "Bildirimler Kapalı",
      svg: <MutedSVG />,
    },
  };

  const setNotif = useSetForumUserNotification();
  const userNotify = useGetUserNotification().data?.defaultThreadNotify;
  const state = thread.notifications[0]?.preference;
  const getBestFallback = () => {
    // ugly but works
    // TODO: refactor for backend use
    const [threadN, userN] = [
      { type: "thread", pref: thread.defaultNotify },
      { type: "user", pref: userNotify },
    ] as const;

    if (userN.pref) {
      return options[threadN.pref].order < options[userN.pref].order
        ? threadN
        : { ...userN, pref: userN.pref };
    }
    return threadN;
  };
  const fallback = getBestFallback();
  const svg = options[state || fallback.pref].svg;
  const { Modal, ModalTrigger } = createModal(
    `mute-thread-${thread.id}-modal`,
    svg
  );
  return (
    <>
      <ModalTrigger className="btn-sm btn rounded-full" />
      <Modal>
        <div className="modal-middle">
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Bildirimler Açık</span>
              <input
                type="radio"
                className="radio checked:bg-primary"
                defaultChecked={state === "all"}
                onClick={(e) => {
                  e.preventDefault();
                  setNotif.mutate({ threadId: thread.id, preference: "all" });
                  return;
                }}
              />
            </label>
            <label className="label cursor-pointer">
              <span className="label-text">Sadece Bahsetmeler</span>
              <input
                type="radio"
                className="radio checked:bg-secondary"
                defaultChecked={state === "mentions"}
                onClick={(e) => {
                  e.preventDefault();
                  setNotif.mutate({
                    threadId: thread.id,
                    preference: "mentions",
                  });
                  return;
                }}
              />
            </label>
            <label className="label cursor-pointer">
              <span className="label-text">Sustur</span>
              <input
                type="radio"
                className="radio checked:bg-accent"
                defaultChecked={state === "none"}
                onClick={(e) => {
                  e.preventDefault();
                  setNotif.mutate({ threadId: thread.id, preference: "none" });
                  return;
                }}
              />
            </label>
            <button
              disabled={!state}
              className={classNames("btn-primary btn-sm btn mt-4", {
                ["loading"]: setNotif.isLoading,
              })}
              onClick={() => setNotif.mutate({ threadId: thread.id })}
            >
              Sil
            </button>
            {!state && (
              <p className="mt-2 text-xs text-primary">
                Otomatik {fallback.type === "user" ? "Kullanıcı" : "Thread"}{" "}
                Ayarı: {options[fallback.pref].name}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export const DeleteSVG: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
};

export const MutedSVG: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53"
      />
    </svg>
  );
};
export const UnmutedSVG: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0a8.969 8.969 0 012.168 4.5"
      />
    </svg>
  );
};
export const PartialMutedSVG: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M10.5 8.25h3l-3 4.5h3"
      />
    </svg>
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
          strokeLinecap="round"
          strokeLinejoin="round"
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
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

export default Threads;
