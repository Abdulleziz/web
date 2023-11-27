import { ChevronLeftSquareIcon, ChevronRightSquareIcon } from "lucide-react";
import type { NextPage } from "next";
import { useRef } from "react";
import { Layout } from "~/components/Layout";
import { Button } from "~/components/ui/button";

const ProjectMbt: NextPage = () => {
  const ref = useRef<HTMLIFrameElement>(null);

  return (
    <Layout title="MBT">
      <div className="flex flex-col items-center justify-center">
        <div className="sticky top-5 flex items-center justify-center">
          <Button
            variant={"ghost"}
            onClick={() => ref.current?.contentWindow?.history.back()}
          >
            <ChevronLeftSquareIcon className="h-8 w-8" />
            {" Geri"}
          </Button>

          <Button
            variant={"ghost"}
            onClick={() =>
              ref.current?.contentWindow?.location.replace("/mbt/index.html")
            }
          >
            Anasayfa
          </Button>

          <Button
            variant={"ghost"}
            onClick={() => ref.current?.contentWindow?.history.forward()}
          >
            <ChevronRightSquareIcon className="h-8 w-8" />
            {" İleri"}
          </Button>
        </div>
        <iframe
          ref={ref}
          src="/mbt/index.html"
          className="h-screen w-full"
          allowFullScreen
        />
      </div>
    </Layout>
  );
};

export default ProjectMbt;
