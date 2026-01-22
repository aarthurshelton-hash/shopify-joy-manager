/**
 * v7.51-FAST: Extracted Breathing Pacer
 * 
 * Prevents API saturation by enforcing minimal cooldowns
 * between predictions. Optimized for continuous throughput.
 */

export const BREATHING_VERSION = "7.51";
export const RATE_LIMIT_BREATHING_MS = 300; // v7.51: 300ms (was 1500ms)

let lastBreathTime = 0;

/**
 * Enforce breathing pause after each prediction
 * Marks game as known, then waits for cooldown
 */
export async function breathe(
  gameId: string,
  markKnownFn: (id: string) => void,
  baseDelayMs: number = 0
): Promise<void> {
  // Mark known BEFORE delay to prevent re-processing
  markKnownFn(gameId);
  
  const totalDelay = baseDelayMs + RATE_LIMIT_BREATHING_MS;
  lastBreathTime = Date.now();
  
  await new Promise(resolve => setTimeout(resolve, totalDelay));
}

/**
 * Get time since last breath (for diagnostics)
 */
export function timeSinceLastBreath(): number {
  return Date.now() - lastBreathTime;
}

console.log(`[v${BREATHING_VERSION}-FAST] breathingPacer.ts LOADED - Cooldown: ${RATE_LIMIT_BREATHING_MS}ms`);
