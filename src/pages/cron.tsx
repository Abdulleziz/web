import type { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import { Layout } from "~/components/Layout";
import cronParser from "cron-parser";
import { flushSync } from "react-dom";
import { useSession } from "next-auth/react";
import classNames from "classnames";
import {
  useCreateOrJoinCron,
  useCronTakeOwnership,
  useGetAllCrons,
  useLeaveCron,
  useToggleCron,
} from "~/utils/useCron";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const maker = "https://crontab.guru/";

const calculateDiff = (cron: cronParser.CronExpression) => {
  const next = cron.next().getTime();
  const prev = cron.prev().getTime();
  const diff = (next - prev) / (1000 * 60 * 24);
  return diff;
};

// not implemented yet...
// cron input hem custom hem alttaki seçeneklerden biri olacak
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

const CronPage: NextPage = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [parser, setParser] = useState<cronParser.CronExpression | null>(null);
  const [animateRef] = useAutoAnimate();
  const [tableAnimateRef] = useAutoAnimate();

  const diff = parser ? calculateDiff(parser) : null;
  const validCron = parser ? parser.stringify() : "";
  const clone = () => cronParser.parseExpression(validCron, { utc: true });
  const nextDates = parser ? clone().iterate(5) : null;
  const nextDateString = parser
    ? clone().next().toDate().toLocaleString("tr-TR")
    : null;

  const handleSubmit = (cron: string) => {
    // manuel or predefined cron submit handler
    flushSync(() => setInput(cron));
    parseCron(cron);
  };

  const parseCron = (cron: string) => {
    try {
      if (!cron.trim()) throw new Error("Cron boş olamaz!");
      // UTC -> TR
      const i = cronParser.parseExpression(cron, { utc: true });
      // 3 saat geri al
      const fields = UTCtoTR(i);
      const iAsTR = cronParser.fieldsToExpression(fields);
      setParser(iAsTR);

      if (calculateDiff(i) >= 12) setError(null);
      else
        setError(
          "Hatırlatıcı en az 12 saat aralıklarla olmalı! (api ödiyecek paramız yok :D)"
        );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        setParser(null);
      }
    }
  };

  return (
    <Layout>
      <div>
        <div className="flex flex-col items-center justify-center gap-4 p-4">
          <div className="flex gap-4">
            <p>Hatırlatıcı</p> -{" "}
            <a className="link-primary link" target="_blank" href={maker}>
              Make Cron
            </a>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="mockup-window border bg-base-300">
          <div className="flex flex-col items-center justify-center gap-4 bg-base-200 px-4 py-16 md:flex-row">
            <div className="flex items-center justify-center" ref={animateRef}>
              <CronMaker handleSubmit={handleSubmit} />
            </div>
            <div className=" divider divider-vertical md:divider-horizontal">
              Veya
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                className="input"
                placeholder="Cron... (0 8 * * 5)"
                value={input}
                onChange={(e) => handleSubmit(e.target.value)}
              />
              <label
                htmlFor="create-cron"
                className={classNames("btn-success btn-sm btn", {
                  ["btn-disabled"]: !input || (diff ?? 0) < 12,
                })}
              >
                Oluştur
              </label>
            </div>
          </div>
          <div className="flex flex-row items-center justify-center gap-4">
            {!!nextDateString && (
              <>
                <div>
                  <span className="text-info">Sonraki hatırlatıcı: </span>
                  <p>{nextDateString}</p>
                </div>
                <label htmlFor="next-dates" className="btn-xs btn">
                  Hepsini göster
                </label>
              </>
            )}
            <p className="text-error">{error}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-8" ref={tableAnimateRef}>
        <CronTable handleSubmit={handleSubmit} />
      </div>
      {!!nextDates && (
        <div>
          <input type="checkbox" className="modal-toggle" id="next-dates" />
          <div className="modal">
            <div className="modal-box">
              <h3 className="font-bold">Sonraki Hatırlatıcılar</h3>
              <ul className="gap-2 p-4">
                {nextDates
                  .map((date) => date.toDate().toLocaleString("tr-TR"))
                  .map((date) => (
                    <li className="list-disc text-xl text-accent" key={date}>
                      {date}
                    </li>
                  ))}
              </ul>
              <div className="modal-action">
                <label htmlFor="next-dates" className="btn">
                  Kapat
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      <CronCreate key={validCron} cron={validCron} />
    </Layout>
  );
};

const CronMaker: React.FC<{ handleSubmit: (cron: string) => void }> = ({
  handleSubmit: submitCron,
}) => {
  type Page = keyof typeof predefinedCrons;
  const pages = Object.keys(predefinedCrons) as Page[];

  const requires: Record<
    Page,
    { hours?: boolean; minutes?: boolean; weekDays?: boolean }
  > = {
    "Her x dakikada bir": { minutes: true },
    "Her x saatte bir": { hours: true },
    "Her Gün": { hours: true, minutes: true },
    "Her Haftaiçi": { hours: true, minutes: true },
    "Her Haftasonu": { hours: true, minutes: true },
    "Haftanın Belirli Günleri": { hours: true, minutes: true, weekDays: true },
  };

  const [page, setPage] = useState<Page>("Her Gün");
  const [isPageActive, setIsPageActive] = useState(false);

  const { HourSelection, hours, minutes } = useHourSelect();
  const { WeekDaySelection, weekDays } = useWeeksDaySelect();

  const handleSubmit = () => {
    const req = requires[page];
    const params = {
      days: req.weekDays ? ([...weekDays] as number[]) : [],
      hour: req.hours ? hours : undefined,
      min: req.minutes ? minutes : undefined,
    } satisfies Parameters<(typeof predefinedCrons)[Page]>[0];

    const cron = predefinedCrons[page](params);
    submitCron(cron);
  };

  switch (isPageActive) {
    case false: {
      return (
        <div className="flex flex-col gap-2" key={1}>
          <h4>Nasıl uyarılmak istiyorsun?</h4>
          <div className="form-control">
            {pages.map((p, i) => (
              <label key={i} className="label cursor-pointer">
                <input
                  type="radio"
                  className="radio checked:bg-white"
                  checked={p === page}
                  onChange={() => setPage(p)}
                />
                <span className="label-text">{p}</span>
              </label>
            ))}
          </div>
          <button className="btn-sm btn" onClick={() => setIsPageActive(true)}>
            Devam
          </button>
        </div>
      );
    }
    case true: {
      const req = requires[page];
      return (
        <div className="flex flex-col gap-2" key={2}>
          {req.weekDays && (
            <>
              <p> Hatırlatıcı hangi günler olsun?</p>
              <WeekDaySelection />
            </>
          )}
          <p>{page}</p>
          {(req.hours || req.minutes) && (
            <HourSelection
              onlyShow={
                req.hours && req.minutes
                  ? undefined // both
                  : req.hours
                  ? "hours"
                  : "mins"
              }
            />
          )}
          <button className="btn-sm btn" onClick={() => setIsPageActive(false)}>
            Geri dön
          </button>
          <button
            className="btn-sm btn"
            onClick={handleSubmit}
            disabled={
              (req.weekDays && weekDays.size === 0) ||
              (req.hours && !req.minutes && hours === 0) ||
              (req.minutes && !req.hours && minutes === 0)
            }
          >
            Bunu kullan
          </button>
        </div>
      );
    }
  }
};

const useWeeksDaySelect = () => {
  const WEEKDAYS = [
    { value: 1, label: "Pazartesi" },
    { value: 2, label: "Salı" },
    { value: 3, label: "Çarşamba" },
    { value: 4, label: "Perşembe" },
    { value: 5, label: "Cuma" },
    { value: 6, label: "Cumartesi" },
    { value: 7, label: "Pazar" },
  ] as const;
  type WeekDayValue = (typeof WEEKDAYS)[number]["value"];
  const [weekDays, setWeekDays] = useState(new Set<WeekDayValue>());
  const WeekDaySelection = () => {
    return (
      <div className="form-control">
        {WEEKDAYS.map((day) => (
          <label key={day.value} className="label cursor-pointer">
            <input
              type="checkbox"
              className="checkbox"
              value={day.value}
              checked={weekDays.has(day.value)}
              onChange={(e) => {
                // weekday selection append or remove
                const { checked, value } = e.target;
                const val = +value as WeekDayValue;
                if (checked) {
                  // append
                  setWeekDays((prev) => new Set([...prev, val]));
                } else {
                  // remove
                  setWeekDays((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(val);
                    return newSet;
                  });
                }
              }}
            />
            <span className="label-text">{day.label}</span>
          </label>
        ))}
      </div>
    );
  };
  return { WeekDaySelection, weekDays };
};

const useHourSelect = () => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const Values = ({ length }: { length: number }) => (
    <>
      {Array.from({ length }, (_, i) => i).map((n) => (
        <option
          className={n % (length / 2) === 0 ? "text-primary" : ""}
          key={n}
          value={n}
        >
          {n < 10 ? `0${n}` : n}
        </option>
      ))}
    </>
  );

  const HourSelection = ({ onlyShow }: { onlyShow?: "hours" | "mins" }) => {
    return (
      <div className="container mx-auto p-3">
        <div className="inline-flex rounded-md p-2 text-lg shadow-lg">
          {onlyShow !== "mins" && (
            <select
              value={hours}
              onChange={(event) => setHours(+event.target.value)}
              className="select-accent select"
            >
              <Values length={24} />
            </select>
          )}

          {!onlyShow && <span className="p-2">:</span>}

          {onlyShow !== "hours" && (
            <select
              value={minutes}
              onChange={(event) => setMinutes(+event.target.value)}
              className="select-accent select"
            >
              <Values length={60} />
            </select>
          )}
        </div>
        <button
          className="btn-secondary btn-xs btn m-3"
          onClick={() => {
            setHours(0);
            setMinutes(0);
          }}
        >
          Sıfırla
        </button>
      </div>
    );
  };
  return { HourSelection, hours, minutes };
};

