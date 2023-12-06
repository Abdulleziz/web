import { useState } from "react";
import { VoteEvent } from "~/pages/manage";
import { useGetVoteEventsWithMembers } from "~/utils/useDiscord";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

const ManageVoteEvents = () => {
  const [unfinished, setUnfinished] = useState(true);
  const events = useGetVoteEventsWithMembers(unfinished);

  if (events.isLoading || !events.data) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center space-x-2">
        <Switch
          id="unfinished-mode"
          checked={unfinished}
          onCheckedChange={setUnfinished}
        />
        <Label htmlFor="unfinished-mode">
          {unfinished ? "Bitmeyenler" : "Hepsi"}
        </Label>
      </div>
      <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-1 ">
        {/* TODO: CEO VOTE HERE */}
        {events.data.map((event) => (
          <VoteEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default ManageVoteEvents;
