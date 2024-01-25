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
import { PROJECTS } from "~/utils/projects";

export const ProjectPanel = createPanel(undefined, () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projeler</CardTitle>
        <CardDescription>Abdulleziz çalışanlarının projeleri</CardDescription>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 p-4">
            {PROJECTS.map((project) => (
              <Link key={project.name} href={`/projects/${project.name}`}>
                <Button size={"sm"}>{project.title}</Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
});
