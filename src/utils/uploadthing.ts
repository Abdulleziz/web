import { generateReactHelpers } from "@uploadthing/react/hooks";

import type { UploadRouter } from "~/server/uploadthing";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>();
