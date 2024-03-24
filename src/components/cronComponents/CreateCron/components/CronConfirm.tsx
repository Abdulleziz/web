import { DialogClose } from "@radix-ui/react-dialog";
import { useState, type FC } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useCreateOrJoinCron } from "~/utils/useCron";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import cronParser from "cron-parser";

const ConfirmCron: FC<{
  cron: string;
}> = ({ cron }) => {
  const [title, setTitle] = useState("");
  const [isGlobal, setIsGlobal] = useState<boolean>(true);
  const create = useCreateOrJoinCron();
  const nextDates = cronParser
    .parseExpression(cron, { utc: true })
    .iterate(5)
    .map((d) => d.toDate());
  const nextDate = nextDates[0];

  return (
    <div className="flex flex-col items-start justify-start gap-5">
      <div>
        <Label htmlFor="title-input">İsim</Label>
        <Input
          id="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="items-top flex space-x-2">
        <Checkbox id="isGlobal" onClick={() => setIsGlobal((a) => !a)} />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="isGlobal"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Bana Özel
          </label>
          <p className="text-sm text-muted-foreground">
            İşaretliyse sadece sana gözükür.
          </p>
        </div>
      </div>
      <p>{`${cron} (UTC)`}</p>
      {nextDate && (
        <p>Sonraki Hatırlatıcı {nextDate.toLocaleString("tr-TR")}</p>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button>Bütün Tarihleri Göster</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tarihler</DialogTitle>
          </DialogHeader>

          {nextDates?.map((date) => (
            <li key={date.toString().length}>{date.toLocaleString("tr-TR")}</li>
          ))}
        </DialogContent>
      </Dialog>
      <DialogClose asChild>
        <Button
          onClick={() => {
            create.mutate({ title, cron, isGlobal });
          }}
          disabled={!title}
        >
          Onayla
        </Button>
      </DialogClose>
    </div>
  );
};

export default ConfirmCron;
