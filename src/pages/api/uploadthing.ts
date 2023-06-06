/** pages/api/uploadthing.ts */
import { createNextPageApiHandler } from "uploadthing/next-legacy";

import { uploadRouter } from "~/server/uploadthing";
import { getDomainUrl } from "~/utils/api";

const handler = createNextPageApiHandler({
  router: uploadRouter,
  config: { callbackUrl: getDomainUrl() },
});

export default handler;
