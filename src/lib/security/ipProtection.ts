/**
 * @license
 * Copyright (c) 2024-2026 En Pensent LLC. All Rights Reserved.
 * Proprietary and Confidential.
 * 
 * INTELLECTUAL PROPERTY NOTICE:
 * Natural Vision™, En Pensent, and the chess pattern recognition visualization
 * methodology are protected by trade secret law and international copyright.
 * Unauthorized reproduction, reverse engineering, or derivative works are
 * strictly prohibited and may result in civil and criminal penalties.
 */

// Anti-debugging and console protection
export function initializeIPProtection(): void {
  if (typeof window === 'undefined') return;
  
  // Detect DevTools opening (production only)
  if (import.meta.env.PROD) {
    const threshold = 160;
    let devtoolsOpen = false;
    
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.clear();
          console.log(
            '%c⚠️ PROPRIETARY SOFTWARE',
            'color: #ff4444; font-size: 24px; font-weight: bold;'
          );
          console.log(
            '%cThis application contains trade secrets and proprietary algorithms owned by En Pensent LLC.\n' +
            'Reverse engineering, decompiling, or extracting source code is strictly prohibited\n' +
            'under U.S. Code Title 18 § 1832 (Economic Espionage Act) and international law.\n\n' +
            '© 2024-2026 En Pensent LLC. All Rights Reserved.\n' +
            'Natural Vision™ is a registered trademark.',
            'color: #888; font-size: 12px;'
          );
        }
      } else {
        devtoolsOpen = false;
      }
    };
    
    setInterval(checkDevTools, 1000);
    
    // Prevent right-click context menu on protected elements
    document.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-protected="true"]') || target.closest('canvas')) {
        e.preventDefault();
      }
    });
    
    // Disable keyboard shortcuts for saving/viewing source
    document.addEventListener('keydown', (e) => {
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 's' || e.key === 'u' || e.key === 'S' || e.key === 'U')
      ) {
        e.preventDefault();
      }
    });
  }
  
  // Console warning (always show)
  console.log(
    '%c🔒 En Pensent',
    'color: #6366f1; font-size: 18px; font-weight: bold;'
  );
  console.log(
    '%cThis browser feature is intended for developers.\n' +
    'Do not paste any code here that others give you.\n' +
    'It could compromise your account security.',
    'color: #888; font-size: 11px;'
  );
}

// Fingerprint protection for vision images
export function generateProtectionHash(userId: string, visionId: string): string {
  const timestamp = Date.now().toString(36);
  const payload = `${userId}-${visionId}-${timestamp}`;
  
  // Simple hash for client-side (real hash done server-side)
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// Rate limit tracker for API abuse detection
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkClientRateLimit(endpoint: string, maxRequests: number = 100): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  const key = endpoint;
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    console.warn(`[Security] Rate limit exceeded for ${endpoint}`);
    return false;
  }
  
  record.count++;
  return true;
}

// Detect automated/bot behavior
export function detectBotBehavior(): boolean {
  const indicators: boolean[] = [];
  
  // Check for headless browser
  indicators.push(!!(navigator as any).webdriver);
  
  // Check for missing plugins (common in headless)
  indicators.push(navigator.plugins.length === 0);
  
  // Check for automation-related properties
  indicators.push(!!(window as any).callPhantom || !!(window as any)._phantom);
  indicators.push(!!(window as any).__nightmare);
  indicators.push(!!(window as any).Buffer);
  indicators.push(!!(window as any).emit);
  indicators.push(!!(window as any).spawn);
  
  // Check for Selenium
  indicators.push(
    !!(document as any).__selenium_unwrapped ||
    !!(document as any).__webdriver_evaluate ||
    !!(document as any).__driver_evaluate
  );
  
  // Check for Puppeteer/Playwright
  indicators.push(!!navigator.userAgent.match(/HeadlessChrome/));
  
  const suspicionScore = indicators.filter(Boolean).length;
  return suspicionScore >= 2;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeIPProtection();
}
