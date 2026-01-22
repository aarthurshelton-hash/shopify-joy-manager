/**
 * v7.39-BREATHE: Extracted Breathing Pacer
 * 
 * Prevents API saturation by enforcing mandatory cooldowns
 * between predictions. Extracted to small file to avoid
 * timeout issues with large pipeline file edits.
 */

export const BREATHING_VERSION = "7.50";
export const RATE_LIMIT_BREATHING_MS = 1500;

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

console.log(`[v${BREATHING_VERSION}-BREATHE] breathingPacer.ts LOADED - Cooldown: ${RATE_LIMIT_BREATHING_MS}ms`);
