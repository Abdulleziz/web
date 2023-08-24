import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { getServerAuthSession } from "./auth";
import { z } from "zod";

const f = createUploadthing({
  errorFormatter(err) {
    return {
      message: err.message,
      zodError: err.cause instanceof z.ZodError ? err.cause.flatten() : null,
    };
  },
});

export const uploadRouter = {
  threadPostAttachmentUploader: f({
    image: { maxFileCount: 5, maxFileSize: "8MB" },
    video: { maxFileSize: "32MB" },
  })
    .middleware(async ({ req, res }) => {
      const session = await getServerAuthSession({ req, res });

      if (!session) throw new Error("Unauthorized, no session");

      return { userId: session.user.id };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
