import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { type Meme, useInsertMeme, useDeleteMeme } from "~/utils/useForum";
import { useState } from "react";
import { DialogClose } from "@radix-ui/react-dialog";
import { Input } from "../ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import useDevice from "~/hooks/useDevice";

const ActionMenu = ({ meme }: { meme: Meme }) => {
  const [open, setOpen] = useState(false);
  const [newDescription, setDescription] = useState(meme.description);
  const { isDesktop } = useDevice();
  const insertMeme = useInsertMeme();
  const deleteMeme = useDeleteMeme();

  if (isDesktop) {
    return (
      <Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Eylemler</DropdownMenuLabel>
            <DialogTrigger asChild>
              <DropdownMenuItem>Düzenle</DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem
              onClick={() => deleteMeme.mutate(meme.id)}
              // isLoading={deleteMeme.isLoading}
              disabled={deleteMeme.isLoading}
            >
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Düzenle</DialogTitle>
          </DialogHeader>
          <Input value={meme.name} disabled />
          <Input
            disabled={insertMeme.isLoading}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            value={newDescription}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button
                onClick={() =>
                  insertMeme.mutate({
                    name: meme.name,
                    description: newDescription,
                  })
                }
                isLoading={insertMeme.isLoading}
                disabled={insertMeme.isLoading}
              >
                Onayla
              </Button>
            </DialogClose>

            <DialogClose asChild>
              <Button variant={"outline"}>Kapat</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Eylemler</DropdownMenuLabel>
          <DrawerTrigger asChild>
            <DropdownMenuItem>Düzenle</DropdownMenuItem>
          </DrawerTrigger>
          <DropdownMenuItem
            onClick={() => deleteMeme.mutate(meme.id)}
            // isLoading={deleteMeme.isLoading}
            disabled={deleteMeme.isLoading}
          >
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Düzenle</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <Input value={meme.name} disabled />
          <Input
            disabled={insertMeme.isLoading}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            value={newDescription}
          />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button
              onClick={() =>
                insertMeme.mutate({
                  name: meme.name,
                  description: newDescription,
                })
              }
              isLoading={insertMeme.isLoading}
              disabled={insertMeme.isLoading}
            >
              Onayla
            </Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant={"outline"}>Kapat</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const columns: ColumnDef<Meme>[] = [
  {
    id: "actions",
    cell: ({ row: { original } }) => {
      return <ActionMenu meme={original} />;
    },
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Kelime",
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Açıklama",
  },
];
