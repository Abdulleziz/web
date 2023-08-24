import * as React from "react";
import { DialogClose, DialogPortal } from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { create } from "zustand";
import { Input } from "./ui/input";
import {
  SendMoneySchema,
  useGetWallet,
  useSendMoney,
} from "~/utils/usePayments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useGetAbdullezizUsersSorted } from "~/utils/useDiscord";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useSession } from "next-auth/react";
import { formatName } from "~/utils/abdulleziz";

type MoneyDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setOpen: () => void;
};

export const useMoneyDialog = create<MoneyDialog>()((set) => ({
  open: false,
  onOpenChange: (open) => set({ open }),
  setOpen: () => set(() => ({ open: true })),
}));

export const SendMoneyDialog = () => {
  const { data: session } = useSession();
  const { open, onOpenChange } = useMoneyDialog();
  const users = useGetAbdullezizUsersSorted();
  const balance = useGetWallet().data?.balance ?? 0;
  const sendMoney = useSendMoney();

  const form = useForm<SendMoneySchema>({
    resolver: zodResolver(SendMoneySchema),
  });

  function onSubmit(values: SendMoneySchema) {
    sendMoney.mutate(values, {
      onSuccess: () => {
        form.reset({ amount: 0, toId: "" });
        onOpenChange(false);
      },
    });
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            >
              <DialogHeader>
                <DialogTitle>Para Gönder</DialogTitle>
                <div className="p-4">
                  <FormField
                    rules={{ required: true }}
                    control={form.control}
                    name="toId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alıcı</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kullanıcı seç" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.data
                              ?.filter(
                                (u) => !!u.id && u.id !== session?.user.id
                              )
                              .map((u) => (
                                <SelectItem
                                  key={u.user.id}
                                  value={u.id as string}
                                >
                                  {formatName(u)}{" "}
                                  <span className="text-green-700">
                                    ({u.user.username})
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Para göndermek istediğiniz kişiyi seçin.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    rules={{ required: true }}
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Miktar</FormLabel>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => field.onChange(balance)}
                          >
                            Hepsi
                          </Button>
                        </div>
                        <FormControl>
                          <Input
                            onChange={(e) => field.onChange(+e.target.value)}
                            defaultValue={field.value}
                            inputMode="numeric"
                          />
                        </FormControl>
                        <FormDescription>
                          Göndermek istediğiniz miktarı girin.{" "}
                          <span className="text-green-700">($)</span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogDescription>Bu işlem geri alınamaz.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">İptal</Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={sendMoney.isLoading || !form.formState.isValid}
                  isLoading={sendMoney.isLoading}
                >
                  Gönder
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
