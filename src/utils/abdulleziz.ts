import {
  abdullezizRoleSeverities,
  type ReadOnlyAtLeastOne,
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

// SPECIAL EVENT
// işten ayrıl (birden fazla işi olabilir). CEO(geçici) + Driver buğra 🤣
//  // side-effects (maaşı sonlandır vb.)

///////////// @everyone permleri (rolü olsun olmasın hepsi)
// --SADECE ŞİRKETTE ROLÜ OLMAYANLAR:--
// staj başvurusu
// ---------- FARKETMEZ ------------
// mağaza / satın alma
// forum
// hatırlatıcı
// para gönder (intern maaş alamıyo biz canımız isterse veririz ona)

// sadece rolü olanlar
export const requiredSeverity = [
  { perm: "forum thread sil", min: 2 }, // şimdilik herkes thread silebilir, ilerde silme olmayacak
  { perm: "oylamaya katıl", min: 2 }, // TODO: TOP PRIORITIY
  // oylama oluştur ??? (toplu request lazım) (timeout olcak cron yardımıyla)
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
  { perm: "çalışanları yönet", min: 80 }, // kovmak veya işe almak için 2 (kurul veya üstteki çalışan) oyu lazım olsun
  // örneğin CEO, CTO'yu kovması için CIO'dan izin almalı
  // CEO, HR'ı anında kovabilir
  // HR, Driver'ı kovması için üstlerinden izin istemesi lazım
  // severity sistemiyle bu iş olur gibi. Bir elin nesi var, iki elin sesi var.
  { perm: "forumu yönet", min: 80 }, // thread/post kilitleme vb.
] as const satisfies readonly RequiredSeverity[];

export type AbdullezizPerm = (typeof requiredSeverity)[number]["perm"];
export type RequiredSeverities = readonly (RequiredSeverity & {
  perm: AbdullezizPerm;
})[];

export function permissionDecider(roles: Role[]) {
  const perms: AbdullezizPerm[] = [];
  for (const p of requiredSeverity as RequiredSeverities) {
    if ("roles" in p) {
      if (p.roles.some((r) => roles.includes(r))) perms.push(p.perm);
      continue;
    }
    const { min, max, exclude, include } = p;
    if (exclude?.some((r) => roles.includes(r))) continue;
    if (include?.some((r) => roles.includes(r))) {
      perms.push(p.perm);
      continue;
    }

    if (
      roles.some((r) => abdullezizRoleSeverities[r] >= min) &&
      (!max || roles.some((r) => abdullezizRoleSeverities[r] <= max))
    ) {
      perms.push(p.perm);
    }
  }
  return perms;
}
