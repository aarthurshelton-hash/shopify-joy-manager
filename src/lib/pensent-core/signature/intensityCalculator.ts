/**
 * En Pensent Core SDK - Intensity Calculator
 * 
 * Calculates weighted intensity metrics
 */

/**
 * Calculate overall intensity from various activity metrics
 */
export function calculateIntensity(
  metrics: { value: number; weight: number }[]
): number {
  if (metrics.length === 0) return 0;
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const metric of metrics) {
    weightedSum += metric.value * metric.weight;
    totalWeight += metric.weight;
  }
  
  return totalWeight > 0 
    ? Math.min(1, Math.max(0, weightedSum / totalWeight)) 
    : 0;
}

/**
 * Determine dominant force from two competing values
 */
export function determineDominantForce(
  primary: number,
  secondary: number,
  balanceThreshold: number = 0.1
): 'primary' | 'secondary' | 'balanced' {
  const difference = primary - secondary;
  
  if (Math.abs(difference) < balanceThreshold) {
    return 'balanced';
  }
  
  return difference > 0 ? 'primary' : 'secondary';
}
