import * as React from "react";
import { Check, Lock, Plus, Send, Trash } from "lucide-react";

import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  useCreateForumPost,
  useGetForumPosts,
  useGetForumThread,
  usePostDeleteAttachments,
  useSetForumNotification,
} from "~/utils/useForum";
import { useSession } from "next-auth/react";
import { tokenizePostContent } from "~/utils/forumThread";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  useGetAbdullezizUser,
  useGetAbdullezizUsers,
} from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { formatName } from "~/utils/abdulleziz";
import {
  ThreadUpload,
  addAttachments,
  removeAttachment,
  setAttachments,
  setProgress,
  useAttachmentStore,
} from "./ThreadUpload";
import Image from "next/image";
import { type FileWithPath, useDropzone } from "react-dropzone";
import { useUploadThing } from "~/utils/uploadthing";
import { toast } from "react-hot-toast";
import {
  type UploadFileResponse,
  generateClientDropzoneAccept,
} from "uploadthing/client";
import { api, type RouterOutputs } from "~/utils/api";

type Attachment = UploadFileResponse;
type DatabaseUser = RouterOutputs["discord"]["getAbdullezizUsers"][number] & {
  id: string;
};

export function CardsChat({ threadId }: { threadId: string }) {
  const session = useSession();
  const thread = useGetForumThread(threadId);
  const createPost = useCreateForumPost();
  const abdullezizUsers = useGetAbdullezizUsers();
  const permissions = useGetAbdullezizUser().data?.perms;
  const threadNotif = useSetForumNotification();
  const canManage = permissions?.includes("forumu yönet");
  const canSend =
    !thread.data?.locked || permissions?.includes("forum thread kilitle");
  const [content, setContent] = React.useState("");
  const [mentions, setMentions] = React.useState(new Set<string>());
  const attachments = useAttachmentStore((s) => s.attachments);
  const users: DatabaseUser[] = [];
  const [open, setOpen] = React.useState(false);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);

  const [showDrag, setShowDrag] = React.useState(false);

  abdullezizUsers.data?.forEach((member) => {
    if (!member.user.bot && member.id !== undefined)
      users.push(member as DatabaseUser);
  });

  const onDrop = React.useCallback((acceptedFiles: FileWithPath[]) => {
    addAttachments(acceptedFiles);
    setShowDrag(false);
  }, []);

  const { permittedFileInfo, startUpload, isUploading } = useUploadThing(
    "threadPostAttachmentUploader",
    {
      onClientUploadComplete: () => {
        // pass
      },
      onUploadError: ({ message, code, data }) => {
        if (
          code === "BAD_REQUEST" &&
          message.includes("running") &&
          !data?.zodError
        )
          // most likely file type is not permitted
          // fucking worst library to upload things 😃😅
          toast.error(`Dosya yükleme izin verilmeyen dosya tipi içeriyor.`);
        else toast.error(`Dosya yükleme başarısız. ${code}: ${message}.`);
      },
      onUploadProgress: setProgress,
    }
  );

  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo.config)
    : [];

  const { getRootProps } = useDropzone({
    onDragLeave: () => setShowDrag(false),
    onDragOver: () => setShowDrag(true),
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    noClick: true,
  });

  const handleCreatePost = (content: string, uploads: Attachment[]) => {
    createPost.mutate(
      {
        threadId,
        message:
          content +
          (uploads.length > 0
            ? "\n" + uploads.map((a) => a.fileUrl).join(" ")
            : ""),
        mentions: [...mentions],
      },
      {
        onSuccess: () => {
          setMentions(new Set());
          setAttachments([]);
        },
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let uploads: Attachment[] | undefined = undefined;
    if (attachments.length > 0) {
      uploads = await startUpload(attachments);
    }

    if (attachments.length !== (uploads?.length ?? 0)) {
      // upload failed
      return;
    }

    handleCreatePost(content, uploads ?? []);
    setContent("");
  };

  if (!thread.data) return null;

  return (
    <>
      <div {...getRootProps()}>
        {showDrag ? (
          <div className="mt-2 rounded-md border p-4">
            <div className="flex h-screen w-full items-center justify-center rounded-md border-2 border-dashed">
              <p className="flex flex-col text-sm">
                <span className="mr-1 font-semibold">Click to upload</span>
                <span>or drag and drop.</span>
                <span className="text-xs text-muted-foreground">
                  (Max {permittedFileInfo?.config.image?.maxFileSize})
                </span>
              </p>
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="overflow-x-auto">
                <h1 className="text-lg font-semibold tracking-tight text-white sm:text-3xl">
                  {thread.data.title}
                </h1>
                <p className="pt-1 text-sm sm:text-base">
                  {thread.data.creator.name} •{" "}
                  {thread.data.createdAt.toLocaleString("tr-TR")} • Thread
                  ayarları: [Bildirimler:{" "}
                  {thread.data.defaultNotify === "none"
                    ? "Ssusturulmuş"
                    : thread.data.defaultNotify === "mentions"
                    ? "Sadece bahsetmeler"
                    : "Açık"}
                  ]{" "}
                  <Button
                    size={"relative-sm"}
                    variant={"outline"}
                    onClick={() =>
                      thread.data &&
                      threadNotif.mutate({
                        threadId,
                        preference:
                          thread.data.defaultNotify === "all"
                            ? "mentions"
                            : "all",
                      })
                    }
                    disabled={
                      threadNotif.isLoading ||
                      (thread.data.creatorId !== session.data?.user.id &&
                        !canManage)
                    }
                    isLoading={threadNotif.isLoading}
                  >
                    {thread.data.defaultNotify === "all"
                      ? "Sadece bahsetmeler"
                      : "Herkese aç"}
                  </Button>
                </p>
              </div>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="ml-auto rounded-full"
                      onClick={() => setOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={10}>
                    Bir kullanıcıyı bahset
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <Posts
                threadId={threadId}
                locked={thread.data.locked}
                canSend={!!canSend}
              />
            </CardContent>
            <CardFooter>
              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="flex w-full items-center space-x-2"
              >
                <Input
                  id="message"
                  placeholder={
                    canSend ? "Mesajınızı yazın..." : "Bu thread kilitli!"
                  }
                  className="flex-1"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!canSend}
                  onPaste={(e) => {
                    if (e.clipboardData.files.length > 0) {
                      addAttachments(Array.from(e.clipboardData.files));
                    }
                  }}
                />
                <ThreadUpload disabled={!canSend} />
                <Button
                  type="submit"
                  size="icon"
                  disabled={createPost.isLoading || isUploading || !canSend}
                  isLoading={createPost.isLoading || isUploading}
                >
                  {thread.data.locked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Gönder</span>
                </Button>
              </form>
            </CardFooter>
            <div className="flex items-center justify-center">
              <Attachments />
            </div>
          </Card>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 outline-none">
          <DialogHeader className="px-4 pb-4 pt-5">
            <DialogTitle>Kullanıcıları bahset</DialogTitle>
            <DialogDescription>
              Kullanıcıyı bu {"thread'e"} davet et. Bu panel bir bahsetme
              oluşturur.
            </DialogDescription>
          </DialogHeader>
          <Command className="overflow-hidden rounded-t-none border-t">
            <CommandInput placeholder="Kullanıcı ara..." />
            <CommandList>
              <CommandEmpty>Hiçbir kullanıcı bulunamadı.</CommandEmpty>
              <CommandGroup className="p-2">
                {users.map((member) => (
                  <CommandItem
                    key={member.id}
                    className="flex items-center px-2"
                    onSelect={() => {
                      if (selectedUsers.includes(member.id)) {
                        return setSelectedUsers(
                          selectedUsers.filter(
                            (selectedUser) => selectedUser !== member.id
                          )
                        );
                      }

                      return setSelectedUsers(
                        users
                          .map((u) => u.id)
                          .filter((id) =>
                            [...selectedUsers, member.id].includes(id)
                          )
                      );
                    }}
                  >
                    <Avatar>
                      <AvatarImage
                        src={getAvatarUrl(member.user, member.avatar)}
                        alt="Image"
                      />
                      <AvatarFallback>{formatName(member)[0]}</AvatarFallback>
                    </Avatar>
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">
                        {member.user.username}
                      </p>
                      <p className="text-sm text-zinc-400">{member.nick}</p>
                    </div>
                    {selectedUsers.includes(member.id) ? (
                      <Check className="ml-auto flex h-5 w-5 text-zinc-50" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <DialogFooter className="flex items-center border-t p-4 sm:justify-between">
            {selectedUsers.length > 0 ? (
              <div className="flex -space-x-2 overflow-hidden">
                {selectedUsers
                  .map((id) => users.find((u) => u.id === id))
                  .map((member) => {
                    if (!member) return null;
                    return (
                      <Avatar
                        key={member.id}
                        className="border-background inline-block border-2"
                      >
                        <AvatarImage
                          src={getAvatarUrl(member.user, member.avatar)}
                        />
                        <AvatarFallback>{formatName(member)[0]}</AvatarFallback>
                      </Avatar>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                Bahsetmek için kullanıcıları seç.
              </p>
            )}
            <Button
              disabled={selectedUsers.length < 1}
              onClick={() => {
                const members = users.filter((u) =>
                  selectedUsers.includes(u.id)
                );
                createPost.mutate({
                  threadId,
                  message: `${members
                    .map((member) => `@[${member.user.username}](${member.id})`)
                    .join(" ")}`,
                  mentions: [...selectedUsers],
                });
                setOpen(false);
              }}
            >
              Bahsetme mesajı gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Attachments() {
  const attachments = useAttachmentStore((s) => s.attachments);
  return (
    <div className="overflow-x-auto">
      {attachments.length > 0 && (
        <div className="m-4 flex flex-row gap-4">
          {attachments.map((file, i) => (
            <div className="flex flex-col items-center gap-2" key={i}>
              <Image
                width={128}
                height={128}
                alt={file.name}
                src={URL.createObjectURL(file)} // should revoke too
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  removeAttachment(file.name);
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ThreadProps = { threadId: string; locked: boolean; canSend: boolean };

const Posts: React.FC<ThreadProps> = ({ threadId, locked, canSend }) => {
  const { data: session } = useSession();
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoadingError,
  } = useGetForumPosts({ threadId });
  const [page, setPage] = React.useState(0);
  const [postsRef] = useAutoAnimate();

  const memes = api.forum.memes.getMemes.useQuery().data ?? [];

  const handleNext = async () => {
    await fetchNextPage();
    setPage(page + 1);
  };

  if (!data?.pages.flat().length) {
    return (
      <div className="alert alert-error flex flex-row items-center justify-start pt-3 shadow-lg">
        <span>Hiç post bulunamadı!</span>
      </div>
    );
  }

  const posts = data.pages[page]?.posts ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col" ref={postsRef}>
        {posts.map((post, idx) => (
          <div
            key={post.id}
            className={cn(
              "flex flex-col gap-2 rounded-lg px-3 py-2 text-sm",
              session?.user.id === post.creatorId && "ml-auto items-end"
            )}
          >
            {posts[idx - 1]?.creatorId !== post.creatorId && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  session?.user.id === post.creatorId && "flex-row-reverse"
                )}
              >
                <Avatar>
                  <AvatarImage
                    src={post.creator.image || undefined}
                    alt="Post Creator Image"
                  />
                  <AvatarFallback>{post.creator.name?.at(0)}</AvatarFallback>
                </Avatar>
                <span>{post.creator.name}</span>
              </div>
            )}
            <div
              className={cn(
                "w-max max-w-[16rem] overflow-x-auto rounded-lg px-3 py-2 text-sm sm:max-w-md lg:max-w-2xl",
                session?.user.id === post.creatorId
                // TODO: css props
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              )}
            >
              {tokenizePostContent(post.message, memes)}
            </div>
            <time className="text-xs opacity-50">
              {post.createdAt.toLocaleString("tr-TR")}
            </time>
            {/* <div className="chat-footer opacity-50">Delivered</div> */}
          </div>
        ))}
        {locked && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm">
            <Lock className="h-6 w-6" />
            <span>Bu thread kilitli!</span>
            {canSend && <span>Fakat sen mesaj gönderebilirsin.</span>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center space-x-2 space-y-0 pb-4 pr-4 md:justify-end md:space-x-4 md:space-y-0">
        {Array.from({ length: data.pages.length }).map((_, i) => (
          <Button key={i} onClick={() => setPage(i)}>
            {i + 1}
          </Button>
        ))}
        <Button
          variant={isLoadingError ? "destructive" : undefined}
          isLoading={isFetchingNextPage}
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => void handleNext()}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
};