const CronCreate: React.FC<{ cron: string }> = ({ cron }) => {
  const [title, setTitle] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const tip =
    "Eğer bana özel işaretliyse, hatırlatıcıyı sadece sen görebilirsin.";

  const labelRef = useRef<HTMLLabelElement>(null);
  const create = useCreateOrJoinCron();
  return (
    <>
      <input type="checkbox" id="create-cron" className="modal-toggle" />
      <label
        htmlFor="create-cron"
        className="modal cursor-pointer"
        ref={labelRef}
      >
        <label className="modal-box relative" htmlFor="">
          <h3 className="text-lg font-bold">
            Hatırlatıcı Oluştur <span className="text-error">*</span>
          </h3>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <p>Başlık</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-primary input"
              type="text"
            />
            <div className="tooltip" data-tip={tip}>
              <p>Bana özel </p>
              <span className="text-error">?</span>
            </div>
            <input
              className="checkbox"
              type="checkbox"
              checked={!isGlobal}
              onChange={() => setIsGlobal((prev) => !prev)}
            />
            <p>Cron: </p> <p>{cron} (UTC)</p>
          </div>
          <div className="modal-action">
            <label className={"btn-warning btn"} htmlFor="create-cron">
              Kapat
            </label>
            <button
              className={classNames("btn-primary btn", {
                ["loading"]: create.isLoading,
              })}
              disabled={!cron || !title.trim() || create.isLoading}
              onClick={() =>
                create.mutate(
                  { title, cron, isGlobal },
                  { onSettled: () => labelRef.current?.click() }
                )
              }
            >
              Oluştur
            </button>
          </div>
        </label>
      </label>
    </>
  );
};

