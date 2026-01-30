/**
 * Mobile detection hook
 * 
 * Enhanced with device profile integration for reliable
 * cross-platform detection.
 */

import * as React from "react";
import { detectDeviceType, DeviceType } from "@/lib/device/deviceDetection";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    };
    
    checkTablet();
    window.addEventListener("resize", checkTablet);
    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  return !!isTablet;
}

export function useDeviceClass(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(() => detectDeviceType());

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceType(detectDeviceType());
    };
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return deviceType;
}

/**
 * Returns responsive value based on device type
 */
export function useResponsiveValue<T>(values: {
  phone: T;
  tablet?: T;
  desktop: T;
}): T {
  const deviceType = useDeviceClass();
  
  switch (deviceType) {
    case 'phone':
      return values.phone;
    case 'tablet':
      return values.tablet ?? values.desktop;
    case 'desktop':
      return values.desktop;
  }
}
