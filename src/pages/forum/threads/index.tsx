import { useAutoAnimate } from "@formkit/auto-animate/react";
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

const groupByDate = (threads: Thread[]) => {
  const grouped = threads.reduce((acc, thread) => {
    const date = thread.createdAt.toLocaleString("tr-TR", {
      month: "long",
      year: "numeric",
    });
    const current = acc[date] ?? [];
    return { ...acc, [date]: [...current, thread] };
  }, {} as Record<string, Thread[]>);

  return Object.entries(grouped).map(([date, threads]) => ({
    date,
    threads,
  }));
};

const Threads: NextPage = () => {
  const prefecth = usePrefetchThreads();
  const [threadRef] = useAutoAnimate();
  const threads = useGetForumThreads(undefined, {
    select(data) {
      const pins: Thread[] = [];
      const nonPins: Thread[] = [];
      data
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .forEach((thread) => {
          if (thread.pin) pins.push(thread);
          else nonPins.push(thread);
        });
      return { pins, nonPins };
    },
  });

  useEffect(() => {
    if (threads.data) prefecth(threads.data.nonPins.concat(threads.data.pins));
  }, [prefecth, threads.data]);

  const currentUser = useGetAbdullezizUser();

  const canMute = typeof window !== "undefined" && "Notification" in window;
  const canPin =
    currentUser.data?.perms.includes("forum thread pinle") ?? false;
  const canDelete =
    currentUser.data?.perms.includes("forum thread sil") ?? false;

  return (
    <Card className="flex flex-col justify-center p-10" ref={threadRef}>
      <CardHeader>Threadler</CardHeader>
      {threads.isLoading && (
        <p className="animate-pulse p-4 text-lg">Yükleniyor...</p>
      )}
      {threads.isError && <p className="text-error">Hata!</p>}
      {threads.data && (
        <>
          {!!threads.data.pins.length && (
            <div>
              <h1 className="p-4 text-center text-2xl">Pinler</h1>
              <ul>
                {threads.data.pins.map((thread) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    canDelete={canDelete}
                    canMute={canMute}
                    canPin={canPin}
                  />
                ))}
              </ul>
            </div>
          )}
          {groupByDate(threads.data.nonPins).map(({ date, threads }) => (
            <div key={date}>
              <h1 className="p-4 text-center text-2xl">{date}</h1>
              <ul>
                {threads.map((thread) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    canDelete={canDelete}
                    canMute={canMute}
                    canPin={canPin}
                  />
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </Card>
  );
};

const ThreadRow = ({
  thread,
  canDelete,
  canMute,
  canPin,
}: {
  thread: Thread;
  canPin: boolean;
  canMute: boolean;
  canDelete: boolean;
}) => {
  return (
    <Card key={thread.id} className="relative transition-all hover:bg-base-300">
      <Link href={`/forum/threads/${thread.id}`}>
        <div className="p-3">
          {!!thread.pin && <span>Pinned by {thread.pin.pinnedBy.name}</span>}
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
              <p>{thread.createdAt.toLocaleString("tr-TR")}</p>
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 flex items-center justify-center gap-1 md:gap-2">
        {canPin && <PinThread thread={thread} />}
        {canMute && <MuteThread thread={thread} />}
        {canDelete && <DeleteThread threadId={thread.id} />}
      </div>
      <div className="flex items-center justify-center">
        {thread.tags.slice(0, 4).map(({ tag }) => (
          <div
            key={tag.id}
            className={classNames(
              "mr-2 rounded-full px-2 py-1 text-xs dark:text-zinc-300"
            )}
          >
            #{tag.name.slice(0, 10)}
          </div>
        ))}
      </div>
      <div className="divider m-0" />
    </Card>
  );
};

const DeleteThread = ({ threadId }: { threadId: Thread["id"] }) => {
  const deleteThread = useDeleteForumThread();

  return (
    <Button
      onClick={() => deleteThread.mutate(threadId)}
      variant="destructive"
      size="relative-sm"
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
        size="relative-sm"
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
      size="relative-sm"
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
      <Button size="relative-sm" variant="secondary">
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
