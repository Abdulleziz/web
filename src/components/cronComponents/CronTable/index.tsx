import { type FC } from "react";
import { DataTable } from "~/components/tables/generic-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type Crons } from "~/utils/useCron";
import { columns } from "./colums";

const CronTable: FC<{ data: Crons }> = ({ data }) => {
  //! TÜRKİYEM
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <CardTitle>Hatırlatıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent className=" max-h-screen overflow-x-scroll px-6 py-5 font-semibold 2xl:overflow-x-hidden">
          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CronTable;
