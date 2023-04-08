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

const maker = "https://crontab.guru/";

const calculateDiff = (cron: cronParser.CronExpression) => {
  const next = cron.next().getTime();
  const prev = cron.prev().getTime();
  const diff = (next - prev) / (1000 * 60 * 24);
  return diff;
};

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
          <div className="flex justify-center gap-4 bg-base-200 px-4 py-16">
            <input
              type="text"
              className="input"
              placeholder="Cron... (0 8 * * 5)"
              value={input}
              onChange={(e) => {
                flushSync(() => setInput(e.target.value));
                parseCron(e.target.value);
              }}
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
              <ul className="p-4 gap-2">
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

const WarningSVG: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 flex-shrink-0 stroke-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
};

export default CronPage;
