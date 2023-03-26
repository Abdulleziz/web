import classNames from "classnames";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import { ThreadId } from "~/utils/zod-utils";
import {
  useCreateForumPost,
  useDeleteForumThread,
  useGetForumPosts,
  useGetForumThread,
} from "~/utils/useForum";

const ForumThread: NextPage = () => {
  const router = useRouter();
  const parseThreadId = ThreadId.safeParse(router.query.threadId);

  if (!parseThreadId.success) {
    return (
      <Layout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p>Gerçek bir Thread id gibi durmuyor!</p>
          <div
            className="btn-primary btn"
            onClick={() => void router.push("/forum")}
          >
            Geri Dön
          </div>
        </div>
      </Layout>
    );
  }

  return <ThreadPage threadId={parseThreadId.data} />;
};

type ThreadProps = { threadId: ThreadId };

const ThreadPage: React.FC<ThreadProps> = ({ threadId }) => {
  const thread = useGetForumThread(threadId);
  const createPost = useCreateForumPost();
  const [content, setContent] = useState("");

  return (
    <Layout>
      <div className="flex h-auto flex-col items-center justify-center p-4 py-2">
        {!!thread.data && <DeleteThread threadId={threadId} />}

        <main className="pb-auto pt-5 w-full ">
          {thread.isLoading && <p>Yükleniyor...</p>}
          {thread.isError && <p>Hata!</p>}
          {thread.data && (
            <div className="flex flex-col">
              <div className="rounded-md bg-base-100 p-5">
                <h1 className=" text-lg font-semibold tracking-tight text-white sm:text-3xl">
                  {thread.data.title}
                </h1>
                <p className="pt-1 text-sm sm:text-base">
                  {thread.data.creator.name} •{" "}
                  {thread.data.createdAt.toLocaleString()}
                </p>
              </div>
              <Posts threadId={threadId} />

              <div className="form-control mt-3">
                <div className="input-group flex items-center justify-center">
                  <textarea
                    className="input-bordered input w-full max-w-2xl"
                    placeholder="Mesajınızı giriniz..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={createPost.isLoading}
                  />
                  <button
                    className={classNames("btn-primary btn", {
                      loading: createPost.isLoading,
                    })}
                    disabled={createPost.isLoading}
                    onClick={() =>
                      createPost.mutate(
                        { threadId, message: content },
                        { onSuccess: () => setContent("") }
                      )
                    }
                  >
                    Gönder!
                  </button>
                </div>
              </div>
            </div>
          )}
          {thread.data === null && (
            <div className="flex items-center justify-center">
              <p className="text-error">Thread bulunamadı veya silinmiş!</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

const DeleteThread: React.FC<ThreadProps> = ({ threadId }) => {
  const deleteThread = useDeleteForumThread();

  return (
    <div className="alert alert-info flex flex-row shadow-lg">
      <div>
        <InfoSVG />
        <span>
          Şu anda Early Alpha sürümünde olduğumuz için tüm threadler silinebilir
          durumda!
        </span>
      </div>
      <button
        className={classNames("btn-error btn-sm btn", {
          loading: deleteThread.isLoading,
        })}
        disabled={
          deleteThread.isLoading ||
          deleteThread.isSuccess ||
          deleteThread.isError
        }
        onClick={() => deleteThread.mutate(threadId)}
      >
        Sil
      </button>
    </div>
  );
};

const InfoSVG: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="h-6 w-6 flex-shrink-0 stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  );
};

const Posts: React.FC<ThreadProps> = ({ threadId }) => {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoadingError,
  } = useGetForumPosts({ threadId });
  const [page, setPage] = useState(0);

  const handleNext = async () => {
    await fetchNextPage();
    setPage(page + 1);
  };

  if (!data?.pages.flat().length) {
    return (
      <div className="alert alert-error pt-3 flex flex-row items-center justify-start shadow-lg">
        <InfoSVG />
        <span>Hiç post bulunamadı!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded bg-base-100 pt-3">
      {data.pages[page]?.posts.map((post) => (
        <div key={post.id} className="p-4 flex flex-row">
          <div className="pr-4 rounded bg-base-200 items-center justify-center flex flex-col">
            {post.creator.image && (
              <img
                className="ml-auto mr-auto w-12 rounded-full p-1 sm:w-20"
                src={post.creator.image}
                alt="Profile Image"
              />
            )}
            <p className="p-3 text-center text-sm font-bold text-white sm:text-xl">
              {post.creator.name}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-1 rounded bg-base-200 ">
            <h3 className="p-8">{post.message}</h3>
          </div>
        </div>
      ))}
      <div className="pr-4 pb-4 flex flex-wrap justify-center space-y-0 space-x-2 md:justify-end md:space-y-0 md:space-x-4">
        {Array.from({ length: data.pages.length }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className="btn-info btn rounded-md px-4 py-2 hover:btn-warning"
          >
            {i + 1}
          </button>
        ))}
        <button
          className={classNames("btn", {
            ["loading"]: isFetchingNextPage,
            ["btn-error"]: isLoadingError,
          })}
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => void handleNext()}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
};

export default ForumThread;
