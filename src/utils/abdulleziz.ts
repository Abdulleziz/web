import {
  abdullezizRoleSeverities,
  type ReadOnlyAtLeastOne,
  type AtLeastOne,
  type Severity,
  type AbdullezizRole,
} from "./zod-utils";

export const formatName = (user: {
  nick?: string | null;
  user: { username: string | "Deleted user" };
}) => (user.nick ? user.nick : user.user.username);

type Range = Exclude<Severity, 1>; // Exclude everyone
type Role = Exclude<AbdullezizRole, "@everyone">; // Exclude everyone
type Roles = ReadOnlyAtLeastOne<Role>;

type RequiredSeverity = { perm: string } & (
  | { some: Roles }
  | { every: Roles }
  | {
      min: Range;
      max?: Range;
      exclude?: Roles;
      include?: Roles;
    }
);

export const noRolePerms = ["staja başvur"] as const;

export const requiredSeverity = [
  { perm: "oylamaya katıl", min: 2 }, // CEO oylaması
  { perm: "maaş al", min: 2, exclude: ["Intern"] }, // INTERN'E MAAŞ YOK ZAAAA
  { perm: "çay koy", every: ["Servant"] },
  { perm: "*i*n-t*i.h?a_r ½e(t=", every: ["Servant"] },
  { perm: "çay satın al", min: 20 }, // kendi maaşından alsın (80 >= şirketten ödeyebilr)
  { perm: "çaycıyı sinemle", min: 21 }, // günde 5 kişi kızarsa kovulur //! Çaycıyı sinemle
  { perm: "bonus iste", min: 31, max: 100, exclude: ["CEO"] }, // CEO'dan fazladan maaş iste
  { perm: "araba sür", some: ["Driver"] }, // minigame?
  { perm: "stajları yönet", min: 80, include: ["HR"] },
  { perm: "forum thread pinle", min: 80, include: ["Advertisement Lead"] },
  { perm: "arabaları yönet", min: 80 }, // MEGAN EKLE
  { perm: "çalışanları yönet", min: 80 }, // kovmak veya işe almak
  { perm: "forum thread sil", min: 80 },
  { perm: "forum thread kilitle", min: 80 },
  { perm: "forumu yönet", min: 80 }, // thread/post kilitleme vb. + forum bildirimleri yönetme
  { perm: "ohal başlat", some: ["CSO"] },
  { perm: "banka geçmişini gör", some: ["CEO", "CFO", "CSO"] },
  { perm: "bankayı işlet", some: ["CFO"] }, // maaş dağıt, şirket parasıyla bir şeyler al
  { perm: "bankayı yönet", some: ["CEO"] },
  { perm: "vice president seç", some: ["CEO"] },
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
  "forumu yönet": [
    "forum thread sil",
    "forum thread pinle",
    "forum thread kilitle",
  ],
  "çalışanları yönet": ["stajları yönet", "oylamaya katıl"],
  "arabaları yönet": ["araba sür"],
};

export function permissionDecider(roles: Role[]) {
  const perms = new Set<AbdullezizPerm>();
  if (roles.length === 0) noRolePerms.forEach((p) => perms.add(p));
  for (const p of requiredSeverity as RequiredSeverities) {
    if ("every" in p || "some" in p) {
      if (
        ("every" in p && roles.every((r) => p.every.includes(r))) ||
        ("some" in p && roles.some((r) => p.some.includes(r)))
      ) {
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
  return [...perms] as readonly AbdullezizPerm[];
}
