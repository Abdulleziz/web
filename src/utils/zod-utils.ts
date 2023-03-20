import { z } from "zod";

export const ThreadId = z.string().cuid();
export const PostId = z.string().cuid();

export const nonEmptyString = z
  .string()
  .transform((t) => t?.trim())
  .pipe(z.string().min(1));

export const verifiedAbdullezizRoles = {
  CEO: "937780766446858273",
  CTO: "1045426389425328158",
  CIO: "918842869211594762",
  "Product Manager": "1045427076158738502",
  "Advertisement Lead": "1045658094635602002",
  "QA Lead": "1045427458633117766",
  HR: "1047930678655864985",
  Intern: "1045657984149245972",
  Servant: "918836973253316610",
  "@everyone": "918833527389315092",
} as const;

export type VerifiedAbdullezizRole = keyof typeof verifiedAbdullezizRoles;
