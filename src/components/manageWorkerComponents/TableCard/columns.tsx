import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
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
import { getRequiredSeverity, getSeverity } from "~/pages/manage";
import { formatName } from "~/utils/abdulleziz";
import { useVote, type VoteEventsWithMembers } from "~/utils/useDiscord";

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
        <ActionMenu
          target={target.user.id}
          role={role.name}
          isEnded={!endedAt}
          votes={votes}
        />
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
      return beforeRole ? (
        <div>{beforeRole?.name}</div>
      ) : (
        <div>(Unemployeed 🤣)</div>
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
      if (role.name === beforeRole?.name) {
        return <div>(Unemployeed 🤣)</div>;
      }
      return role ? <div>{role.name}</div> : <div>(Unemployeed 🤣)</div>;
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
