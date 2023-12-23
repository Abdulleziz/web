import { ChevronLeftSquareIcon, ChevronRightSquareIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "~/components/ui/button";

type ProjectProps = { url: string };
const Project = ({ url }: ProjectProps) => {
  const ref = useRef<HTMLIFrameElement>(null);

  return (
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
          onClick={() => ref.current?.contentWindow?.location.replace(url)}
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
      <iframe ref={ref} src={url} className="h-screen w-full" allowFullScreen />
    </div>
  );
};

export default Project;
