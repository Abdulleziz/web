import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  HoverCardTrigger,
  HoverCard,
  HoverCardContent,
} from "~/components/ui/hover-card";
import { getSeverity } from "~/pages/manage";
import { formatName } from "~/utils/abdulleziz";
import { useVote, type VoteEventsWithMembers } from "~/utils/useDiscord";

const ActionMenu = (Props: { target: string; role: string }) => {
  const vote = useVote();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<VoteEventsWithMembers>[] = [
  {
    id: "actions",
    cell: ({
      row: {
        original: { role, target, endedAt },
      },
    }) => {
      return (
        !endedAt && <ActionMenu target={target.user.id} role={role.name} />
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
    accessorKey: "target",
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
        original: { role },
      },
    }) => {
      return role ? <div>{role.name}</div> : <div>(Unemployeed 🤣)</div>;
    },
  },
  {
    accessorKey: "votes",
    header: "Oy Verenler",
    cell: ({
      row: {
        original: { votes },
      },
    }) => {
      return (
        <HoverCard>
          <HoverCardTrigger>
            <Button variant={"ghost"}>Oy Verenler</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <ul>
              {votes.map((vote) => (
                <li
                  className="flex flex-row items-center justify-center"
                  key={vote.id}
                >
                  <p>{`${formatName(vote.voter)} (+ ${getSeverity(
                    vote.voter.roles[0]?.name
                  )} pts)`}</p>
                </li>
              ))}
            </ul>
          </HoverCardContent>
        </HoverCard>
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
];
