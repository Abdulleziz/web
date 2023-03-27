import { api, type RouterInputs } from "./api";

type GetForum = RouterInputs["forum"]["getThreadById"];
type GetPosts = RouterInputs["forum"]["posts"]["getMany"];

export const useGetForumThreads = () => {
  const utils = api.useContext();
  return api.forum.getThreads.useQuery(undefined, {
    onSuccess: (threads) => {
      threads.forEach((thread) => {
        // prefetch the thread, posts so it's ready when we navigate to it
        void utils.forum.getThreadById.prefetch(thread.id, {
          staleTime: 1000 * 5,
        });
        void utils.forum.posts.getMany.prefetchInfinite({
          threadId: thread.id,
          cursor: undefined,
        });
      });
    },
  });
};

export const useGetForumThread = (input: GetForum) =>
  api.forum.getThreadById.useQuery(input);

export const useGetForumPosts = (input: GetPosts) =>
  api.forum.posts.getMany.useInfiniteQuery(input, {
    getNextPageParam: (lastPage) => lastPage.next,
  });

export const useCreateForumPin = () => {
  const utils = api.useContext();
  return api.forum.createPin.useMutation({
    onSuccess: async () => {
      await utils.forum.getThreads.invalidate();
    },
  });
};

export const useDeleteForumPin = () => {
  const utils = api.useContext();
  return api.forum.deletePin.useMutation({
    onSuccess: async () => {
      await utils.forum.getThreads.invalidate();
    },
  });
};

export const useCreateForumThread = () => {
  const utils = api.useContext();
  return api.forum.createThread.useMutation({
    // invalidate the threads so it's fresh 🤣 (taze künefe)
    onSuccess: async () => {
      await utils.forum.getThreads.invalidate();
    },
  });
};

export const useDeleteForumThread = () => {
  const utils = api.useContext();
  return api.forum.deleteThreadById.useMutation({
    onSuccess: async (data) => {
      // invalidate the thread so it's not listed anymore
      await utils.forum.getThreadById.invalidate(data.id);
      await utils.forum.getThreads.invalidate();
      await utils.forum.posts.getMany.invalidate({ threadId: data.id });
    },
  });
};

export const useCreateForumPost = () => {
  const utils = api.useContext();
  return api.forum.posts.create.useMutation({
    onSuccess: async ({ threadId }) => {
      const cursor = utils.forum.posts.getMany
        .getInfiniteData()
        ?.pages.at(-1)?.next;
      // when we create a message, last page is the one we want to invalidate
      await utils.forum.posts.getMany.invalidate(
        { threadId, cursor },
        {
          refetchPage: (_last, index, pages) => {
            return index === pages.length - 1;
          },
        }
      );
    },
  });
};
