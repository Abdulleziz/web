import React from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { useGetProfile } from "~/utils/useProfile";
import { cx } from "class-variance-authority";

type UserData = {
  id: string;
  name: string | null;
  image: string | null;
};

export interface AbdullezizUserProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  data: UserData;
  fallback?: React.ReactNode;
}

export const AbdullezizUser = React.forwardRef<
  React.ElementRef<typeof Button>,
  AbdullezizUserProps
>(({ data: { id, name, image }, variant, size, fallback, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const profile = useGetProfile(id, { enabled: isVisible });
  const avatar = image ?? profile.data?.image;
  return (
    <HoverCard open={isVisible} onOpenChange={setIsVisible}>
      <HoverCardTrigger asChild>
        <Link href={`/profiles/${id}`}>
          <Button
            className="max-w-[15rem] truncate"
            size={size || "sm"}
            variant={variant || "outline"}
            ref={ref}
            {...props}
          >
            <Avatar className={cx(size === "lg-long" ? "h-8 w-8" : "h-4 w-4")}>
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback>{fallback ?? name}</AvatarFallback>
            </Avatar>
            {name}
          </Button>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-70" side="top">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback>{name}</AvatarFallback>
          </Avatar>
          {profile.isLoading && <Button isLoading />}
          {profile.status === "success" && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">
                @{profile.data.member.user.username || name}
              </h4>
              <p className="text-sm">Abdülleziz ailesinden bir üye</p>
              <div className="flex items-center pt-2">
                <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
                <span className="text-xs text-muted-foreground">
                  {new Date(profile.data.member.joined_at).toLocaleString(
                    "tr-TR",
                    { month: "long", year: "numeric" }
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});

AbdullezizUser.displayName = "AbdullezizUser";
