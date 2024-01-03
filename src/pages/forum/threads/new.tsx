import classNames from "classnames";
import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Layout } from "~/components/Layout";
import { useCreateForumThread } from "~/utils/useForum";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useHydrated } from "~/pages/_app";

import { Mention, MentionsInput } from "react-mentions";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { formatName } from "~/utils/abdulleziz";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage } from "~/components/ui/avatar";

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
  const [mentions, setMentions] = useState(new Set<string>());
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const createThread = useCreateForumThread();
  const notifyStore = useCreateThreadOptionsStore();
  const abdullezizUsers = useGetAbdullezizUsers();
  const hydrated = useHydrated();

  const users = (abdullezizUsers.data ?? []).filter(
    (m) => !m.user.bot && m.id !== undefined
  );
  const tagRef =
    useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;

  const handlePublish = () =>
    createThread.mutate({
      tags: [...tags],
      title,
      message: content,
      mentions: [...mentions],
      notify: notifyStore.notify,
    });
  //TODO: MentionsInput component çok yazı yazılınca uzuo
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Yeni Thread</CardTitle>
        </CardHeader>
        <CardContent className="flex max-w-full flex-col items-start justify-center gap-3">
          <Label htmlFor="title-input">Başlık</Label>
          <Input
            id="title-input"
            type="text"
            defaultValue={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Label htmlFor="mentions-input">İlk Mesaj</Label>

          <MentionsInput
            id="mentions-input"
            className="h-10 w-full max-w-full  rounded-md  border border-zinc-200 bg-white   text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
            value={content}
            onChange={(event, _v, _t, mentions) => {
              setContent(event.target.value);
              setMentions((m) => new Set([...m, ...mentions.map((m) => m.id)]));
            }}
          >
            <Mention
              trigger="@"
              className="rounded bg-zinc-800"
              isLoading={abdullezizUsers.isLoading}
              displayTransform={(_id, display) => "@" + display}
              data={users.map((member) => ({
                id: member.id ?? "",
                display: formatName(member),
              }))}
              renderSuggestion={(suggest, _search, display) => {
                const u = users.find((u) => suggest.id === u.id);
                const image = u ? getAvatarUrl(u.user) : undefined;
                return (
                  <div className=" flex flex-row items-center justify-start bg-zinc-950 p-2 hover:bg-zinc-800">
                    {image && (
                      <Avatar>
                        <AvatarImage src={image} />
                      </Avatar>
                    )}
                    <span className="ml-2">{display}</span>
                  </div>
                );
              }}
            />
          </MentionsInput>

          <div className=" flex flex-row items-center justify-center gap-3">
            <Checkbox id="terms1" />
            <div className="flex flex-col items-start">
              <label
                htmlFor="terms1"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Herkese bildirim gönder
              </label>
              <p className="text-sm text-muted-foreground">
                Yeni thread oluşturulduğu zaman herkese bildirim gönderir.
              </p>
            </div>
          </div>

          <div className="input-group flex min-w-full flex-row items-center justify-center">
            <Input ref={tagRef} type="text" placeholder="Tag…" />

            <Button
              onClick={() => {
                if (tagRef.current.value === "") return;
                flushSync(() => {
                  setTags((old) => new Set([...old, tagRef.current.value]));
                });
                tagRef.current.value = "";
              }}
            >
              +
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[...tags].map((tag) => (
              <Badge
                key={tag}
                onClick={() => {
                  setTags((old) => new Set([...old].filter((t) => tag !== t)));
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {createThread.isSuccess ? (
            <Link href={`/forum/threads/${createThread.data.id}`}>
              <Button variant={"warning"}>
                Paylaşıldı! Gitmek için tıkla.
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={createThread.isLoading}
              isLoading={createThread.isLoading}
            >
              {createThread.isIdle && "Paylaş"}
              {createThread.isLoading && "Paylaş"}
              {createThread.isSuccess && "Paylaşıldı!"}
              {createThread.isError && "Paylaşırken bir hata oluştu."}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default NewThread;
