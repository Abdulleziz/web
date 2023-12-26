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
import { useMediaQuery } from "@uidotdev/usehooks";

const SalaryComponent = ({
  data,
}: {
  data: BankHistoryEvent & { type: "salary" };
}) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // TODO: calculate bank salary func

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Maaş Detayı</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Maaş Detayı</DialogTitle>
            <div>
              {data.salaries.map((a) => {
                return (
                  <div
                    key={a.id}
                    className="flex flex-row items-center justify-start gap-3"
                  >
                    <p>{a.to.name ?? "Bilinmeyen"}</p>
                    <p>(${a.severity * data.multiplier})</p>
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
        <Button variant="outline">Maaş Detayı</Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <DrawerHeader>
          <DrawerTitle>Maaş Detayı</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          {data.salaries.map((a) => {
            return (
              <div
                key={a.id}
                className="flex flex-row items-center justify-center gap-3"
              >
                <p>{a.to.name ?? "bilinmeyen"}</p>
                <p>(${a.severity * data.multiplier})</p>
              </div>
            );
          })}
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Kapat</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

const InvoiceComponent = ({
  data,
}: {
  data: BankHistoryEvent & { type: "invoice" };
}) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Satın Alınanlar</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Satın Alınanlar</DialogTitle>
            <div>
              {data.entities
                .map((e) => ({ ...e, entity: getSystemEntityById(e.entityId) }))
                .map((e) => {
                  return (
                    <div
                      key={e.id}
                      className="flex flex-row items-center justify-start gap-3"
                    >
                      {e.quantity} x <EntityDetails entity={e.entity} />
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
        <Button variant="outline">Satın Alınanlar</Button>
      </DrawerTrigger>
      <DrawerContent className="flex items-center justify-center">
        <DrawerHeader>
          <DrawerTitle>Satın Alınanlar</DrawerTitle>
        </DrawerHeader>
        <div>
          {data.entities
            .map((e) => ({ ...e, entity: getSystemEntityById(e.entityId) }))
            .map((e) => {
              return (
                <div
                  key={e.id}
                  className="flex flex-row items-center justify-start gap-3"
                >
                  {e.quantity} x <EntityDetails entity={e.entity} />
                </div>
              );
            })}
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Kapat</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const columns: ColumnDef<BankHistoryEvent>[] = [
  {
    accessorKey: "type",
    header: "Tür",
    filterFn: (row, id, value: Array<string>) => {
      return value.includes(row.getValue(id));
    },
    cell: ({ row }) => {
      if (row.original.type === "transfer") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <CoinsIcon />
            <p>
              Transfer (
              {row.original.operation === "deposit" ? "yatırma" : "çekme"})
            </p>
          </div>
        );
      }
      if (row.original.type === "salary") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <BanknoteIcon />
            <p>Maaş ({row.original.multiplier}x)</p>
          </div>
        );
      }
      if (row.original.type === "invoice") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <ReceiptIcon />
            <p>Satın Alım</p>
          </div>
        );
      }
      throw new Error("unknown type for bank");
    },
  },
  {
    accessorKey: "amount",
    header: "Miktar",
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
                (acc, e) =>
                  acc + getSystemEntityById(e.entityId).price * e.quantity,
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
    accessorKey: "detail",
    header: "Detay",
    cell: ({ row }) => {
      if (row.original.type === "transfer") {
        return (
          <div className="flex flex-row items-center justify-start gap-1">
            <p>
              {row.original.reference
                ? row.original.reference.name
                : "bilinmeyen"}{" "}
              {row.original.operation === "deposit" ? "tarafından" : "tarafına"}
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
  {
    accessorKey: "date",
    header: "Tarih",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row items-center justify-start gap-1">
          <p>{row.original.createdAt.toLocaleString("tr-TR", {})}</p>
        </div>
      );
    },
  },
];
