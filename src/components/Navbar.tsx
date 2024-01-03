import { signOut, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  type FC,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
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
  BellOff,
  BellRing,
  Github,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Wallet,
  WalletCards,
} from "lucide-react";
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
import { useMoneyDialog } from "./SendMoney";
import { useGetWallet } from "~/utils/usePayments";
import { CurrentAvatar } from "./CurrentAvatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { NavbarRoutes } from "~/config/routes";
import { api } from "~/utils/api";
import {
  askForNotificationPermission,
  createNotificationSubscription,
  deleteNotificationSubscription,
  notificationSettingsStore,
  notificationSyncStore,
} from "~/lib/pusher/notifications";
import { PushSubscription } from "~/utils/shared";
import { useHydrated } from "~/pages/_app";
import toast from "react-hot-toast";
import { useIsSafari } from "~/hooks/browserDetect";

export const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const hydrated = useHydrated();
  const pushSync = api.notifications.syncSubscription.useMutation();
  const balance = useGetWallet().data?.balance ?? 0;
  const forumNotif = useGetUserNotification();
  const setForumNotif = useSetUserNotification();
  const pushSyncStore = notificationSyncStore();
  const pushSettingsStore = notificationSettingsStore();
  const openMoneyDialog = useMoneyDialog((s) => s.setOpen);

  const [ref] = useAutoAnimate();

  async function subscribe() {
    await askForNotificationPermission();
    const subscription = await createNotificationSubscription();
    if (!subscription) return;

    const validated = PushSubscription.parse(subscription.toJSON());
    await pushSync.mutateAsync(validated);
    pushSettingsStore.setDeleted(false);
    pushSyncStore.setSync(true);
    toast.success("Cihaz bildirimleri açıldı.");
  }

  async function unsubscribe() {
    await deleteNotificationSubscription();
    pushSettingsStore.setDeleted(true);
    pushSyncStore.setSync(false);
    toast.success("Cihaz bildirimleri kapatıldı.");
  }

  return (
    <div
      className="min-h-16 sticky top-0 z-50 flex w-full items-center justify-between p-2"
      ref={ref}
    >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger disabled={!session}>
              Abdulleziz Corp.
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-4 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                {NavbarRoutes.map((component) => {
                  return (
                    <Item
                      key={component.title}
                      title={component.title}
                      href={component.href}
                      Icon={component.Icon}
                    >
                      {component.description}
                    </Item>
                  );
                })}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="inline-flex w-1/2 items-center justify-end gap-4">
        {session ? (
          <>
            {typeof window !== "undefined" &&
              "Notification" in window &&
              (pushSyncStore.isSync === false || pushSettingsStore.deleted) && (
                <Button
                  isLoading={pushSync.isLoading}
                  disabled={pushSync.isLoading}
                  onClick={() => void subscribe()}
                  size={"sm"}
                  variant={
                    pushSettingsStore.deleted ? "destructive" : "default"
                  }
                >
                  {/* this button will request notification perm */}
                  <BellRing className="h-5 w-5" />
                </Button>
              )}
            <CommandMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <CurrentAvatar />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={`/profiles/${session.user.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openMoneyDialog()}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Cüzdan</span>
                    <DropdownMenuShortcut className="text-green-400">
                      ${balance.toFixed()}
                    </DropdownMenuShortcut>
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
                      {hydrated && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (!pushSettingsStore.deleted) void unsubscribe();
                            else void subscribe();
                          }}
                        >
                          {pushSettingsStore.deleted ? (
                            <BellRing className="mr-2 h-4 w-4" />
                          ) : (
                            <BellOff className="mr-2 h-4 w-4" />
                          )}
                          <span>
                            {pushSettingsStore.deleted
                              ? "Bu cihaz için bildirimleri aç"
                              : "Bu cihaz için bildirimleri kapat"}
                          </span>
                        </DropdownMenuItem>
                      )}
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
          </>
        ) : (
          <Button variant="destructive" onClick={() => void signIn("discord")}>
            Giriş yap
          </Button>
        )}
      </div>
    </div>
  );
};

type ItemProps = PropsWithChildren<{
  title: string;
  href: string;
  Icon?: ReactNode;
}>;

const Item: FC<ItemProps> = ({ children, title, Icon, href }) => {
  return (
    <li>
      <NavigationMenuItem asChild>
        <Link
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          href={href}
          legacyBehavior
          passHref
        >
          <NavigationMenuLink>
            {Icon}
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    </li>
  );
};

export function CommandMenu() {
  const router = useRouter();
  const threads = useGetForumThreads();
  const crons = useGetAllCrons();
  const isSafari = useIsSafari();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const openMoneyDialog = useMoneyDialog((s) => s.setOpen);

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
        className="relative w-full items-center justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Arama yap...</span>
        <span className="inline-flex lg:hidden">Ara...</span>
        <kbd className="pointer-events-none absolute right-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">{isSafari ? "⌘" : "CTRL"}</span>K
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
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
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
              onSelect={() => runCommand(() => router.push("/store"))}
            >
              Mağazaya git
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/manage"))}
            >
              Kullanıcıları Yönet
            </CommandItem>
            <CommandItem onSelect={() => openMoneyDialog()}>
              Para Gönder
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
