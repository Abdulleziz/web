import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import React from "react";

export interface SpecifiedAvatarProps
  extends React.ComponentPropsWithoutRef<typeof Avatar> {
  userId?: string; // database user id
  type?: "user" | "guild";
}

export const UserAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  SpecifiedAvatarProps
>(({ userId, type = "user", ...props }, ref) => {
  const { data: member } = useGetAbdullezizUser(userId);

  const image = member
    ? getAvatarUrl(member.user, type === "guild" ? member.avatar : undefined)
    : undefined;

  return (
    <Avatar ref={ref} {...props}>
      <AvatarImage src={image} />
      <AvatarFallback>{member?.nick || member?.user.username}</AvatarFallback>
    </Avatar>
  );
});
UserAvatar.displayName = Avatar.displayName;

export const CurrentGuildAvatar = () => <UserAvatar type="guild" />;
export const CurrentAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  React.ComponentPropsWithoutRef<typeof Avatar>
>((props, ref) => {
  const { data: session } = useSession();
  return (
    <Avatar ref={ref} {...props}>
      <AvatarImage src={session?.user.image || undefined} />
      <AvatarFallback>{session?.user.name}</AvatarFallback>
    </Avatar>
  );
});
CurrentAvatar.displayName = Avatar.displayName;
