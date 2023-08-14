import { signOut, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  useGetForumThreads,
  useGetUserNotification,
  useSetUserNotification,
} from "~/utils/useForum";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  AlarmClock,
  Bell,
  BellRing,
  Github,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Settings,
  User,
  WalletCards,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { useGetAllCrons } from "~/utils/useCron";

export const NavbarNext: React.FC = () => {
  const { data: session } = useSession();
  const forumNotif = useGetUserNotification();
  const setForumNotif = useSetUserNotification();

  const [ref] = useAutoAnimate();

  return (
    <div
      className="min-h-16 sticky top-0 z-50 flex w-full items-center bg-white p-2 dark:bg-zinc-950"
      ref={ref}
    >
      <div className="inline-flex w-1/2 items-center justify-start">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Link href="/">
              <Button variant={"brand"} size={"relative-lg"}>
                Abdulleziz Corp.
              </Button>
            </Link>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <Link href="/">
              <DropdownMenuLabel>Anasayfa</DropdownMenuLabel>
            </Link>
            <DropdownMenuSeparator />
            <Link href="/forum">
              <DropdownMenuItem>Forum</DropdownMenuItem>
            </Link>
            <Link href="/cron">
              <DropdownMenuItem>Hatırlatıcı</DropdownMenuItem>
            </Link>
            <Link href="/manage">
              <DropdownMenuItem>Kullanıcıları Yönet</DropdownMenuItem>
            </Link>
            <Link href="/store">
              <DropdownMenuItem>Mağaza</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="inline-flex flex-shrink-0 items-center"></div>
      <div className="inline-flex w-1/2 items-center justify-end gap-4">
        <CommandDialogDemo />
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar>
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>{session.user.name}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <Link href={`/profiles/${session.user.id}`}>
                    <span>Profil</span>
                  </Link>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ayarlar</span>
                  <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
                </DropdownMenuItem> */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Settings className="mr-2 h-4 w-4" />
                    Ayarlar
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Bell className="mr-2 h-4 w-4" />
                        Forum Thread Bildirimleri
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                          value={forumNotif.data ?? "all"}
                          onValueChange={(value) => {
                            setForumNotif.mutate(value as "all" | "mentions");
                          }}
                        >
                          <DropdownMenuRadioItem value={"all"}>
                            <BellRing className="mr-2 h-4 w-4" />
                            Her şey
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value={"mentions"}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Bahsetmeler
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="https://github.com/Abdulleziz/web" target="_blank">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://discord.com/channels/918833527389315092/1081863173910569061"
                  target="_blank"
                >
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Destek
                </a>
              </DropdownMenuItem>
              {/* <DropdownMenuItem disabled>
                <Cloud className="mr-2 h-4 w-4" />
                <span>API</span>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
                <DropdownMenuShortcut>⌘Ç</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => void signIn("discord")}>Giriş yap</Button>
        )}
      </div>
    </div>
  );
};

export function CommandDialogDemo() {
  const router = useRouter();
  const threads = useGetForumThreads();
  const crons = useGetAllCrons();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <div>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Arama yap...</span>
        <span className="inline-flex lg:hidden">Ara...</span>
        <kbd className="bg-muted pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command or search..."
        />
        <CommandList>
          <CommandEmpty>Hiçbir sonuç bulunamadı.</CommandEmpty>
          <CommandGroup heading="Tavsiye edilenler">
            <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
              Anasayfaya git
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/forum"))}
            >
              Foruma git
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/cron"))}
            >
              Hatırlatıcılara git
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/manage"))}
            >
              Kullanıcıları Yönet
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Thread">
            <CommandItem onSelect={() => setQuery("Thread:")}>
              Thread bul
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/forum/threads/new"))
              }
            >
              Thread oluştur
            </CommandItem>
            {query.startsWith("Thread") &&
              threads.data?.map((t) => (
                <CommandItem
                  key={t.id}
                  value={"Thread: " + t.title}
                  onSelect={() =>
                    runCommand(() => router.push(`/forum/threads/${t.id}`))
                  }
                >
                  <WalletCards className="m-1 h-4 w-4" />
                  Thread: {t.title}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Hatırlatıcı">
            <CommandItem onSelect={() => setQuery("Hatırlatıcı:")}>
              Hatırlatıcı bul
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/cron"))}
            >
              Hatırlatıcı oluştur
            </CommandItem>
            {query.startsWith("Hatırlatıcı") &&
              crons.data?.map((c) => (
                <CommandItem
                  key={c.id}
                  value={"Hatırlatıcı: " + c.title}
                  onSelect={() =>
                    runCommand(() => {
                      const url = new URL("/cron", window.location.href);
                      url.searchParams.set("exp", c.cron);
                      void router.push(url);
                    })
                  }
                >
                  <AlarmClock className="m-1 h-4 w-4" />
                  Hatırlatıcı: {c.title}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
