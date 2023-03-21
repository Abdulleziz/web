import classNames from "classnames";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import {
  useCreateForumPost,
  useDeleteForumThread,
  useGetForumThread,
} from "~/utils/useForum";

const ForumThread: NextPage = () => {
  const router = useRouter();
  const [content, setContent] = useState("");
  const { threadId } = router.query;

  const thread = useGetForumThread(threadId as string);
  const deleteThread = useDeleteForumThread();
  const createPost = useCreateForumPost();
  const clearContent = () => {
    setContent("");
  };

  return (
    <Layout>
      <div className="flex h-screen flex-col items-center justify-center p-4 py-2">
        <div className="alert alert-info flex flex-row shadow-lg">
          <div>
            <InfoSVG />
            <span>
              Şu anda Early Alpha sürümünde olduğumuz için tüm threadler
              silinebilir durumda!
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
            onClick={() => deleteThread.mutate(threadId as string)}
          >
            Sil
          </button>
        </div>
        <main className="mb-auto mt-5 w-full ">
          {thread.isLoading && <p>Yükleniyor...</p>}
          {thread.isError && <p>Hata!</p>}
          {thread.data && (
            <div className="flex flex-col">
              <div className="rounded-md bg-base-100 p-5">
                <h1 className=" text-lg font-semibold tracking-tight text-white sm:text-3xl">
                  {thread.data.title}
                </h1>
                <p className="mt-1 text-sm sm:text-base">
                  {thread.data.creator.name} •{" "}
                  {thread.data.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="mt-3 flex flex-col  rounded bg-base-100 ">
                {thread.data.posts.map((post) => (
                  <div key={post.id} className="m-4 ml-2 flex flex-row">
                    <div className="mr-4 rounded bg-base-200 ">
                      {post.creator.image && (
                        <img
                          className="ml-auto mr-auto w-12 rounded-full p-1 sm:w-24"
                          src={post.creator.image}
                          alt="Profile Image"
                        />
                      )}
                      <p className="m-3 text-center text-sm font-bold text-white sm:text-xl">
                        {post.creator.name}
                      </p>
                    </div>
                    <div className="flex w-full min-w-0 flex-1 rounded bg-base-200 ">
                      <h3 className="m-8">{post.message}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-control mt-3">
                <div className="input-group flex items-center justify-center">
                  <textarea
                    id="messageInput"
                    className="input-bordered input w-full max-w-2xl"
                    placeholder="Mesajınızı buraya yazın..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <button
                    className={classNames("btn-primary btn", {
                      loading: createPost.isLoading,
                    })}
                    disabled={createPost.isLoading}
                    onClick={() => {
                      createPost.mutate({
                        threadId: threadId as string,
                        message: content,
                      });
                      clearContent();
                    }
                    }
                  >
                    Gönder
                  </button>
                </div>
              </div>
            </div>
          )}
          {thread.data === null && (
            <p className="text-error">Thread bulunamadı veya silinmiş!</p>
          )}
        </main>
      </div>
    </Layout>
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

export default ForumThread;
