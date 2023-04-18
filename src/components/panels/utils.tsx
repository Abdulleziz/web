import type { AbdullezizPerm } from "~/utils/abdulleziz";

export const createPanel = <T, V extends AbdullezizPerm[] | undefined>(
  visibleBy: V,
  Component: React.FC<T>
) => {
  const PanelComponent = Component as React.FC<T> & { visibleBy: V };
  PanelComponent.visibleBy = visibleBy;
  return PanelComponent;
};
