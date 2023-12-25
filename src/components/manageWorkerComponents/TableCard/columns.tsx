import type { ColumnDef } from "@tanstack/react-table";
import { DotIcon, MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { getRequiredSeverity } from "~/pages/manage";
import { formatName } from "~/utils/abdulleziz";
import { useVote, type VoteEventsWithMembers } from "~/utils/useDiscord";
import { getSeverity } from "~/utils/zod-utils";

const ActionMenu = (Props: {
  target: string;
  role: string;
  isEnded: boolean;
  votes: VoteEventsWithMembers["votes"];
}) => {
  const vote = useVote();

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DialogTrigger asChild>
            <DropdownMenuItem>Oyları Göster</DropdownMenuItem>
          </DialogTrigger>
          {Props.isEnded && (
            <DropdownMenuItem
              onClick={() => {
                vote.mutate({
                  user: Props.target,
                  role: Props.role,
                });
              }}
            >
              Oyla
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oylar</DialogTitle>
        </DialogHeader>
        <ul className="flex flex-col">
          {Props.votes.map((vote) => (
            <li className="" key={vote.id}>
              {`${formatName(vote.voter)} (+ ${getSeverity(
                vote.voter.roles[0]?.name
              )} pts)`}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<VoteEventsWithMembers>[] = [
  {
    id: "actions",
    cell: ({
      row: {
        original: { role, target, endedAt, votes },
      },
    }) => {
      return (
        <div className="flex flex-row items-center justify-center">
          <DotIcon color={!endedAt ? "green" : "red"} />
          {role && (
            <ActionMenu
              target={target.user.id}
              role={role.name}
              isEnded={!endedAt}
              votes={votes}
            />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "target",
    header: "Oylanan",
    cell: ({
      row: {
        original: { target },
      },
    }) => {
      return <div>{formatName(target)}</div>;
    },
  },
  {
    accessorKey: "beforeRole",
    header: "Eski Rol",
    cell: ({
      row: {
        original: { beforeRole },
      },
    }) => {
      if (beforeRole === null) return <div>(Unemployeed 🤣)</div>;
      if (beforeRole === undefined) return <div>(Deleted Role)</div>;
      return (
        <div
          style={{
            color: `#${beforeRole.color.toString(16).padStart(6, "0")}`,
          }}
        >
          {beforeRole?.name}
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Yeni Rol",
    cell: ({
      row: {
        original: { role, beforeRole },
      },
    }) => {
      if (!role) {
        return <div>(Deleted Role)</div>;
      }
      if (role.name === beforeRole?.name) {
        return <div>(Unemployeed 🤣)</div>;
      }
      return (
        <div
          style={{
            color: `#${role.color.toString(16).padStart(6, "0")}`,
          }}
        >
          {role.name}
        </div>
      );
    },
  },
  {
    accessorKey: "votes",
    header: "Toplanan",
    cell: ({
      row: {
        original: { votes },
      },
    }) => {
      const collected = votes.reduce(
        (acc, vote) => acc + getSeverity(vote.voter.roles[0]?.name),
        0
      );
      return <div>{collected} pts</div>;
    },
  },
  {
    accessorKey: "need",
    header: "Gerekli",
    cell: ({ row: { original } }) => {
      return <div>{getRequiredSeverity(original)} pts</div>;
    },
  },
];
