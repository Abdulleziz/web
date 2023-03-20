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

  return (
    <Layout theme="dark">
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
        <main className="mb-auto w-full text-center">
          {thread.isLoading && <p>Yükleniyor...</p>}
          {thread.isError && <p>Hata!</p>}
          {thread.data && (
            <div className="flex flex-col">
              <h1 className="p-4 font-extrabold tracking-tight text-white sm:text-[5rem]">
                Başlık: {thread.data.title}
              </h1>

              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="p-4 text-2xl font-extrabold text-info">
                  Mesajlar:
                </p>
                {thread.data.posts.map((post) => (
                  <div key={post.id} className="p-4">
                    <p className="text-xl font-bold text-white">
                      {post.creator.name}
                    </p>
                    <p className="text-lg text-white">{post.message}</p>
                  </div>
                ))}
              </div>

              <div className="form-control">
                <div className="input-group flex items-center justify-center">
                  <textarea
                    className="input-bordered input w-full max-w-2xl"
                    placeholder="Mesajınızı buraya yazın..."
                    defaultValue={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <button
                    className={classNames("btn-primary btn", {
                      loading: createPost.isLoading,
                    })}
                    disabled={createPost.isLoading}
                    onClick={() =>
                      createPost.mutate({
                        threadId: threadId as string,
                        message: content,
                      })
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
