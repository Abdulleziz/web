import {
  type VerifiedAbdullezizRole,
  verifiedAbdullezizRoles,
} from "~/utils/zod-utils";
import type { Roles } from "./guild";

export const sortRoles = (roles: Roles | undefined) => {
  return (roles ?? []).sort((a, b) => a.position - b.position);
};

// discord permlerinden abdülleziz-verified rolleri alıyoz
// CEO, CTO... gibi
export const getVerifiedAbdullezizRoles = (roles: Roles) => {
  const r = verifiedAbdullezizRoles;
  return roles
    .filter((role) => r[role.name as VerifiedAbdullezizRole] === role.id)
    .map((role) => ({ ...role, name: role.name as VerifiedAbdullezizRole }));
};
