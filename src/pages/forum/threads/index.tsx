import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { ForumPin } from "@prisma/client";
import classNames from "classnames";
import {
  BellOff,
  BellRing,
  MessageSquare,
  Pin,
  PinOff,
  Trash,
} from "lucide-react";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardHeader } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
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
    <Card className="flex flex-col justify-center p-10" ref={threadRef}>
      <CardHeader>Threadler</CardHeader>
      {threads.isLoading && (
        <p className="animate-pulse p-4 text-lg">Yükleniyor...</p>
      )}
      {threads.isError && <p className="text-error">Hata!</p>}
      {threads.data && (
        <ul ref={threadItemsRef}>
          {threads.data
            .sort((a, b) => sortByPin(a.pin, b.pin))
            .map((thread) => (
              <Card
                key={thread.id}
                className="relative transition-all hover:bg-base-300"
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

                <div className="absolute right-3 top-3 flex items-center justify-center gap-1 md:gap-2">
                  {canPin && <PinThread thread={thread} />}
                  {canMute && <MuteThread thread={thread} />}
                  {canDelete && <DeleteThread threadId={thread.id} />}
                </div>
                <div className="divider m-0" />
              </Card>
            ))}
        </ul>
      )}
    </Card>
  );
};

const DeleteThread = ({ threadId }: { threadId: Thread["id"] }) => {
  const deleteThread = useDeleteForumThread();

  return (
    <Button
      onClick={() => deleteThread.mutate(threadId)}
      variant="destructive"
      size="sm"
      isLoading={deleteThread.isLoading}
      disabled={deleteThread.isLoading}
    >
      <Trash className="h-5 w-5" />
    </Button>
  );
};

const PinThread = ({ thread }: { thread: Thread }) => {
  const createPin = useCreateForumPin();
  const deletePin = useDeleteForumPin();

  if (!thread.pin)
    return (
      <Button
        onClick={() => createPin.mutate(thread.id)}
        size="sm"
        variant="outline"
        isLoading={createPin.isLoading}
        disabled={createPin.isLoading}
      >
        <Pin className="h-5 w-5" />
      </Button>
    );

  return (
    <Button
      onClick={() => deletePin.mutate(thread.id)}
      size="sm"
      isLoading={deletePin.isLoading}
      disabled={deletePin.isLoading}
    >
      <PinOff className="h-5 w-5" />
    </Button>
  );
};

const MuteThread = ({ thread }: { thread: Thread }) => {
  const options = {
    all: {
      order: 2,
      name: "Bildirimler Açık",
      svg: <BellRing className="h-5 w-5" />,
    },
    mentions: {
      order: 1,
      name: "Sadece Bahsetmeler",
      svg: <MessageSquare className="h-5 w-5" />,
    },
    none: {
      order: 0,
      name: "Bildirimler Kapalı",
      svg: <BellOff className="h-5 w-5" />,
    },
  };

  const setNotif = useSetForumUserNotification();
  const userNotify = useGetUserNotification().data;
  const state = thread.notifications[0]?.preference;
  const getBestFallback = () => {
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
  const { Modal } = createModal(`mute-thread-${thread.id}-modal`, svg);
  return (
    <>
      <Button size="sm" variant="secondary">
        <Label htmlFor={`mute-thread-${thread.id}-modal`}>{svg}</Label>
      </Button>
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
              className={classNames("btn btn-primary btn-sm mt-4", {
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

export default Threads;
