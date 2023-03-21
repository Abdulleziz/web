import { api, RouterInputs } from "./api";

type GetForum = RouterInputs["forum"]["getThreadById"];

export const useGetForumThreads = () => api.forum.getThreads.useQuery();
export const useGetForumThread = (input: GetForum) =>
  api.forum.getThreadById.useQuery(input);

export const useCreateForumThread = () => {
  const utils = api.useContext();
  return api.forum.createThread.useMutation({
    // invalidate the threads so it's fresh 🤣 (taze künefe)
    onSuccess: async (data) => {
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
    },
  });
};

export const useCreateForumPost = () => {
  const utils = api.useContext();
  return api.forum.posts.create.useMutation({
    onSuccess: async (data) => {
      await utils.forum.getThreadById.invalidate(data.threadId);
      await utils.forum.getThreads.invalidate();
    },
  });
};
