import { type FC } from "react";
import CreateCustomCron from "./components/customCron";
import CronMaker from "./components/cronMaker";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const CreateCronCard: FC = () => {
    
  return (
    <div className="p-3">
      <Card>
        <CardHeader>
          <CardTitle>Hatırlatıcı Oluştur</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 items-center justify-center gap-3 p-3 md:grid-cols-2">
          <CronMaker />
          <CreateCustomCron />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCronCard;
