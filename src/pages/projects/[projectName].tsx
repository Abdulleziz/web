import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Layout } from "~/components/Layout";
import Project from "~/components/Project";
import { Button } from "~/components/ui/button";
import { PROJECTS } from "~/utils/projects";

const ProjectPage: NextPage = () => {
  const router = useRouter();
  const project = PROJECTS.find(
    (project) => project.name === router.query.projectName
  );

  if (!project) {
    return (
      <Layout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p>
            Böyle bir projemiz yok ({router.query.projectName}). Eklemek için
            commit atın.
          </p>
          <Button onClick={() => void router.push("/")}>Geri Dön</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Profile - Abdulleziz Corp.">
      <Project url={project.url} />
    </Layout>
  );
};

export default ProjectPage;
