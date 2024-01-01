import {
  BanknoteIcon,
  BellDotIcon,
  CoffeeIcon,
  Flag,
  Loader2,
  MessageCircleMore,
  ReceiptIcon,
  ShellIcon,
} from "lucide-react";
import Image from "next/image";
import { getAvatarUrl } from "~/server/discord-api/utils";
import { formatName, requiredSeverity } from "~/utils/abdulleziz";
import { useGetProfile } from "~/utils/useProfile";
import { type UserId } from "~/utils/zod-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { cx } from "class-variance-authority";

type ProfileProps = { profileId: UserId };

export const Profile = ({ profileId }: ProfileProps) => {
  const { data: user, isLoading } = useGetProfile(profileId);
  if (isLoading || !user)
    // TODO: skeleton
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div role="status">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </div>
    );

  const userImage = user.image;
  const memberImage =
    !!user.member.avatar &&
    getAvatarUrl(
      { avatar: user.image, id: user.member.user.id },
      user.member.avatar
    );
  // const topRole = user.member.roles[0];

  // const style = topRole
  //   ? {
  //       color: `#${topRole.color.toString(16)}`,
  //     }
  //   : { color: "white" };
  return (
    <div className="flex h-screen flex-col items-center justify-center text-zinc-300">
      <div className="rounded p-10">
        <div className="flex items-center ">
          <div className="mr-20">
            <h3 className="text-4xl font-extrabold">{user.name}</h3>
            <h4 className="text-xl font-bold">{formatName(user.member)}</h4>
            {user.member.roles.map((role, i) => (
              <span
                key={role.id}
                className={cx(
                  "font-mono text-xl underline underline-offset-8",
                  i !== 0 && "ml-2"
                )}
              >
                {role.name}
              </span>
            ))}
          </div>
          {memberImage && (
            <Image
              alt="Member Image"
              src={memberImage}
              className="w-32 rounded-full"
              width={128}
              height={128}
            />
          )}
          {userImage && (
            <Image
              alt="User Image"
              src={userImage}
              className="w-32 rounded-full"
              width={128}
              height={128}
            />
          )}
        </div>
        {/* STATS */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="flex flex-row items-center rounded p-3">
            <ShellIcon className="h-8 w-8" />
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.forumThreads}
              </span>
              <span>Forum Thread</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded p-2">
            <MessageCircleMore className="h-8 w-8" />
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.forumPosts}
              </span>
              <span>Forum Post</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded p-2">
            <BellDotIcon className="h-8 w-8" />
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.listenedCrons}
              </span>
              <span>Aktif Dinlenen hatırlatıcılar</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded p-2">
            <BanknoteIcon className="h-8 w-8" />
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                0{/* {user._count.paymentsReceived} */}
              </span>
              <span>Maaş/Transfer Alma</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded p-2">
            <ReceiptIcon className="h-8 w-8" />
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                0{/* {user._count.paymentsSent} */}
              </span>
              <span>Maaş/Transfer Gönderme</span>
            </div>
          </div>
          <div className="flex flex-row items-center rounded p-2">
            <CoffeeIcon className="h-8 w-8" />
            <div className="ml-4 flex flex-col">
              <span className="ml-1 text-xl font-bold">
                {user._count.teaConsumer}
              </span>
              <span>içilen çay sayısı</span>
            </div>
          </div>
        </div>
        <div className="p-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="perms">
              <AccordionTrigger>Yetkileri göster</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  {user.member.perms.map((perm) => {
                    const metadata = requiredSeverity.find(
                      (p) => p.perm === perm
                    );
                    if (!metadata) return null;
                    const special = "every" in metadata || "some" in metadata;
                    return (
                      <div key={perm} className="flex flex-row p-1">
                        <Flag
                          className={cx("h-8 w-8", special && "fill-zinc-500")}
                        />
                        <span className="ml-2">{perm}</span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};
