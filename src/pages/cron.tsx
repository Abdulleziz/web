import type { NextPage } from "next";
import { useRef, useState } from "react";
import { Layout } from "~/components/Layout";
import cronParser from "cron-parser";
import { flushSync } from "react-dom";
import { useSession } from "next-auth/react";
import classNames from "classnames";
import {
  useCreateOrJoinCron,
  useGetAllCrons,
  useLeaveCron,
} from "~/utils/useCron";
import cron from "./api/cron";

const maker = "https://crontab.guru/";

const calculateDiff = (cron: cronParser.CronExpression) => {
  const next = cron.next().getTime();
  const prev = cron.prev().getTime();
  const diff = (next - prev) / (1000 * 60 * 24);
  return diff;
};

// not implemented yet...
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// cron input hem custom hem alttaki seçeneklerden biri olacak
const predefinedCrons = {
  "Her x dakikada bir": (min = 1) => `*/${min} * * * *`,
  "Her x saatte bir": (hour = 1) => `0 */${hour} * * *`,
  "Her Gün": (hour = 0, min = 0) => `${min} ${hour} * * *`,
  "Her Haftasonu": (hour = 0, min = 0) => `${min} ${hour} * * 0,6`, // cumartesi-pazar
  "Her Haftaiçi": (hour = 0, min = 0) => `${min} ${hour} * * 1-5`, // pazartesi-cuma
} as const;

