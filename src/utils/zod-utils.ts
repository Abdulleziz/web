import { z } from "zod";

export const UserId = z.string().cuid();
export type UserId = z.infer<typeof UserId>;

export const DiscordId = z.string().min(1);
export type DiscordId = z.infer<typeof DiscordId>;

export const nonEmptyString = z.string().trim().min(1);

export const abdullezizRoles = {
  CEO: "937780766446858273",
  "Vice President": "1181660483225407548",
  COO: "1045426389425328158",
  CFO: "918842869211594762",
  CSO: "1100828409736744990",
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

export const PROMOTE = 1.5;
export const DEMOTE = 2.0;

export const abdullezizUnvotableRoles = [
  "Vice President",
  "CFO",
] as const satisfies readonly AbdullezizRole[];

export type AbdullezizUnvotableRole = (typeof abdullezizUnvotableRoles)[number];

export const abdullezizRoleSeverities = {
  CEO: 100,
  "Vice President": 95,
  COO: 90,
  CFO: 80,
  CSO: 70,
  "Product Manager": 60,
  "Advertisement Lead": 60,
  "QA Lead": 60,
  HR: 50,
  Driver: 31,
  Intern: 25,
  Servant: 20,
  // "@everyone": 1,
} as const satisfies Record<AbdullezizRole, Severity>;

export const getSeverity = (role?: AbdullezizRole) =>
  role ? abdullezizRoleSeverities[role] : 1;

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

type EmptyTuple = [];

export type ConstructTuple<
  TType,
  T extends number,
  Acc extends TType[] = []
> = Acc["length"] extends T
  ? Acc extends EmptyTuple // if Acc is empty (cannot infer num literal), array instead
    ? TType[]
    : Acc
  : ConstructTuple<TType, T, [...Acc, TType]>;
