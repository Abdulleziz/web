import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { createTRPCContext } from "./api/trpc";
const f = createUploadthing();

export const uploadRouter = {
  threadPostAttachmentUploader: f({
    image: { maxFileCount: 5, maxFileSize: "8MB" },
    video: { maxFileSize: "32MB" },
  })
    .middleware(async (req, res) => {
      const ctx = await createTRPCContext({ req, res });
      console.log("ctx", ctx.session);
      console.log("ctx!", !ctx.session);

      if (!ctx.session) throw new Error("Unauthorized");

      return { userId: ctx.session.user.id };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