const CronTable: React.FC<{ handleSubmit: (cron: string) => void }> = ({
  handleSubmit,
}) => {
  const router = useRouter();
  const routerExp = router.query.exp as string | undefined;
  const { data: session } = useSession();
  const { data } = useGetAllCrons();
  const join = useCreateOrJoinCron();
  const leave = useLeaveCron();
  const toggle = useToggleCron();
  const takeOwnership = useCronTakeOwnership();
  const [rowAnimateRef] = useAutoAnimate();

  const routerRowRef = useRef<HTMLTableCellElement | null>(null);
  const focusedCron = data?.find((j) => j.cron === routerExp)?.id;
  const formatName = (
    l: NonNullable<typeof data>[number]["listeners"][number]
  ) => (l.isAuthor ? `${l.listener.name ?? "Unknown"} 👑` : l.listener.name);

  // focus on the row that is in the url
  useEffect(() => {
    if (routerExp && focusedCron) {
      void new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
        if (routerRowRef.current)
          routerRowRef.current.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [focusedCron, routerExp]);

  if (!session || !data || !data.length) return <></>;
  return (
    <div className="w-full overflow-x-auto">
      <table className="table w-full">
        {/* head */}
        <thead>
          <tr>
            <td>Katılımcılar</td>
            <td>Başlık</td>
            <td>Cron (UTC)</td>
            <td>Hepsi: {data.length}</td>
          </tr>
        </thead>
        <tbody ref={rowAnimateRef}>
          {/* row 1 */}
          {data.map((job) => {
            const author = job.listeners.find((c) => c.isAuthor)?.listener;
            const meAsListener = job.listeners.find(
              (c) => c.listener.id === session.user.id
            );
            return (
              <tr
                key={job.id}
                className="outline outline-dotted outline-1 outline-secondary"
              >
                <td>
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12">
                        <div className="avatar-group -space-x-6">
                          {job.listeners.map((c) => (
                            <div key={c.listener.id} className="avatar">
                              <div className="w-12">
                                {c.listener.image && (
                                  <Image
                                    src={c.listener.image}
                                    alt="User avatar"
                                    width={128}
                                    height={128}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className=" font-normal sm:visible sm:text-base">
                        <div>
                          <input
                            type="checkbox"
                            id={job.jobId}
                            className="modal-toggle"
                          />
                          <div className="modal">
                            <div className="modal-box">
                              <h3 className="font-bold">Subscribed Users</h3>
                              <ul className="ml-4">
                                {job.listeners.map((c) => (
                                  <li className="list-disc" key={c.id}>
                                    {formatName(c)}
                                  </li>
                                ))}
                              </ul>
                              <div className="modal-action">
                                <label htmlFor={job.jobId} className="btn">
                                  Close
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        {job.listeners.length < 4 ? (
                          <div>
                            <div className=" invisible relative top-4 text-[1px] font-normal sm:visible sm:text-base">
                              {job.listeners.map(formatName).join(", ")}
                            </div>
                            <label className="visible sm:btn-disabled sm:invisible">
                              {job.listeners[0] && formatName(job.listeners[0])}{" "}
                              {job.listeners.length !== 1 && "and "}
                              {job.listeners.length - 1 !== 0 ? (
                                <label
                                  htmlFor={job.jobId}
                                  className="btn-xs btn visible sm:btn-disabled sm:invisible"
                                >
                                  {job.listeners.length - 1} more Users
                                </label>
                              ) : (
                                <></>
                              )}
                            </label>
                          </div>
                        ) : (
                          <label>
                            {job.listeners[0]?.listener.name} and{" "}
                            <label htmlFor={job.jobId} className=" btn-xs btn">
                              {job.listeners.length - 1} more Users
                            </label>
                          </label>
                        )}
                      </div>
                    </div>
                    {!author && !!meAsListener && (
                      <div className="tooltip" data-tip="Sahipliği devral">
                        <button
                          disabled={!!author || !meAsListener}
                          onClick={() => takeOwnership.mutate(job.cron)}
                          className={classNames(
                            "btn-square btn-xs btn place-self-center",
                            { ["loading"]: takeOwnership.isLoading }
                          )}
                        >
                          👑
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {job.title}
                  <br />
                  <span className="badge-ghost badge badge-sm">
                    {job.isGlobal ? "Global" : "Özel"}
                  </span>
                </td>
                <td
                  ref={routerExp === job.cron ? routerRowRef : undefined}
                  className={
                    // TODO: popup modal instead
                    routerExp === job.cron
                      ? "text-2xl font-bold text-primary"
                      : ""
                  }
                >
                  {job.cron}
                  <br />
                  <label
                    htmlFor="next-dates"
                    className="btn-xs btn"
                    onClick={() => handleSubmit(job.cron)}
                  >
                    tarihler
                  </label>
                  <br />
                  {routerExp === job.cron && (
                    <span className="badge-ghost badge">
                      Tıkladığınız hatırlatıcı
                    </span>
                  )}
                </td>
                <td>
                  {!!meAsListener ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggle.mutate(job.cron)}
                        disabled={toggle.isLoading || !meAsListener.isAuthor}
                        className={classNames("btn-warning btn-xs btn", {
                          ["loading"]: toggle.isLoading,
                        })}
                      >
                        {job.listeners.find((u) => u.isAuthor)?.isActive
                          ? "Kapat"
                          : "Aç"}
                      </button>
                      <button
                        onClick={() => leave.mutate(job.cron)}
                        disabled={leave.isLoading}
                        className={classNames("btn-error btn-xs btn", {
                          ["loading"]: leave.isLoading,
                        })}
                      >
                        Ayrıl
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <button
                        onClick={() =>
                          join.mutate({ title: "31", cron: job.cron })
                        }
                        disabled={join.isLoading}
                        className={classNames("btn-success btn-xs btn", {
                          ["loading"]: join.isLoading,
                        })}
                      >
                        Katıl
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* foot */}
        <tfoot>
          <tr>
            <td>Katılımcılar</td>
            <td>Başlık</td>
            <td>Cron (UTC)</td>
            <td>Hepsi: {data.length}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

function noDuplicate<T>(params: T[]) {
  return params.filter((v, i) => i === params.indexOf(v));
}

export function UTCtoTR(i: cronParser.CronExpression) {
  // hiç kullanışlı olmayan, crondan 3 saat çıkaran bir fonksiyon
  // eminim ki buglu, but who cares 😎😁🤣
  // CONFIRMED BUG: cron: ayın ilk gününde ilk 3 saat içinde ise, ay değişmiyor.
  const dayDiff = i.fields.hour.some((h) => h <= 3);
  // 22 23 0 1 2 3 4 // eğer 3 saat çıkarırsak
  // UTC...|........ // gün değişir, ve hafta
  // TR..........|.. // ve aylar...
  const dayOfWeek = i.fields.dayOfWeek.map((d) =>
    // S M T W T F S
    // 0 1 2 3 4 5 6
    // 7
    dayDiff ? (d === 0 || d === 7 ? 6 : d - 1) : d
  );
  const dayOfMonth =
    i.fields.dayOfMonth.length !== 31
      ? i.fields.dayOfMonth.map((d) =>
          // if last day -> remain same
          // if not last day and dayDiff -> -1
          // if first day and dayDiff -> (L)ast day
          dayDiff && d !== "L" ? (d === 1 ? "L" : d - 1) : d
        )
      : [...i.fields.dayOfMonth];
  const fields: typeof i.fields = {
    ...i.fields,
    hour: i.fields.hour.map((h) =>
      h < 3 ? h + 21 : h - 3
    ) as typeof i.fields.hour,
    dayOfWeek: noDuplicate(dayOfWeek) as typeof i.fields.dayOfWeek,
    dayOfMonth: noDuplicate(dayOfMonth) as typeof i.fields.dayOfMonth,
    // TODO: month handling...
  };
  return fields;
}

export default CronPage;
