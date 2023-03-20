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
        <div className="flex w-full flex-1 flex-col items-center  text-center">
          <CreateThread />
        </div>
      </div>
    </Layout>
  );
};

const CreateThread: NextPage = () => {
  const [tags, setTags] = useState(new Set<string>());
  const [title, setTitle] = useState<string>("");
  const createThread = useCreateForumThread();
  const tagRef =
    useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;

  const handlePublish = () => {
    createThread.mutate({ tags: [...tags], title });
  };

  return (
    <>
      <h1 className="mt-10 p-4 text-xl font-bold tracking-tight text-white sm:text-[5rem]">
        New Thread
      </h1>
      <div className="title-div justify-centerp-4 mt-8 flex w-full flex-col items-center md:w-6/12">
        <input
          id="titleInput"
          type="text"
          placeholder="Title..."
          className={
            title
              ? "input-success input w-full transition-all"
              : "input-error input w-full transition-all"
          }
          defaultValue={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

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
        <div className="mb-3 rounded-lg bg-base-300 p-2">
          {[...tags].map((tag) => (
            <div key={tag} className="badge-primary badge m-1">
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
          Published! Click to go.
        </Link>
      ) : (
        <button className="btn-primary btn" onClick={handlePublish}>
          {createThread.isIdle && "Publish"}
          {createThread.isLoading && (
            <div className="m-[10px] flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-4 border-solid border-white border-t-transparent"></div>
              <div className="ml-2"> Processing... </div>
            </div>
          )}
          {createThread.isSuccess && "finished"}
          {createThread.isError && "error try again"}
        </button>
      )}
    </>
  );
};

export default NewThread;
