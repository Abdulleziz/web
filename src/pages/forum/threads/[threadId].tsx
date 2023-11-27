import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Layout, LayoutNext } from "~/components/Layout";
import {
  useDeleteForumThread,
  useGetForumThread,
  useToggleLockForumThread,
} from "~/utils/useForum";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { CardsChat } from "~/components/ThreadChat";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { WalletCards } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ThreadId } from "~/server/api/routers/forum/types";

const ForumThread: NextPage = () => {
  const router = useRouter();
  const parseThreadId = ThreadId.safeParse(router.query.threadId);

  if (!parseThreadId.success) {
    return (
      <Layout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p>Gerçek bir Thread id gibi durmuyor!</p>
          <div
            className="btn btn-primary"
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

  const [threadRef] = useAutoAnimate();
  return (
    <LayoutNext>
      <div
        className="flex h-auto flex-col items-center justify-center p-4 py-2"
        ref={threadRef}
      >
        {!!thread.data && <ManageThread threadId={threadId} />}

        <main className="pb-auto w-full pt-5">
          <div className="flex items-center justify-center">
            {thread.isLoading && <p>Yükleniyor...</p>}
            {thread.isError && (
              <p>
                Hata! ({thread.error.data?.zodError || thread.error.message})
              </p>
            )}
            {thread.data === null && (
              <p className="text-error">Thread bulunamadı veya silinmiş!</p>
            )}
          </div>
          {thread.data && <CardsChat threadId={threadId} />}
        </main>
      </div>
    </LayoutNext>
  );
};

const ManageThread: React.FC<ThreadProps> = ({ threadId }) => {
  const router = useRouter();
  const user = useGetAbdullezizUser();
  const deleteThread = useDeleteForumThread();
  const lockThread = useToggleLockForumThread();
  const isLocked = useGetForumThread(threadId).data?.locked;

  const onDelete = async () => {
    try {
      await deleteThread.mutateAsync(threadId);
      await router.push("/forum");
    } catch (error) {
      console.error(error);
    }
  };

  const canDelete = user.data?.perms.includes("forum thread sil");
  const canLock = user.data?.perms.includes("forum thread kilitle");
  if (!canDelete && !canLock) return null;

  return (
    <Alert>
      <WalletCards className="h-4 w-4" />
      <AlertTitle>Threadi Yönet!</AlertTitle>
      <div className="flex">
        <AlertDescription>
          Threadi yönetme yetkiniz var. Threadi kilitleyebilirsiniz.
        </AlertDescription>
        <div className="ml-auto flex gap-2">
          {canLock && (
            <Button
              size={"relative-lg"}
              isLoading={isLocked === undefined || lockThread.isLoading}
              disabled={isLocked === undefined || lockThread.isLoading}
              onClick={() => lockThread.mutate(threadId)}
            >
              {isLocked ? "Kilidi Aç" : "Kilitle"}
            </Button>
          )}
          {canDelete && (
            <Button
              size={"relative-lg"}
              variant={"destructive"}
              isLoading={deleteThread.isLoading}
              disabled={
                deleteThread.isLoading ||
                deleteThread.isSuccess ||
                deleteThread.isError
              }
              onClick={() => void onDelete()}
            >
              Sil
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default ForumThread;
