import { useState, type FC } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { flushSync } from "react-dom";
import {  parseCron } from "../utils/parse-cron";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "~/components/ui/dialog";
import ConfirmCron from "./CronConfirm";
import { DialogTitle } from "@radix-ui/react-dialog";
import { cronToDate } from "../utils/cronToLocaleDate";

const CreateCustomCron: FC = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const firstDate = cronToDate(input)[0] ?? new Date();
  const diff = Math.abs(new Date().getTime() - firstDate.getTime());
  console.log(diff / (100 * 60 * 24));

  const handleSubmit = (cron: string) => {
    // manuel or predefined cron submit handler
    flushSync(() => setInput(cron));
    parseCron(cron, setError);
  };
  return (
    <Card className="flex min-h-full flex-col items-center justify-center ">
      <CardHeader>
        <CardTitle>Custom Cron</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-3">
        <Input
          placeholder="Cron... (0 8 * * 5)"
          value={input}
          onChange={(e) => handleSubmit(e.target.value)}
        />
        {error && <Label color="red">{error}</Label>}
        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={!input || (diff ?? 0) < 12}>Onayla</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cron Oluştur</DialogTitle>
            </DialogHeader>
            <ConfirmCron cron={input} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CreateCustomCron;
