import { api, type RouterInputs } from "./api";

type GetForum = RouterInputs["forum"]["getThreadById"];
type GetPosts = RouterInputs["forum"]["posts"]["getMany"];

export const useGetForumThreads = () => api.forum.getThreads.useQuery();
export const useGetForumThread = (input: GetForum) =>
  api.forum.getThreadById.useQuery(input);

export const useGetForumPosts = (input: GetPosts) =>
  api.forum.posts.getMany.useInfiniteQuery(input, {
    getNextPageParam: (lastPage) => lastPage.next,
  });

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
          refetchPage: (last, index, pages) => {
            return index === pages.length - 1;
          },
        }
      );
    },
  });
};
