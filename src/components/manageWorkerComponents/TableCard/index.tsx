import { DataTable } from "~/components/tables/generic-table";
import { Card, CardContent } from "~/components/ui/card";
import { columns } from "./columns";
import { type User, type VoteEventsWithMembers } from "~/utils/useDiscord";

export const TableCard: React.FC<{
  voteEvents: VoteEventsWithMembers[];
  worker: User;
}> = ({ voteEvents, worker }) => {
  return (
    <Card className="flex flex-col rounded sm:col-span-1">
      <CardContent className=" max-h-screen overflow-x-scroll px-6 py-5 font-semibold sm:overflow-x-hidden">
        <div className="flex flex-col gap-3">
          <DataTable
            data={voteEvents.filter(
              (e) => e.target.user.id === worker?.user.id
            )}
            columns={columns}
          />
        </div>
      </CardContent>
    </Card>
  );
};
