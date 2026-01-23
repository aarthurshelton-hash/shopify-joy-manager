/**
 * v7.58-STABLE: Balanced Breathing Pacer
 * 
 * Prevents UI glitching by enforcing minimum processing gaps.
 * v7.58: 250ms cooldown prevents rapid-fire updates that cause visual glitching.
 */

export const BREATHING_VERSION = "7.58";
export const RATE_LIMIT_BREATHING_MS = 250; // v7.58: 250ms prevents UI glitching

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
  
  // v7.58: Ensure minimum gap between operations to prevent UI glitching
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

console.log(`[v${BREATHING_VERSION}-STABLE] breathingPacer.ts LOADED - Cooldown: ${RATE_LIMIT_BREATHING_MS}ms`);
