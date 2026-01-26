/**
 * v7.95-ZERO-PAUSE: Minimal Breathing Pacer
 * 
 * Prevents UI glitching by enforcing minimum processing gaps.
 * v7.95: Reduced to 100ms - faster without UI glitching.
 */

export const BREATHING_VERSION = "7.95";
export const RATE_LIMIT_BREATHING_MS = 100; // v7.95: 100ms (was 250ms)

let lastBreathTime = 0;
let processingCount = 0;

/**
 * Enforce stable breathing pause after each prediction
 * Marks game as known, then applies consistent delay
 */
export async function breathe(
  gameId: string,
  markKnownFn: (id: string) => void,
  baseDelayMs: number = 0
): Promise<void> {
  // Mark known BEFORE delay to prevent re-processing
  markKnownFn(gameId);
  processingCount++;
  
  // v7.95: Minimal gap between operations
  const timeSinceLast = Date.now() - lastBreathTime;
  const requiredDelay = Math.max(RATE_LIMIT_BREATHING_MS, baseDelayMs);
  const actualDelay = Math.max(0, requiredDelay - timeSinceLast);
  
  if (actualDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, actualDelay));
  }
  
  lastBreathTime = Date.now();
}

/**
 * Get time since last breath (for diagnostics)
 */
export function timeSinceLastBreath(): number {
  return Date.now() - lastBreathTime;
}

/**
 * Get processing count (for diagnostics)
 */
export function getProcessingCount(): number {
  return processingCount;
}

console.log(`[v${BREATHING_VERSION}-ZERO-PAUSE] breathingPacer.ts LOADED - Cooldown: ${RATE_LIMIT_BREATHING_MS}ms`);