const CronPage: NextPage = () => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [parser, setParser] = useState<cronParser.CronExpression | null>(null);

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
          <div className="border p-2">
            <h1 className="bg-error font-extrabold">
              WORK IN PROGRESS ÇALIŞMIO HENÜZ ELLEŞMEİN
            </h1>
            <CronMaker />
          </div>
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
          <div className="flex justify-center gap-4 bg-base-200 px-4 py-16">
            <input
              type="text"
              className="input"
              placeholder="Cron... (0 8 * * 5)"
              value={input}
              onChange={(e) => handleSubmit(e.target.value)}
            />
            <label
              htmlFor="create-cron"
              className={classNames("btn", {
                ["btn-disabled"]: !input || (diff ?? 0) < 12,
              })}
            >
              Oluştur
            </label>
          </div>
          <div className="flex flex-row items-center justify-center gap-4">
            {!!nextDateString && (
              <>
                <div>
                  <span className="text-info">Sonraki hatırlatıcı: </span>
                  <p>{nextDateString}</p>
                </div>
                <label htmlFor="test-modal" className="btn-xs btn">
                  Hepsini göster
                </label>
              </>
            )}
            <p className="text-error">{error}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-8">
        <CronTable />
      </div>
      {!!nextDates && (
        <div>
          <input type="checkbox" className="modal-toggle" id="test-modal" />
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
                <label htmlFor="test-modal" className="btn">
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

const CronMaker: React.FC = () => {
  const [page, setPage] = useState(0);
  const [tags, setTags] = useState(new Set<string>());
  const [renderWeekDays, setRenderWeekDays] = useState(false);
  const [renderMonthDays, setRenderMonthDays] = useState(false);
  const [isInputValid, setIsInputValid] = useState<boolean>(true);
  const [cronDetails, setCronDetails] = useState({
    hours: "0",
    minutes: "0",
    month: "*",
    dayMonth: "*",
    dayWeek: "*",
  });
  console.log(cronDetails);
  const tagRef =
    useRef<HTMLInputElement>() as React.MutableRefObject<HTMLInputElement>;

  const handleAddTag = () => {
    if (tagRef.current && tagRef.current.value === "") return;

    // Convert the input to a number
    const tagValue = parseInt(tagRef.current?.value ?? "");

    // Only add the tag if it is a number between 1 and 31
    if (!isNaN(tagValue) && tagValue >= 1 && tagValue <= 31) {
      const newTagSet = new Set([...tags, tagRef.current.value]);
      setTags(newTagSet);
      tagRef.current.value = "";

      // Assign the tags to the dayMonth variable
      const dayMonthTags = Array.from(newTagSet).sort().join(",");
      setCronDetails((old) => ({
        ...old,
        dayMonth: dayMonthTags,
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((old) => new Set([...old].filter((t) => tag !== t)));

    // Remove the tag from the dayMonth variable
    setCronDetails((old) => ({
      ...old,
      dayMonth: [...old.dayMonth.split(",").filter((t) => tag !== t)].join(","),
    }));
  };

  const handleInputChange = () => {
    const tagValue = parseInt(tagRef.current?.value ?? "");

    // Check if the input is a number between 1 and 31
    if (isNaN(tagValue) || tagValue < 1 || tagValue > 31) {
      setIsInputValid(false);
    } else {
      setIsInputValid(true);
    }
  };
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    if (value === "weekDays") {
      setRenderWeekDays(true);
      setRenderMonthDays(false);
      setCronDetails((prevCronData) => {
        return {
          ...prevCronData,
          [name]: "",
        };
      });
    } else if (value === "weekMonths") {
      setRenderMonthDays(true);
      setRenderWeekDays(false);
      setCronDetails((prevCronData) => {
        return {
          ...prevCronData,
          [name]: "",
        };
      });
    } else {
      setRenderWeekDays(false);
      setRenderMonthDays(false);
      setCronDetails((prevCronData) => {
        return {
          ...prevCronData,
          [name]: value,
        };
      });
    }
  }

  function handleSelectedDays(event: React.ChangeEvent<HTMLInputElement>) {
    const { value, checked } = event.target;

    const selectedDays = cronDetails.dayWeek.split(",").filter(Boolean);

    if (checked) {
      if (!selectedDays.includes(value)) {
        selectedDays.push(value);
      }
    } else {
      const index = selectedDays.indexOf(value);
      if (index !== -1) {
        selectedDays.splice(index, 1);
      }
    }

    const dayWeekValue = selectedDays.join(",");

    setCronDetails((prevDetails) => ({
      ...prevDetails,
      dayWeek: dayWeekValue,
    }));
  }

  function nextPage() {
    setPage((prevPage) => prevPage + 1);
  }
  function prevPage() {
    setPage((prevPage) => prevPage - 1);
  }

  const hours = [];
  const minutes = [];

  for (let i = 0; i <= 23; i++) {
    const value = i < 10 ? `0${i}` : `${i}`;
    hours.push(<option key={value}>{value}</option>);
  }
  for (let i = 0; i <= 60; i++) {
    const value = i < 10 ? `0${i}` : `${i}`;
    minutes.push(<option key={value}>{value}</option>);
  }

  switch (page) {
    case 0: {
      return (
        <div>
          <h4>Hangi gün veya günler uyarılmak istiyorsun?</h4>
          <div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="dayWeek"
                  className="radio checked:bg-white"
                  value="*"
                  checked={cronDetails.dayWeek === "*"}
                  onChange={handleChange}
                />
                <span className="label-text">Her gün</span>
              </label>

              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="dayWeek"
                  className="radio checked:bg-white"
                  value="0,6"
                  checked={cronDetails.dayWeek === "0,6"}
                  onChange={handleChange}
                />
                <span className="label-text">Hafta Sonları</span>
              </label>

              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="dayWeek"
                  className="radio checked:bg-white"
                  value="1-5"
                  checked={cronDetails.dayWeek === "1-5"}
                  onChange={handleChange}
                />
                <span className="label-text">Hafta İçileri</span>
              </label>

              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="dayWeek"
                  className="radio checked:bg-white"
                  value="weekDays"
                  checked={renderWeekDays}
                  onChange={handleChange}
                />
                <span className="label-text">Haftanın belirli günleri</span>
              </label>
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="dayWeek"
                  className="radio checked:bg-white"
                  value="weekMonths"
                  checked={renderMonthDays}
                  onChange={handleChange}
                />
                <span className="label-text">Ayın belirli günleri</span>
              </label>
            </div>
            {renderMonthDays && (
              <div className="form-control">
                <div className="input-group flex min-w-full flex-row items-center justify-center p-4">
                  <input
                    ref={tagRef}
                    type="text"
                    placeholder="Tag…"
                    className="input-bordered input min-w-full transition-all"
                    onChange={handleInputChange}
                  />

                  <button
                    className={`btn-square btn ${
                      !isInputValid ? "btn-disabled" : ""
                    }`}
                    onClick={handleAddTag}
                    disabled={!isInputValid}
                  >
                    +
                  </button>
                </div>
                <div
                  className={`mb-3 cursor-pointer rounded-lg ${
                    tags.size ? "bg-base-100" : "bg-base-300"
                  }  p-2`}
                >
                  {[...tags].map((tag) => (
                    <div
                      key={tag}
                      className=" badge-primary badge m-1 p-4 transition-all hover:scale-105 hover:bg-error"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {renderWeekDays && (
              <div className="form-control">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name="days"
                    value="1"
                    onChange={handleSelectedDays}
                  />
                  <span className="label-text">Pazartesi</span>
                </label>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name="days"
                    value="2"
                    onChange={handleSelectedDays}
                  />
                  <span className="label-text">Salı</span>
                </label>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name="days"
                    value="3"
                    onChange={handleSelectedDays}
                  />
                  <span className="label-text">Çarşamba</span>
                </label>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name="days"
                    value="4"
                    onChange={handleSelectedDays}
                  />
                  <span className="label-text">Perşembe</span>
                </label>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name="days"
                    value="5"
                    onChange={handleSelectedDays}
                  />
                  <span className="label-text">Cuma</span>
                </label>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name="days"
                    value="6"
                    onChange={handleSelectedDays}
                  />
                  <span className="label-text">Cumartesi</span>
                </label>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    name="days"
                    value="7"
                    onChange={handleSelectedDays}
                  />
                  <span className="label-text">Pazar</span>
                </label>
              </div>
            )}
          </div>
          <button className="btn" onClick={nextPage}>
            Next
          </button>
        </div>
      );
    }
    case 1: {
      return (
        <div>
          <h4>Hatırlatıcı hangi saate kurulsun?</h4>
          <div className="container mx-auto p-3">
            <div className="inline-flex rounded-md border p-2 text-lg shadow-lg">
              <select
                name="hours"
                id="hourSelector"
                onChange={(event) => handleChange(event)}
                className="appearance-none bg-base-300 px-2 outline-none"
              >
                {hours}
              </select>
              <span className="px-2">:</span>
              <select
                name="minutes"
                id="minSelector"
                onChange={(event) => handleChange(event)}
                className="appearance-none bg-base-300 px-2 outline-none"
              >
                {minutes}
              </select>
            </div>
          </div>
          <button className="btn" onClick={prevPage}>
            prev page
          </button>
        </div>
      );
    }

    default: {
      return (
        <div>
          <h3>an error occured</h3>
        </div>
      );
    }
  }
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

const CronTable: React.FC = () => {
  const { data: session } = useSession();
  const { data } = useGetAllCrons();
  const join = useCreateOrJoinCron();
  const leave = useLeaveCron();

  if (!session || !data || !data.length) return <></>;
  return (
    <div className="w-full overflow-x-auto">
      <table className="table w-full">
        {/* head */}
        <thead>
          <tr>
            <th>Katılımcılar</th>
            <th>Başlık</th>
            <th>Cron (UTC)</th>
            <th>Hepsi: {data.length}</th>
          </tr>
        </thead>
        <tbody>
          {/* row 1 */}
          {data.map((job) => (
            <tr key={job.id}>
              <td>
                <div className="flex items-center space-x-3">
                  <div className="avatar">
                    <div className="mask mask-squircle h-12 w-12">
                      <div className="avatar-group -space-x-6">
                        {job.listeners.map((c) => (
                          <div key={c.listener.id} className="avatar">
                            <div className="w-12">
                              {c.listener.image && (
                                <img src={c.listener.image} alt="User avatar" />
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
                                  {c.listener.name}
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
                            {job.listeners
                              .map((c) => c.listener.name)
                              .join(", ")}
                          </div>
                          <label className="visible sm:btn-disabled sm:invisible">
                            {job.listeners[0]?.listener.name}{" "}
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
                </div>
              </td>
              <td>
                {job.title}
                <br />
                <span className="badge-ghost badge badge-sm">
                  {job.isGlobal ? "Global" : "Özel"}
                </span>
              </td>
              <td>{job.cron}</td>
              <th>
                {!!job.listeners.filter((u) => u.listenerId === session.user.id)
                  .length ? (
                  <button
                    onClick={() => leave.mutate(job.cron)}
                    disabled={leave.isLoading}
                    className={classNames("btn-secondary btn-xs btn", {
                      ["loading"]: leave.isLoading,
                    })}
                  >
                    Ayrıl
                  </button>
                ) : (
                  <button
                    onClick={() => join.mutate({ title: "31", cron: job.cron })}
                    disabled={join.isLoading}
                    className={classNames("btn-secondary btn-xs btn", {
                      ["loading"]: join.isLoading,
                    })}
                  >
                    Katıl
                  </button>
                )}
              </th>
            </tr>
          ))}
        </tbody>
        {/* foot */}
        <tfoot>
          <tr>
            <th>Katılımcılar</th>
            <th>Başlık</th>
            <th>Cron (UTC)</th>
            <th>Hepsi: {data.length}</th>
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
