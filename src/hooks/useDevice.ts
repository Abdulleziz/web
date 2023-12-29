"use client";

import { useMediaQuery } from "usehooks-ts";

const useDevice = () => {
    const isMobile = useMediaQuery("only screen and (max-width : 767px)");
    const isTablet = useMediaQuery(
        "only screen and (min-width : 768px) and (max-width : 1024px)"
    );
    const isDesktop = useMediaQuery(
        "only screen and (min-width : 1025px) and (max-width : 2379px)"
    );
    const isDesktopLarge = useMediaQuery("only screen and (min-width : 2380px)");

    return { isMobile, isTablet, isDesktop, isDesktopLarge };
};

export default useDevice;