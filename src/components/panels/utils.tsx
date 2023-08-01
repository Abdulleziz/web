import type { AbdullezizPerm } from "~/utils/abdulleziz";

export const createPanel = <T, V extends AbdullezizPerm[] | undefined>(
  visibleBy: V,
  Component: React.FC<T>,
  options: { notAChild?: boolean } = {}
) => {
  const PanelComponent = Component as React.FC<T> & {
    visibleBy: V;
    notAChild?: boolean;
  };
  PanelComponent.visibleBy = visibleBy;
  PanelComponent.notAChild = options.notAChild;
  return PanelComponent;
};
