/**
 * v7.93-SMOOTH-FLOW: Adaptive Breathing Pacer
 * 
 * Prevents rate limiting and UI glitching by enforcing ADAPTIVE processing gaps.
 * v7.93: Smooth flow with burst detection and dynamic cooldowns.
 */

export const BREATHING_VERSION = "7.98";
export const RATE_LIMIT_BREATHING_MS = 250; // v7.98: 250ms base (optimized)

let lastBreathTime = 0;
let processingCount = 0;
let burstCounter = 0;
let lastBurstCheck = Date.now();
let adaptiveCooldown = RATE_LIMIT_BREATHING_MS;

// v7.93: Track recent operation times for burst detection
const recentOperations: number[] = [];
const BURST_WINDOW_MS = 5000; // 5 second window
const MAX_OPS_PER_WINDOW = 10; // Max 10 ops per 5 seconds = 2/sec

/**
 * Detect if we're in a burst pattern (too many ops too fast)
 */
function detectBurst(): boolean {
  const now = Date.now();
  const windowStart = now - BURST_WINDOW_MS;
  
  // Clean old entries
  while (recentOperations.length > 0 && recentOperations[0] < windowStart) {
    recentOperations.shift();
  }
  
  return recentOperations.length >= MAX_OPS_PER_WINDOW;
}

/**
 * Calculate adaptive cooldown based on recent activity
 */
function calculateAdaptiveCooldown(): number {
  const now = Date.now();
  
  // Reset burst counter every 30 seconds
  if (now - lastBurstCheck > 30000) {
    burstCounter = Math.max(0, burstCounter - 2);
    lastBurstCheck = now;
  }
  
  if (detectBurst()) {
    burstCounter++;
    // Progressive backoff: 300ms -> 500ms -> 800ms -> 1200ms max
    adaptiveCooldown = Math.min(RATE_LIMIT_BREATHING_MS * (1 + burstCounter * 0.5), 1200);
    console.log(`[v7.93-SMOOTH] Burst detected, cooldown: ${adaptiveCooldown}ms`);
  } else if (burstCounter > 0 && recentOperations.length < MAX_OPS_PER_WINDOW / 2) {
    // Gradually reduce cooldown when activity is low
    burstCounter = Math.max(0, burstCounter - 0.5);
    adaptiveCooldown = Math.max(RATE_LIMIT_BREATHING_MS, adaptiveCooldown * 0.9);
  }
  
  return adaptiveCooldown;
}

/**
 * Enforce stable breathing pause after each prediction
 * Marks game as known, then applies adaptive delay
 */
export async function breathe(
  gameId: string,
  markKnownFn: (id: string) => void,
  baseDelayMs: number = 0
): Promise<void> {
  // Mark known BEFORE delay to prevent re-processing
  markKnownFn(gameId);
  processingCount++;
  recentOperations.push(Date.now());
  
  // v7.93: Calculate adaptive cooldown based on recent activity
  const currentCooldown = calculateAdaptiveCooldown();
  const timeSinceLast = Date.now() - lastBreathTime;
  const requiredDelay = Math.max(currentCooldown, baseDelayMs);
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

/**
 * Get current adaptive cooldown (for diagnostics)
 */
export function getCurrentCooldown(): number {
  return adaptiveCooldown;
}

/**
 * Reset pacer state (for testing or manual reset)
 */
export function resetPacer(): void {
  burstCounter = 0;
  adaptiveCooldown = RATE_LIMIT_BREATHING_MS;
  recentOperations.length = 0;
  console.log('[v7.98-SMOOTH] Pacer reset');
}

console.log(`[v${BREATHING_VERSION}-SMOOTH-AUDIT] breathingPacer.ts LOADED - Base cooldown: ${RATE_LIMIT_BREATHING_MS}ms (adaptive)`);
