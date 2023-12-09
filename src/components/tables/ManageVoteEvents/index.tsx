import { useState } from "react";
import { useGetVoteEventsWithMembers } from "~/utils/useDiscord";
import { DataTable } from "../../ui/Tables/generic-table";
import { columns } from "./columns";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";

const ManageVoteEvents = () => {
  const [unfinished, setUnfinished] = useState(false);
  const events = useGetVoteEventsWithMembers(unfinished);

  if (events.isLoading || !events.data) {
    return (
      <div>
        <Button variant={"ghost"} isLoading></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="flex items-center space-x-2">
        <Label htmlFor="unfinished-mode">Hepsi</Label>
        <Switch
          id="unfinished-mode"
          checked={unfinished}
          onCheckedChange={setUnfinished}
        />
        <Label htmlFor="unfinished-mode">Devam Eden</Label>
      </div>
      {events.data.length ? (
        <DataTable data={events.data} columns={columns} />
      ) : (
        <p>Devam eden oylama bulunamadı!</p>
      )}
    </div>
  );
};

export default ManageVoteEvents;
