import { useMediaQuery } from "@uidotdev/usehooks";
import { type FC, type PropsWithChildren, useState,type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

type ResponsiveProps = PropsWithChildren<{
  triggerButtonName: string;
  headerTitle: string;
  headerDesc?: string;
  dialogFooter?: ReactNode;
}>;

const ResponsivePopup: FC<ResponsiveProps> = ({
  children,
  triggerButtonName,
  headerTitle,
  headerDesc,
  dialogFooter,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>{triggerButtonName}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{headerTitle}</DialogTitle>
            {headerDesc && <DialogDescription>{headerDesc}</DialogDescription>}
          </DialogHeader>
          {children}
          <DialogFooter>
            {dialogFooter && dialogFooter}
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
      <DrawerTrigger asChild>
        <Button>{triggerButtonName}</Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>{headerTitle}</DrawerTitle>
          {headerDesc && <DrawerDescription>{headerDesc}</DrawerDescription>}
        </DrawerHeader>
        {children}
        <DrawerFooter className="pt-2">
          {dialogFooter && dialogFooter}
          <DrawerClose asChild>
            <Button variant="outline">Kapat</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ResponsivePopup;
