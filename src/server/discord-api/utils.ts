import { type AbdullezizRole, abdullezizRoles } from "~/utils/zod-utils";
import type { Roles } from "./guild";

export const sortRoles = (roles: Roles | undefined) => {
  return (roles ?? []).sort((a, b) => a.position - b.position);
};

// discord permlerinden abdülleziz-verified rolleri alıyoz
// CEO, CTO... gibi
export const getVerifiedAbdullezizRoles = (roles: Roles) => {
  const r = abdullezizRoles;
  return roles
    .filter((role) => r[role.name as AbdullezizRole] === role.id)
    .map((role) => ({ ...role, name: role.name as AbdullezizRole }));
};
