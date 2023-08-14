import * as React from "react";
import { Check, Plus, Send } from "lucide-react";

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
} from "~/utils/useForum";
import { useSession } from "next-auth/react";
import { tokenizePostContent } from "~/utils/forumThread";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useGetAbdullezizUsers } from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { formatName } from "~/utils/abdulleziz";

type Attachment = { fileKey: string; fileUrl: string };

export function CardsChat({ threadId }: { threadId: string }) {
  const thread = useGetForumThread(threadId);
  const createPost = useCreateForumPost();
  const deleteAttachment = usePostDeleteAttachments();
  const abdullezizUsers = useGetAbdullezizUsers();
  const [mentions, setMentions] = React.useState(new Set<string>());
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);

  const users = (abdullezizUsers.data ?? []).filter(
    (m) => !m.user.bot && m.id !== undefined
  );
  const [open, setOpen] = React.useState(false);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);

  if (!thread.data) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center ">
          <div className="overflow-x-auto">
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-3xl">
              {thread.data.title}
            </h1>
            <p className="pt-1 text-sm sm:text-base">
              {thread.data.creator.name} •{" "}
              {thread.data.createdAt.toLocaleString()} • Forum ayarları:
              [Bildirimler: {thread.data.defaultNotify}]
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
          <Posts threadId={threadId} />
        </CardContent>
        <CardFooter>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const content: string = event.currentTarget.message.value;
              createPost.mutate(
                {
                  threadId,
                  message:
                    content +
                    (attachments.length > 0
                      ? "\n" + attachments.map((a) => a.fileUrl).join(" ")
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              event.currentTarget.message.value = "";
            }}
            className="flex w-full items-center space-x-2"
          >
            <Input
              id="message"
              placeholder="Mesajınızı yazın..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={createPost.isLoading}
              isLoading={createPost.isLoading}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Gönder</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
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
                      if (selectedUsers.includes(member.id!)) {
                        return setSelectedUsers(
                          selectedUsers.filter(
                            (selectedUser) => selectedUser !== member.id
                          )
                        );
                      }

                      return setSelectedUsers(
                        users
                          .map((u) => u.id!)
                          .filter((id) =>
                            [...selectedUsers, member.id!].includes(id)
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
                    {selectedUsers.includes(member.id!) ? (
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
                {selectedUsers.map((id) => {
                  const member = users.find((u) => u.id === id)!;
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
                  selectedUsers.includes(u.id!)
                );
                createPost.mutate({
                  threadId,
                  message: `${members
                    .map(
                      (member) => `@[${member.user.username}](${member.id!})`
                    )
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

type ThreadProps = { threadId: string };

const Posts: React.FC<ThreadProps> = ({ threadId }) => {
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
                "flex w-max max-w-2xl flex-col overflow-x-auto rounded-lg px-3 py-2 text-sm",
                session?.user.id === post.creatorId
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              )}
            >
              {tokenizePostContent(post.message)}
            </div>
            <time className="text-xs opacity-50">
              {post.createdAt.toLocaleString("tr-TR")}
            </time>
            {/* <div className="chat-footer opacity-50">Delivered</div> */}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center space-y-0 space-x-2 pr-4 pb-4 md:justify-end md:space-y-0 md:space-x-4">
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
