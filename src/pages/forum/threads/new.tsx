import classNames from "classnames";
import type { NextPage } from "next";
import Link from "next/link";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Layout } from "~/components/Layout";
import { useCreateForumThread } from "~/utils/useForum";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHydrated } from "~/pages/_app";

import { Mention, type MentionItem, MentionsInput } from "react-mentions";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";

type CreateThreadOptionsStore = {
  notify: boolean;
  setNotify: (notify: boolean) => void;
};

const createThreadOptionsDefault = {
  notify: true,
} as const satisfies Partial<CreateThreadOptionsStore>;

const useCreateThreadOptionsStore = create<CreateThreadOptionsStore>()(
  persist(
    (set) => ({
      ...createThreadOptionsDefault,
      setNotify: (notify) => set({ notify }),
    }),
    { name: "create-thread-options" }
  )
);

const NewThread: NextPage = () => {
  return (
    <Layout>
      <div className="flex min-h-screen flex-col items-center justify-center pb-32">
        <div className="flex w-full flex-1 flex-col items-center  text-center">
          <CreateThread />
        </div>
      </div>
    </Layout>
  );
};

const CreateThread: NextPage = () => {
  const [tags, setTags] = useState(new Set<string>());
  const [mentions, setMentions] = useState<MentionItem[]>();
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const createThread = useCreateForumThread();
  const notifyStore = useCreateThreadOptionsStore();
  const hydrated = useHydrated();
  const users = (useGetAbdullezizUsers().data ?? []).filter((m) => !m.user.bot);

  const tagRef =
    useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;

  const handlePublish = () =>
    createThread.mutate({
      tags: [...tags],
      title,
      message: content,
      mentions: mentions?.map((mention) => mention.id),
      notify: notifyStore.notify,
    });

  return (
    <>
      <h1 className="mt-10 p-4 text-sm font-bold tracking-tight text-white md:text-2xl ">
        Yeni Thread
      </h1>
      <div className="title-div justify-centerp-4 mt-8 flex w-full flex-col items-center md:w-6/12">
        <input
          type="text"
          placeholder="Başlık..."
          className={
            title
              ? "input-success input w-full transition-all"
              : "input-error input w-full transition-all"
          }
          defaultValue={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <MentionsInput
          placeholder="İlk Mesaj..."
          className={classNames(
            "mt-4 h-14 w-full rounded border transition-all",
            title
              ? "input-success focus:border-success"
              : "input-error focus:border-error"
          )}
          value={content}
          onChange={(event, _newValue, _newPlainTextValue, mentions) => {
            setContent(event.target.value);
            setMentions(mentions);
          }}
        >
          <Mention
            trigger="@"
            data={users.map((member) => ({
              id: member.user.id,
              display: member.nick ? member.nick : member.user.username,
            }))}
            className="bg-accent text-black"
          />
        </MentionsInput>
        {/*<input
          type="text"
          placeholder="İlk Mesaj..."
          className={classNames(
            "input mt-4 w-full transition-all",
            title ? "input-success" : "input-error"
          )}
          defaultValue={content}
          onChange={(e) => setContent(e.target.value)}
        />*/}
      </div>

      <div>
        <div className="mt-4 flex items-center justify-center">
          <input
            type="checkbox"
            className="checkbox-primary checkbox"
            checked={
              hydrated ? notifyStore.notify : createThreadOptionsDefault.notify
            }
            onChange={(e) => notifyStore.setNotify(e.target.checked)}
          />
          <span className="ml-2 text-white">Herkese bildirim gönder</span>
        </div>
      </div>

      <div className="form-control">
        <div className="input-group flex min-w-full flex-row items-center justify-center p-4">
          <input
            ref={tagRef}
            type="text"
            placeholder="Tag…"
            className="input-bordered input min-w-full transition-all"
          />

          <button
            className="btn-square btn"
            onClick={() => {
              if (tagRef.current.value === "") return;
              flushSync(() => {
                setTags((old) => new Set([...old, tagRef.current.value]));
              });
              tagRef.current.value = "";
            }}
          >
            +
          </button>
        </div>
        <div
          className={`mb-3 cursor-pointer rounded-lg ${
            tags.size ? "bg-base-100" : "bg-base-300"
          }  p-2`}
        >
          {[...tags].map((tag) => (
            <div
              key={tag}
              className=" badge-primary badge m-1 p-4 transition-all hover:scale-105 hover:bg-error"
              onClick={() => {
                setTags((old) => new Set([...old].filter((t) => tag !== t)));
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>

      {createThread.isSuccess ? (
        <Link
          className="btn-success btn"
          href={`/forum/threads/${createThread.data.id}`}
        >
          Paylaşıldı! Gitmek için tıkla.
        </Link>
      ) : (
        <button
          className={classNames("btn-primary btn", {
            loading: createThread.isLoading,
          })}
          onClick={handlePublish}
          disabled={createThread.isLoading}
        >
          {createThread.isIdle && "Paylaş"}
          {createThread.isSuccess && "Paylaşıldı!"}
          {createThread.isError && "Paylaşırken bir hata oluştu."}
        </button>
      )}
    </>
  );
};

export default NewThread;
