import cronParser from "cron-parser";

export const cronToDate = (cron: string) => {
  const cronDates = cronParser.parseExpression(cron, { utc: true }).iterate(5);
  const dates = cronDates.map((d) => {
    return new Date(d.toDate().setHours(d.toDate().getHours() - 3));
  });
  return dates;
};
