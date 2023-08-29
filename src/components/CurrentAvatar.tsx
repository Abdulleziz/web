import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useGetAbdullezizUser } from "~/utils/useDiscord";
import { getAvatarUrl } from "~/server/discord-api/utils";
import React from "react";

export const CurrentGuildAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  React.ComponentPropsWithoutRef<typeof Avatar>
>((props, ref) => {
  const { data: member } = useGetAbdullezizUser();
  const image = member ? getAvatarUrl(member.user, member.avatar) : undefined;
  return (
    <Avatar ref={ref} {...props}>
      <AvatarImage src={image} />
      <AvatarFallback>{member?.nick || member?.user.username}</AvatarFallback>
    </Avatar>
  );
});
CurrentGuildAvatar.displayName = Avatar.displayName;

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
