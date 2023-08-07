import { toast } from "react-hot-toast";
import { api, type RouterOutputs, type RouterInputs } from "./api";

type GetThreads = RouterInputs["forum"]["getThreads"];
type GetForum = RouterInputs["forum"]["getThreadById"];
type GetPosts = RouterInputs["forum"]["posts"]["getMany"];

type Threads = RouterOutputs["forum"]["getThreads"];

export const usePrefetchThreads = () => {
  const utils = api.useContext();

  // TODO: useCallback
  return (threads: Threads) => {
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
  };
};

export const useGetForumThreads = (input: GetThreads) =>
  api.forum.getThreads.useQuery(input);

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
      toast.success("Thread pinlendi!", { id: "forum.createPin" });
      await utils.forum.getThreads.invalidate();
    },
    onMutate: () => {
      toast.loading("Thread pinleniyor...", { id: "forum.createPin" });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, {
        id: "forum.createPin",
      });
    },
  });
};

export const useDeleteForumPin = () => {
  const utils = api.useContext();
  return api.forum.deletePin.useMutation({
    onSuccess: async () => {
      toast.success("Thread pin kaldırıldı!", { id: "forum.deletePin" });
      await utils.forum.getThreads.invalidate();
    },
    onMutate: () => {
      toast.loading("Thread pin kaldırılıyor...", { id: "forum.deletePin" });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, {
        id: "forum.deletePin",
      });
    },
  });
};

export const useGetUserNotification = () =>
  api.forum.notifications.getUserNotification.useQuery();

export const useSetUserNotification = () => {
  const utils = api.useContext();
  return api.forum.notifications.setUserNotification.useMutation({
    onSuccess: async () => {
      toast.success("Bildirim ayarları kaydedildi!", {
        id: "forum.setUserNotification",
      });
      await utils.forum.notifications.getUserNotification.invalidate();
    },
  });
};

export const useSetForumUserNotification = () => {
  const utils = api.useContext();
  return api.forum.notifications.setForumUserNotification.useMutation({
    onSuccess: async () => {
      toast.success("Bildirim ayarları kaydedildi!", {
        id: "forum.setForumUserNotification",
      });
      await utils.forum.getThreads.invalidate();
    },
  });
};

export const useCreateForumThread = () => {
  const utils = api.useContext();
  return api.forum.createThread.useMutation({
    // invalidate the threads so it's fresh 🤣 (taze künefe)
    onSuccess: async () => {
      toast.success("Thread oluşturuldu!", { id: "forum.createThread" });
      await utils.forum.getThreads.invalidate();
    },
    onMutate: () => {
      toast.loading("Thread oluşturuluyor...", { id: "forum.createThread" });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, {
        id: "forum.createThread",
      });
    },
  });
};

export const usePostDeleteAttachments = () => {
  const id = "forum.post.deleteAttachments";
  return api.forum.posts.deleteAttachments.useMutation({
    onSuccess: () => {
      toast.success("Thread Post'u dosya eki silindi!", { id });
    },
    onMutate: () => {
      toast.loading("Thread Post'u dosya eki siliniyor...", { id });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, { id });
    },
  });
};

export const useDeleteForumThread = () => {
  const utils = api.useContext();
  return api.forum.deleteThreadById.useMutation({
    onSuccess: async (data) => {
      toast.success("Thread silindi!", { id: "forum.deleteThread" });
      // invalidate the thread so it's not listed anymore
      await utils.forum.getThreadById.invalidate(data.id);
      await utils.forum.getThreads.invalidate();
      await utils.forum.posts.getMany.invalidate({ threadId: data.id });
    },
    onMutate: () => {
      toast.loading("Thread siliniyor...", { id: "forum.deleteThread" });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, {
        id: "forum.deleteThread",
      });
    },
  });
};

export const useCreateForumPost = () => {
  const utils = api.useContext();
  return api.forum.posts.create.useMutation({
    onSuccess: async ({ threadId }) => {
      toast.success("Post oluşturuldu!", { id: "forum.createPost" });
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
    onMutate: () => {
      toast.loading("Post oluşturuluyor...", { id: "forum.createPost" });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, {
        id: "forum.createPost",
      });
    },
  });
};
