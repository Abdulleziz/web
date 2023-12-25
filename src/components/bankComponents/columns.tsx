import type { ColumnDef } from "@tanstack/react-table";
import { type BankHistoryEvent } from "~/utils/useBank";
import { CoinsIcon, BanknoteIcon, ReceiptIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { useState } from "react";
import { getSystemEntityById } from "~/utils/entities";
import { EntityDetails } from "../../pages/store/EntityCard";

const SalaryComponent = (Props: {
  data: BankHistoryEvent & { type: "salary" };
}) => {
  const [open, setOpen] = useState(false);
  const isDesktop = true; //useMediaQuery("(min-width: 768px)");

  // TODO: calculate bank salary func

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Salary Details</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Salary Details</DialogTitle>
            <div>
              {Props.data.salaries.map((a) => {
                return (
                  <div
                    key={a.id}
                    className="flex flex-row items-center justify-start gap-3"
                  >
                    <p>{a.toId}</p>
                    <p>(${a.severity * Props.data.multiplier})</p>
                  </div>
                );
              })}
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Salary Details</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          {Props.data.salaries.map((a) => {
            return (
              <div
                key={a.id}
                className="flex flex-row items-center justify-start gap-3"
              >
                <p>{a.toId}</p>
                <p>(${a.severity * Props.data.multiplier})</p>
              </div>
            );
          })}
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const InvoiceComponent = (Props: {
  data: BankHistoryEvent & { type: "invoice" };
}) => {
  const [open, setOpen] = useState(false);
  const isDesktop = true; //useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Invoice Entities</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invoice Entities</DialogTitle>
            <div>
              {Props.data.entities
                .map((a) => getSystemEntityById(a.entityId))
                .map((entity) => {
                  return (
                    <div
                      key={entity.id}
                      className="flex flex-row items-center justify-start gap-3"
                    >
                      <EntityDetails entity={entity} />
                    </div>
                  );
                })}
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Invoice Entities</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Invoice Entities</DrawerTitle>
        </DrawerHeader>
        <div>
          {Props.data.entities
            .map((a) => getSystemEntityById(a.entityId))
            .map((entity) => {
              return (
                <div
                  key={entity.id}
                  className="flex flex-row items-center justify-start gap-3"
                >
                  <EntityDetails entity={entity} />
                </div>
              );
            })}
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const columns: ColumnDef<BankHistoryEvent>[] = [
  {
    accessorKey: "type",
    header: "Type",
    filterFn: (row, id, value: Array<string>) => {
      return value.includes(row.getValue(id));
    },
    cell: ({ row }) => {
      if (row.original.type === "transfer") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <CoinsIcon />
            <p>Transfer ({row.original.operation})</p>
          </div>
        );
      }
      if (row.original.type === "salary") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <BanknoteIcon />
            <p>Salary ({row.original.multiplier}x)</p>
          </div>
        );
      }
      if (row.original.type === "invoice") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <ReceiptIcon />
            <p>Invoice</p>
          </div>
        );
      }
      throw new Error("unknown type for bank");
    },
  },
  {
    accessorKey: "id",
    header: "Amount",
    cell: ({ row }) => {
      if (row.original.type === "transfer") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <p>${row.original.amount}</p>
          </div>
        );
      }
      if (row.original.type === "salary") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <p>
              $
              {row.original.multiplier *
                row.original.salaries.reduce((p, c) => p + c.severity, 0)}
            </p>
          </div>
        );
      }
      if (row.original.type === "invoice") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <p>
              $
              {row.original.entities.reduce(
                (acc, e) => acc + getSystemEntityById(e.entityId).price,
                0
              )}
            </p>
          </div>
        );
      }
      throw new Error("unknown type for bank");
    },
  },
  {
    accessorKey: "id",
    header: "Details",
    cell: ({ row }) => {
      if (row.original.type === "transfer") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <p>
              from{" "}
              {row.original.referenceId ? row.original.referenceId : "unknown"}
            </p>
          </div>
        );
      }
      if (row.original.type === "salary") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <SalaryComponent data={row.original} />
          </div>
        );
      }
      if (row.original.type === "invoice") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <InvoiceComponent data={row.original} />
          </div>
        );
      }
      throw new Error("unknown type for bank");
    },
  },
];
