import { toast } from "react-hot-toast";
import { api, type RouterOutputs, type RouterInputs } from "./api";

type GetPosts = RouterInputs["forum"]["posts"]["getMany"];

type Threads = RouterOutputs["forum"]["getThreads"];
export type Meme = RouterOutputs["forum"]["memes"]["getMemes"][number]
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

export const useGetForumThreads = api.forum.getThreads.useQuery;
export const useGetForumThread = api.forum.getThreadById.useQuery;

export const useGetForumPosts = (input: GetPosts) =>
  api.forum.posts.getMany.useInfiniteQuery(input, {
    getNextPageParam: (lastPage) => lastPage.next,
  });

export const useToggleLockForumThread = () => {
  const utils = api.useContext();
  return api.forum.toggleLockThread.useMutation({
    onSuccess: async (_d, threadId) => {
      toast.success("Thread kilidi değiştirildi!", { id: "forum.toggleLock" });
      await utils.forum.getThreadById.invalidate(threadId);
      await utils.forum.getThreads.invalidate();
    },
    onMutate: () => {
      toast.loading("Thread kilidi değiştiriliyor...", {
        id: "forum.toggleLock",
      });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, {
        id: "forum.toggleLock",
      });
    },
  });
};

export const useCreateForumPin = () => {
  const utils = api.useContext();
  return api.forum.createPin.useMutation({
    onSuccess: async (_d, threadId) => {
      toast.success("Thread pinlendi!", { id: "forum.createPin" });
      await utils.forum.getThreadById.invalidate(threadId);
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
    onSuccess: async (_d, threadId) => {
      toast.success("Thread pin kaldırıldı!", { id: "forum.deletePin" });
      await utils.forum.getThreadById.invalidate(threadId);
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

export const useSetForumNotification = () => {
  const utils = api.useContext();
  return api.forum.notifications.setForumNotification.useMutation({
    onSuccess: async (_d, { threadId }) => {
      toast.success("Bildirim ayarları kaydedildi!", {
        id: "forum.setForumNotification",
      });
      await utils.forum.getThreads.invalidate();
      await utils.forum.getThreadById.invalidate(threadId);
    },
  });
};

export const useSetForumUserNotification = () => {
  const utils = api.useContext();
  return api.forum.notifications.setForumUserNotification.useMutation({
    onSuccess: async (_d, { threadId }) => {
      toast.success("Bildirim ayarları kaydedildi!", {
        id: "forum.setForumUserNotification",
      });
      await utils.forum.getThreads.invalidate();
      await utils.forum.getThreadById.invalidate(threadId);
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
      // TODO: invalidate the post
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

export const useInsertMeme = () => {
  const utils = api.useContext();
  return api.forum.memes.insertMeme.useMutation({
    onSuccess: async () => {
      toast.success("Kelime Eklendi/Düzenlendi!", { id: "meme.insertMeme" });
      // invalidate the thread so it's not listed anymore
      await utils.forum.memes.getMemes.invalidate();
    },
    onMutate: () => {
      toast.loading("Kelime Düzenleniyor...", { id: "meme.insertMeme" });
    },
    onError(error) {
      toast.error(error.data?.zodError || error.message, {
        id: "meme.insertMeme",
      });
    },
  });
};