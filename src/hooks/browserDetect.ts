/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { useHydrated } from "~/pages/_app";

export const useIsSafari = () => {
  const hydrated = useHydrated();
  if (!hydrated) return false;
  return (
    // @ts-ignore
    /constructor/i.test(window.HTMLElement) ||
    (function (p) {
      return p.toString() === "[object SafariRemoteNotification]";
    })(
      // @ts-ignore
      !window["safari"] ||
        //   @ts-ignore
        (typeof safari !== "undefined" && safari.pushNotification)
    )
  );
};
