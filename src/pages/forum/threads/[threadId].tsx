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
  const [content, setContent] = useState("");
  const router = useRouter();
  const { threadId } = router.query;
  const thread = useGetForumThread(threadId as string);

  const deleteThread = useDeleteForumThread();
  const createPost = useCreateForumPost();

  const clearContent = () => {
    setContent("");
  };

  return (
    <Layout>
      <div className="flex h-max flex-col items-center justify-center p-4 py-2">
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
              <PostComponent />

              <div className="form-control mt-3">
                <div className="input-group flex items-center justify-center">
                  <textarea
                    name="messageInput"
                    className="input-bordered input w-full max-w-2xl"
                    placeholder="Enter your message..."
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
                    }}
                  >
                    Send!
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

const PostComponent: React.FC = () => {
  const router = useRouter();
  const { threadId } = router.query;
  const thread = useGetForumThread(threadId as string);
  const [currentPage, setCurrentPage] = useState<number>(1);

  if (!thread?.data?.posts) {
    return (
      <Layout>
        <div className="alert alert-error flex flex-row shadow-lg">
          <InfoSVG />
          <span>No posts found!</span>
        </div>
      </Layout>
    );
  } else {
    const posts = thread.data.posts;
    const postsPerPage = 5;
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToDisplay = posts.slice(startIndex, endIndex);
    const totalPages = Math.ceil(posts.length / postsPerPage);
    return (
      <div className="mt-3 flex flex-col  rounded bg-base-100 ">
        {postsToDisplay &&
          postsToDisplay.map((post) => (
            <div key={post.id} className="m-4  flex flex-row">
              <div className="mr-4 rounded bg-base-200 ">
                {post.creator.image && (
                  <img
                    className="ml-auto mr-auto w-12 rounded-full p-1 sm:w-20"
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
        <div className="mr-4 mb-4 flex flex-wrap justify-center space-y-0 space-x-2 md:justify-end md:space-y-0 md:space-x-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className="rounded-md bg-blue-500 px-4 py-2 text-base transition-all hover:bg-blue-600 "
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }
};

export default ForumThread;
