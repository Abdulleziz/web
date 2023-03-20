import { z } from "zod";

export const ThreadId = z.string().cuid();
export const PostId = z.string().cuid();

export const nonEmptyString = z
  .string()
  .transform((t) => t?.trim())
  .pipe(z.string().min(1));
