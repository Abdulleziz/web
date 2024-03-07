import { useState, type FC } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cronAsUTC3, parseCron } from "../utils/parse-cron";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import ConfirmCron from "./CronConfirm";

const predefinedCrons = {
  "Her x dakikada bir": ({ min = 1 }) => `*/${min} * * * *`,
  "Her x saatte bir": ({ hour = 1 }) => `0 */${hour} * * *`,
  "Her Gün": ({ hour = 0, min = 0 }) => `${min} ${hour} * * *`,
  "Her Haftasonu": ({ hour = 0, min = 0 }) => `${min} ${hour} * * 0,6`, // cumartesi-pazar
  "Her Haftaiçi": ({ hour = 0, min = 0 }) => `${min} ${hour} * * 1-5`, // pazartesi-cuma
  "Haftanın Belirli Günleri": ({
    hour = 0,
    min = 0,
    days,
  }: {
    hour?: number;
    min?: number;
    days: number[];
  }) => `${min} ${hour} * * ${days.join(",")}`,
} as const;

const WEEK_DAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 7, label: "Pazar" },
] as const;

const CronMaker: FC = () => {
  const [page, setPage] = useState(true);
  const [cronType, setCronType] = useState<CronType>("Her Gün");
  type WeekDayValue = (typeof WEEK_DAYS)[number]["value"];
  const [weekDays, setWeekDays] = useState(new Set<WeekDayValue>());
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  type CronType = keyof typeof predefinedCrons;
  const cronTypes = Object.keys(predefinedCrons) as CronType[];

  const requires: Record<
    CronType,
    { hours?: boolean; minutes?: boolean; weekDays?: boolean }
  > = {
    "Her x dakikada bir": { minutes: true },
    "Her x saatte bir": { hours: true },
    "Her Gün": { hours: true, minutes: true },
    "Her Haftaiçi": { hours: true, minutes: true },
    "Her Haftasonu": { hours: true, minutes: true },
    "Haftanın Belirli Günleri": { hours: true, minutes: true, weekDays: true },
  };

  const req = requires[cronType];

  const handleSubmit = () => {
    const params = {
      days: req.weekDays ? ([...weekDays] as number[]) : [],
      hour: req.hours ? hours : undefined,
      min: req.minutes ? minutes : undefined,
    } satisfies Parameters<(typeof predefinedCrons)[CronType]>[0];

    const cron = predefinedCrons[cronType](params);

    parseCron(cron, setError);
  };

  const cronConstructor = () => {
    const params = {
      days: req.weekDays ? ([...weekDays] as number[]) : [],
      hour: req.hours ? hours : undefined,
      min: req.minutes ? minutes : undefined,
    } satisfies Parameters<(typeof predefinedCrons)[CronType]>[0];

    return predefinedCrons[cronType](params);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cron Maker</CardTitle>
      </CardHeader>
      <CardContent>
        {page ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <RadioGroup defaultValue={cronType}>
              {cronTypes.map((c, i) => {
                return (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={c}
                      id={c}
                      onClick={() => {
                        setCronType(c);
                      }}
                    />
                    <Label htmlFor={c}>{c}</Label>
                  </div>
                );
              })}
            </RadioGroup>
            <Button onClick={() => setPage((a) => !a)}>Sonraki</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 ">
            {req.weekDays && (
              <div className="flex flex-col items-start justify-start gap-2 ">
                {WEEK_DAYS.map((d) => {
                  return (
                    <div
                      key={d.value}
                      className="flex items-start justify-start space-x-2"
                    >
                      <Checkbox
                        onClick={(e) => {
                          const { value } = e.currentTarget;
                          const isChecked = !weekDays.has(d.value);
                          const val = +value as WeekDayValue;
                          if (isChecked) {
                            setWeekDays((prev) => new Set([...prev, val]));
                          } else {
                            setWeekDays((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(val);
                              return newSet;
                            });
                          }
                        }}
                        id={String(d.value)}
                        value={d.value}
                      />
                      <label
                        htmlFor={String(d.value)}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {d.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            {(req.hours || req.minutes) && (
              <div className="flex flex-row items-center justify-center gap-3">
                {req.hours && (
                  <div className="w-16">
                    <Label htmlFor="hour-selector">Saat</Label>
                    <Select
                      onValueChange={(value) => {
                        setHours(Number(value));
                        handleSubmit();
                      }}
                      value={String(hours)}
                    >
                      <SelectTrigger id="hour-selector">
                        <SelectValue placeholder="Dakika" />
                      </SelectTrigger>
                      <SelectContent side="right" position="popper">
                        {Array.from({ length: 24 }, (_, i) => i).map((n) => (
                          <SelectItem
                            className={
                              n % (length / 2) === 0 ? "text-primary" : ""
                            }
                            key={`${n}_hours`}
                            value={String(n)}
                          >
                            {n < 10 ? `0${n}` : n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {req.minutes && (
                  <div className="w-16">
                    <Label htmlFor="minute-selector">Dakika</Label>
                    <Select
                      onValueChange={(value) => {
                        setMinutes(Number(value));
                        handleSubmit();
                      }}
                      value={String(minutes)}
                    >
                      <SelectTrigger id="minute-selector">
                        <SelectValue placeholder="Dakika" />
                      </SelectTrigger>
                      <SelectContent
                        side="right"
                        position="popper"
                        className=" w-16"
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map(
                          (n) =>
                            n % 5 === 0 && (
                              <SelectItem
                                className={
                                  n % (length / 2) === 0 ? "text-primary" : ""
                                }
                                key={`${n}_minutes`}
                                value={String(n)}
                                onClick={() => handleSubmit()}
                              >
                                {n < 10 ? `0${n}` : n}
                              </SelectItem>
                            )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            <Button onClick={() => setPage((a) => !a)}>Önceki</Button>
            {error && <Label color="red">{error}</Label>}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={
                    (req.weekDays && weekDays.size === 0) ||
                    (req.hours && !req.minutes && hours === 0) ||
                    (req.minutes && !req.hours && minutes === 0) ||
                    !!error
                  }
                  onClick={() => handleSubmit}
                >
                  Onayla
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cron Oluştur</DialogTitle>
                </DialogHeader>
                <ConfirmCron cron={cronAsUTC3(cronConstructor())} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CronMaker;
