import { z } from "zod";

export const ThreadId = z.string().cuid();
export type ThreadId = z.infer<typeof ThreadId>;

export const PostId = z.string().cuid();
export type PostId = z.infer<typeof PostId>;

export const nonEmptyString = z
  .string()
  .transform((t) => t?.trim())
  .pipe(z.string().min(1, "Bu alan boş bırakılamaz."));

export const abdullezizRoles = {
  CEO: "937780766446858273",
  CTO: "1045426389425328158",
  CIO: "918842869211594762",
  "Product Manager": "1045427076158738502",
  "Advertisement Lead": "1045658094635602002",
  "QA Lead": "1045427458633117766",
  HR: "1047930678655864985",
  Driver: "1089315109085659176",
  Intern: "1045657984149245972",
  Servant: "918836973253316610",
  // "@everyone": "918833527389315092",
} as const satisfies Record<string, `${number}`>;

export type AbdullezizRole = keyof typeof abdullezizRoles;
export type Severity = IntRange<2, 101>;
// export type Severity = IntRange<1, 101>;

export const abdullezizRoleSeverities = {
  CEO: 100,
  CTO: 90,
  CIO: 80,
  "Product Manager": 70,
  "Advertisement Lead": 70,
  "QA Lead": 70,
  HR: 50,
  Driver: 31,
  Intern: 25,
  Servant: 20,
  // "@everyone": 1,
} as const satisfies Record<AbdullezizRole, Severity>;

//..
//..
//..
//..
//..
// TYPESAFE RANGE COPY-PASTA FROM STACKOVERFLOW
// https://stackoverflow.com/questions/39494689/is-it-possible-to-restrict-number-to-a-certain-range
type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

export type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

export type AtLeastOne<T> = [T, ...T[]];
export type ReadOnlyAtLeastOne<T> = readonly [T, ...T[]];
