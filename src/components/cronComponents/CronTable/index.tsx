import { type FC } from "react";
import { DataTable } from "~/components/tables/generic-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type Crons } from "~/utils/useCron";
import { columns } from "./colums";
import { BellRingIcon } from "lucide-react";

const CronTable: FC<{ data: Crons }> = ({ data }) => {
  //! TÜRKİYEM
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <CardTitle>Hatırlatıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent className=" overflow-x-scroll px-6 py-5 font-semibold 2xl:overflow-x-hidden">
          <DataTable
            columns={columns}
            data={data}
            pagination
            inputFilter={{ columnToFilter: "title", title: "Başlık" }}
            columnFilter={[
              {
                title: "Kalan Zaman",
                icon: <BellRingIcon className="mr-2 h-4 w-4" />,
                columnToFilter: "cron",
                options: [
                  {
                    label: "1 Saat kalan",
                    value: "1", //? in hours
                  },
                  { label: "12 saat kalan", value: "12" },
                  {
                    label: "1 Gün kalan",
                    value: "24",
                  },
                  {
                    label: "1 Hafta kalan",
                    value: "168",
                  },
                ],
              },
            ]}
            datePicker={{ columnToFilter: "jobId", title: "Cron" }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CronTable;
