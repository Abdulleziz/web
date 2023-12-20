import Link from "next/link";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { createPanel } from "./utils";

export const ProjectPanel = createPanel(undefined, () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projeler</CardTitle>
        <CardDescription>Abdulleziz çalışanlarının projeleri</CardDescription>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link href="/projects/mbt">
              <Button>MBT Project v1.3</Button>
            </Link>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
});
