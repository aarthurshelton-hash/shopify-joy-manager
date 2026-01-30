/**
 * En Pensent Device Detection & Optimization
 * 
 * Reliable source for mass phone, tablet, and computer users.
 * Detects device capabilities and optimizes rendering accordingly.
 */

export type DeviceType = 'phone' | 'tablet' | 'desktop';
export type ConnectionQuality = 'slow' | 'medium' | 'fast' | 'unknown';
export type PerformanceTier = 'low' | 'medium' | 'high';

export interface DeviceProfile {
  type: DeviceType;
  isTouch: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  connection: ConnectionQuality;
  performanceTier: PerformanceTier;
  supportsWebGL: boolean;
  supportsOffscreenCanvas: boolean;
  memoryGB: number | null;
  cpuCores: number;
  isLowPowerMode: boolean;
  isPWA: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Detect current device type based on screen width and touch capability
 */
export function detectDeviceType(): DeviceType {
  const width = window.innerWidth;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Phone: < 768px
  if (width < 768) return 'phone';
  
  // Tablet: 768px - 1024px with touch, or iPad detection
  if (width >= 768 && width <= 1024 && isTouch) return 'tablet';
  
  // Large tablets
  if (width > 1024 && width <= 1366 && isTouch) return 'tablet';
  
  return 'desktop';
}

/**
 * Detect network connection quality
 */
export function detectConnectionQuality(): ConnectionQuality {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      saveData?: boolean;
    };
  };
  
  if (!nav.connection) return 'unknown';
  
  // Respect data saver mode
  if (nav.connection.saveData) return 'slow';
  
  const effectiveType = nav.connection.effectiveType;
  
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'slow';
    case '3g':
      return 'medium';
    case '4g':
      return 'fast';
    default:
      // Fall back to downlink speed
      const downlink = nav.connection.downlink;
      if (downlink !== undefined) {
        if (downlink < 1) return 'slow';
        if (downlink < 5) return 'medium';
        return 'fast';
      }
      return 'unknown';
  }
}

/**
 * Estimate device performance tier
 */
export function detectPerformanceTier(): PerformanceTier {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  
  // Low-end device indicators
  if (cores <= 2) return 'low';
  if (memory !== undefined && memory <= 2) return 'low';
  
  // High-end device indicators
  if (cores >= 8 && (memory === undefined || memory >= 8)) return 'high';
  if (cores >= 6) return 'high';
  
  return 'medium';
}

/**
 * Check WebGL support
 */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Check OffscreenCanvas support (for worker-based rendering)
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

/**
 * Detect if running as installed PWA
 */
export function isRunningAsPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Get complete device profile
 */
export function getDeviceProfile(): DeviceProfile {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  
  return {
    type: detectDeviceType(),
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
    connection: detectConnectionQuality(),
    performanceTier: detectPerformanceTier(),
    supportsWebGL: supportsWebGL(),
    supportsOffscreenCanvas: supportsOffscreenCanvas(),
    memoryGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null,
    cpuCores: navigator.hardwareConcurrency || 2,
    isLowPowerMode: false, // Can't reliably detect this
    isPWA: isRunningAsPWA(),
    isIOS,
    isAndroid,
    isSafari,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

/**
 * Get optimal image quality based on device and connection
 */
export function getOptimalImageQuality(profile: DeviceProfile): number {
  // Low connection = lower quality
  if (profile.connection === 'slow') return 0.6;
  if (profile.connection === 'medium') return 0.75;
  
  // High DPI screens need less compression
  if (profile.pixelRatio >= 2) return 0.9;
  
  return 0.85;
}

/**
 * Get optimal board size for Vision rendering
 */
export function getOptimalBoardSize(profile: DeviceProfile): number {
  const { type, screenWidth, pixelRatio, performanceTier } = profile;
  
  // Phone: fit within viewport with padding
  if (type === 'phone') {
    const size = Math.min(screenWidth - 32, 360);
    return performanceTier === 'low' ? size : size * Math.min(pixelRatio, 2);
  }
  
  // Tablet: larger but still constrained
  if (type === 'tablet') {
    const size = Math.min(screenWidth * 0.6, 500);
    return performanceTier === 'low' ? size : size * Math.min(pixelRatio, 2);
  }
  
  // Desktop: full quality
  return performanceTier === 'low' ? 500 : 600;
}

/**
 * Should animations be enabled?
 */
export function shouldEnableAnimations(profile: DeviceProfile): boolean {
  if (profile.prefersReducedMotion) return false;
  if (profile.performanceTier === 'low') return false;
  if (profile.connection === 'slow') return false;
  return true;
}

/**
 * Get chunk size for lazy loading
 */
export function getChunkSize(profile: DeviceProfile): number {
  switch (profile.performanceTier) {
    case 'low': return 5;
    case 'medium': return 10;
    case 'high': return 20;
  }
}
