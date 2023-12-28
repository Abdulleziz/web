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
import { type Meme, useInsertMeme } from "~/utils/useForum";
import { useMediaQuery } from "@uidotdev/usehooks";
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

const ActionMenu = (Props: { memeName: string; memeDesc: string }) => {
  const [open, setOpen] = useState(false);
  const [Description, setDescription] = useState(Props.memeDesc);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const insertMeme = useInsertMeme();

  if (!isDesktop) {
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DrawerTrigger asChild>
              <DropdownMenuItem>Düzenle</DropdownMenuItem>
            </DrawerTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Düzenle</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col items-center justify-center gap-3 p-4">
            <Input value={Props.memeName} disabled />
            <Input
              defaultValue={Props.memeDesc}
              disabled={insertMeme.isLoading}
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              value={Description}
            />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button
                onClick={() =>
                  insertMeme.mutate({
                    name: Props.memeName,
                    description: Description,
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
  }
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
            <DropdownMenuItem>Düzenle</DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Düzenle</DialogTitle>
        </DialogHeader>
        <Input value={Props.memeName} disabled />
        <Input
          defaultValue={Props.memeDesc}
          disabled={insertMeme.isLoading}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
          value={Description}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button
              onClick={() =>
                insertMeme.mutate({
                  name: Props.memeName,
                  description: Description,
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
};

export const columns: ColumnDef<Meme>[] = [
  {
    id: "actions",
    cell: ({
      row: {
        original: { name, description },
      },
    }) => {
      return <ActionMenu memeName={name} memeDesc={description} />;
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
