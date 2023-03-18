import type { Roles } from "./guild";

export const sortRoles = (roles: Roles | undefined) => {
  return (roles ?? []).sort((a, b) => a.position - b.position);
};
