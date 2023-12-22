import type { ColumnDef } from "@tanstack/react-table";
import { DotIcon, MoreHorizontalIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "~/components/ui/badge";
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
import {
  useCreateOrJoinCron,
  type Crons,
  useLeaveCron,
  useToggleCron,
  useCronTakeOwnership,
  type Listeners,
} from "~/utils/useCron";
import { cronToDate } from "../CreateCron/utils/cronToLocaleDate";

const ActionMenu = (Props: { cron: string; listeners: Listeners }) => {
  const { data: session } = useSession();
  const meAsListener = Props.listeners.find(
    (c) => c.listener.id === session?.user.id
  );
  const author = Props.listeners.find((c) => c.isAuthor)?.listener;
  const join = useCreateOrJoinCron();
  const leave = useLeaveCron();
  const toggle = useToggleCron();
  const takeOwnership = useCronTakeOwnership();
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DialogTrigger asChild>
            <DropdownMenuItem>Oyları Göster</DropdownMenuItem>
          </DialogTrigger>
          {!!meAsListener ? (
            <div>
              <DropdownMenuItem
                onClick={() => toggle.mutate(Props.cron)}
                disabled={toggle.isLoading || !meAsListener.isAuthor}
              >
                {Props.listeners.find((u) => u.isAuthor)?.isActive
                  ? "Kapat"
                  : "Aç"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => leave.mutate(Props.cron)}
                disabled={leave.isLoading}
              >
                Ayrıl
              </DropdownMenuItem>
            </div>
          ) : (
            <DropdownMenuItem
              onClick={() => join.mutate({ title: "31", cron: Props.cron })}
              disabled={join.isLoading}
            >
              Katıl
            </DropdownMenuItem>
          )}
          {!author && !!meAsListener && (
            <DropdownMenuItem
              disabled={!!author || !meAsListener}
              onClick={() => takeOwnership.mutate(Props.cron)}
            >
              Devral 👑
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Oylar</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<Crons[number]>[] = [
  {
    id: "actions",
    cell: ({
      row: {
        original: { cron, listeners },
      },
    }) => {
      return (
        <>
          <ActionMenu cron={cron} listeners={listeners} />
        </>
      );
    },
  },
  {
    accessorKey: "listeners",
    header: "Dinleyiciler",
    cell: ({
      row: {
        original: { listeners },
      },
    }) => {
      return (
        <>
          {listeners.map((user) => (
            <div
              key={user.id}
              className="flex flex-row items-start justify-start"
            >
              <DotIcon />
              <div>
                {user.listener.name} {user.isAuthor && "👑"}
              </div>
            </div>
          ))}
        </>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Başlık",
  },
  {
    accessorKey: "cron",
    filterFn: (row, id, value: Array<string>) => {
      const todaysDate = new Date();
      const diff =
        Math.abs(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          todaysDate.getTime() - cronToDate(row.original.cron)[0]!.getTime()
        ) / 3600000;

      const hours = Math.max(...value.map(Number));
      return diff < hours;
    },
    header: "Cron",
    cell: ({
      row: {
        original: { cron, isGlobal },
      },
    }) => {
      return (
        <div>
          <p>{cron}</p>
          <Badge>{isGlobal ? "Herkese Açık" : "Özel"}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "jobId",
    header: "Sonraki Tarih",
    filterFn: (row, id, value: Array<Date>) => {
      console.log(row);
      console.log(id);
      console.log(value);

      const fromDate = value[0]?.getTime();
      const toDate = value[1]?.getTime();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cronDate = cronToDate(row.original.cron)[0]!.getTime();
      if (toDate && fromDate) {
        return cronDate < toDate && cronDate > fromDate;
      } else return true;
    },
    cell: ({
      row: {
        original: { cron },
      },
    }) => {
      const dates = cronToDate(cron);

      return (
        <div className="flex flex-col">
          {dates.map((date) => {
            return (
              <div key={date.toString()}>{date.toLocaleString("tr-TR")}</div>
            );
          })}
        </div>
      );
    },
  },
];
