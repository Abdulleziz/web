// Note: `useUploadThing` is IMPORTED FROM YOUR CODEBASE using the `generateReactHelpers` function
import { useCallback } from "react";
import { type FileWithPath, useDropzone } from "react-dropzone";
import { generateClientDropzoneAccept } from "uploadthing/client";

import { useUploadThing } from "~/utils/uploadthing";
import { Button } from "./ui/button";
import { ImageIcon } from "lucide-react";
import { Label } from "./ui/label";
import { create } from "zustand";

/* Attachment Store */
type AttachmentStore = {
  attachments: File[];
  progress?: number;
};

export const useAttachmentStore = create<AttachmentStore>()(() => ({
  attachments: [],
}));

export const setAttachments = (
  attachments: File[] | ((prev: File[]) => File[])
) => {
  useAttachmentStore.setState((state) => ({
    attachments:
      typeof attachments === "function"
        ? attachments(state.attachments)
        : attachments,
  }));
};

export const setProgress = (progress: number) =>
  useAttachmentStore.setState(() => ({ progress }));

export const addAttachments = (attachments: File[]) =>
  useAttachmentStore.setState((s) => {
    const news = attachments.filter(
      (a) => !s.attachments.some((b) => b.name === a.name)
    );
    return { attachments: [...s.attachments, ...news] };
  });

export const removeAttachment = (name: File["name"]) =>
  useAttachmentStore.setState((state) => ({
    attachments: state.attachments.filter((item) => item.name !== name),
  }));

/* Attachment Store end*/

export function ThreadUpload({ disabled }: { disabled: boolean }) {
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    addAttachments(acceptedFiles);
  }, []);

  const { permittedFileInfo } = useUploadThing("threadPostAttachmentUploader");
  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo.config)
    : [];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
  });

  if (disabled)
    return (
      <Button size="icon" disabled>
        <ImageIcon className="h-4 w-4" />
      </Button>
    );

  return (
    <div {...getRootProps()}>
      <Label htmlFor="attachments-uploader">
        <Button size="icon">
          <ImageIcon className="h-4 w-4" />
          <input {...getInputProps()} id="attachments-uploader" />
        </Button>
      </Label>
    </div>
  );
}
