/**
 * v7.57-TURBO: Ultra-Fast Breathing Pacer
 * 
 * Minimal delays for maximum throughput while preventing rate limits.
 * v7.57: Reduced to 100ms base cooldown for ~10x faster benchmarking.
 */

export const BREATHING_VERSION = "7.57";
export const RATE_LIMIT_BREATHING_MS = 100; // v7.57: 100ms (was 300ms)

let lastBreathTime = 0;

/**
 * Enforce minimal breathing pause after each prediction
 * Marks game as known, then applies micro-delay
 */
export async function breathe(
  gameId: string,
  markKnownFn: (id: string) => void,
  baseDelayMs: number = 0
): Promise<void> {
  // Mark known BEFORE delay to prevent re-processing
  markKnownFn(gameId);
  
  // v7.57: Use smaller of baseDelay or breathing time, not sum
  const totalDelay = Math.max(baseDelayMs, RATE_LIMIT_BREATHING_MS);
  lastBreathTime = Date.now();
  
  await new Promise(resolve => setTimeout(resolve, totalDelay));
}

/**
 * Get time since last breath (for diagnostics)
 */
export function timeSinceLastBreath(): number {
  return Date.now() - lastBreathTime;
}

console.log(`[v${BREATHING_VERSION}-TURBO] breathingPacer.ts LOADED - Cooldown: ${RATE_LIMIT_BREATHING_MS}ms`);
