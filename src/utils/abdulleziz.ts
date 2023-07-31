import {
  abdullezizRoleSeverities,
  type ReadOnlyAtLeastOne,
  type AtLeastOne,
  type Severity,
  type AbdullezizRole,
} from "./zod-utils";

type Range = Exclude<Severity, 1>; // Exclude everyone
type Role = Exclude<AbdullezizRole, "@everyone">; // Exclude everyone
type Roles = ReadOnlyAtLeastOne<Role>;

type RequiredSeverity = { perm: string } & (
  | { roles: Roles }
  | {
      min: Range;
      max?: Range;
      exclude?: Roles;
      include?: Roles;
    }
);

export const noRolePerms = ["staja başvur"] as const;

export const requiredSeverity = [
  { perm: "forum thread sil", min: 2 }, // şimdilik herkes thread silebilir, ilerde silme olmayacak
  { perm: "oylamaya katıl", min: 2 }, // CEO oylaması
  { perm: "maaş al", min: 2, exclude: ["Intern"] }, // INTERN'E MAAŞ YOK ZAAAA
  { perm: "çay koy", roles: ["Servant"] },
  { perm: "*i*n-t*i.h?a_r ½e(t=", roles: ["Servant"] },
  { perm: "çay satın al", min: 20 }, // kendi maaşından alsın (80 >= şirketten ödeyebilr)
  { perm: "çaycıya kız", min: 21 }, // günde 5 kişi kızarsa kovulur
  { perm: "zam iste", min: 31, max: 100, exclude: ["CEO"] }, // CEO ZAM olmalı mı?
  { perm: "araba sür", roles: ["Driver"] }, // minigame?
  { perm: "stajları yönet", min: 80, include: ["HR"] },
  { perm: "forum thread pinle", min: 80, include: ["Advertisement Lead"] },
  { perm: "arabaları yönet", min: 80 }, // MEGAN EKLE
  { perm: "çalışanları yönet", min: 80 }, // kovmak veya işe almak
  { perm: "forumu yönet", min: 80 }, // thread/post kilitleme vb.
] as const satisfies readonly RequiredSeverity[];

export type AbdullezizPerm =
  | (typeof requiredSeverity)[number]["perm"]
  | (typeof noRolePerms)[number];

export type RequiredSeverities = readonly (RequiredSeverity & {
  perm: AbdullezizPerm;
})[];

export const boundPerms: Partial<
  Record<AbdullezizPerm, AtLeastOne<AbdullezizPerm>>
> = {
  "forumu yönet": ["forum thread sil", "forum thread pinle"],
  "çalışanları yönet": ["stajları yönet", "oylamaya katıl"],
  "arabaları yönet": ["araba sür"],
};

export function permissionDecider(roles: Role[]) {
  const perms = new Set<AbdullezizPerm>();
  if (roles.length === 0) noRolePerms.forEach((p) => perms.add(p));
  for (const p of requiredSeverity as RequiredSeverities) {
    if ("roles" in p) {
      if (p.roles.some((r) => roles.includes(r))) {
        perms.add(p.perm);
        boundPerms[p.perm]?.forEach((perm) => perms.add(perm));
      }
      continue;
    }
    const { min, max, exclude, include } = p;
    if (exclude?.some((r) => roles.includes(r))) continue;
    if (include?.some((r) => roles.includes(r))) {
      perms.add(p.perm);
      boundPerms[p.perm]?.forEach((perm) => perms.add(perm));
      continue;
    }

    if (
      roles.some((r) => abdullezizRoleSeverities[r] >= min) &&
      (!max || roles.some((r) => abdullezizRoleSeverities[r] <= max))
    ) {
      perms.add(p.perm);
      boundPerms[p.perm]?.forEach((perm) => perms.add(perm));
    }
  }
  return [...perms];
}
