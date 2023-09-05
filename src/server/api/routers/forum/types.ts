import { z } from "zod";

export const ThreadId = z.string().cuid();
export const PostId = z.string().cuid();

export const ThreadTitle = z
  .string({ required_error: "Thread başlığı boş olamaz" })
  .trim()
  .min(1, "Thread başlığı en az 1 karakter olmalıdır")
  .max(100, "Thread başlığı en fazla 100 karakter olmalıdır");

export const ThreadMessage = z
  .string({ required_error: "Thread mesajı boş olamaz" })
  .trim()
  .min(1, "Thread mesajı en az 1 karakter olmalıdır")
  .max(1000, "Thread mesajı en fazla 1000 karakter olmalıdır");

export const ThreadTag = z
  .string({ required_error: "Thread tagı boş olamaz" })
  .trim()
  .min(1, "Thread tagı en az 1 karakter olmalıdır")
  .max(20, "Thread tagı en fazla 20 karakter olmalıdır");

export type ThreadTitle = z.infer<typeof ThreadTitle>;
export type ThreadMessage = z.infer<typeof ThreadMessage>;
export type ThreadTag = z.infer<typeof ThreadTag>;
export type ThreadId = z.infer<typeof ThreadId>;
export type PostId = z.infer<typeof PostId>;
