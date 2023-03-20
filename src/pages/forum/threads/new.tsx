import type { NextPage } from "next";
import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Layout } from "~/components/Layout";
import { useCreateForumThread } from "~/utils/useForum";

const NewThread: NextPage = () => {
  return (
    <Layout>
      <div className="flex min-h-screen flex-col items-center justify-center pb-32">
        <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
          <CreateThread />
        </div>
      </div>
    </Layout>
  );
};

const CreateThread: NextPage = () => {
  const [stage, setStage] = useState<"tags" | "title" | "finish">("tags");
  const [tags, setTags] = useState(new Set<string>());
  const [title, setTitle] = useState<string>("");
  const createThread = useCreateForumThread();
  const tagRef =
    useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;

  switch (stage) {
    case "tags":
      return (
        <>
          <h1 className="p-4 text-2xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Thread oluştur
          </h1>
          {[...tags].map((tag) => (
            <div key={tag} className="badge-primary badge">
              {tag}
            </div>
          ))}

          <div className="form-control">
            <div className="input-group flex min-w-full flex-row items-center justify-center p-4">
              <input
                ref={tagRef}
                type="text"
                placeholder="Tag…"
                className="input-bordered input min-w-full"
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
            <button
              className="btn-primary btn"
              onClick={() => {
                setStage("title");
              }}
            >
              Devam
            </button>
          </div>
        </>
      );

    case "title":
      return (
        <div className="form-control w-full items-center justify-center">
          <div className="flex w-full p-4 md:w-6/12">
            <input
              type="text"
              placeholder="Başlık…"
              className="input-bordered input-success input w-full"
              defaultValue={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <button
            className="btn-primary btn"
            onClick={() => {
              setStage("finish");
              createThread.mutate({ tags: [...tags], title });
            }}
          >
            Paylaş!
          </button>
        </div>
      );

    case "finish":
      return (
        <h1 className="p-4 text-2xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          {createThread.isLoading && "Paylaşılıyor..."}
          {createThread.isSuccess && (
            <Link href={`/forum/threads/${createThread.data.id}`}>
              Paylaşıldı! Tıklayıp görüntüle.
            </Link>
          )}
          {createThread.isError && "Hata oluştu!"}
        </h1>
      );
  }
};

export default NewThread;
