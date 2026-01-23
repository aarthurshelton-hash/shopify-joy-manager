/**
 * Intraday Seasonality - v7.53-ACCURACY
 * 
 * Maps cognitive windows and market microstructure patterns
 * to improve timing-based predictions.
 */

export type MarketSession = 'pre_market' | 'open' | 'morning' | 'midday' | 'afternoon' | 'power_hour' | 'close' | 'after_hours';

export interface SessionCharacteristics {
  session: MarketSession;
  volatilityMultiplier: number;
  volumeMultiplier: number;
  trendReliability: number;  // How reliable trends are during this period
  reversalProbability: number;
  institutionalActivity: number;  // 0-1, higher = more institutional flow
  typicalDirection: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Session characteristics based on market microstructure research
 */
export const SESSION_PROFILES: Record<MarketSession, SessionCharacteristics> = {
  pre_market: {
    session: 'pre_market',
    volatilityMultiplier: 1.5,
    volumeMultiplier: 0.3,
    trendReliability: 0.4,
    reversalProbability: 0.6,
    institutionalActivity: 0.2,
    typicalDirection: 'neutral',
  },
  open: {
    session: 'open',
    volatilityMultiplier: 2.0,
    volumeMultiplier: 1.8,
    trendReliability: 0.3,
    reversalProbability: 0.7,
    institutionalActivity: 0.9,
    typicalDirection: 'neutral',
  },
  morning: {
    session: 'morning',
    volatilityMultiplier: 1.3,
    volumeMultiplier: 1.2,
    trendReliability: 0.7,
    reversalProbability: 0.3,
    institutionalActivity: 0.7,
    typicalDirection: 'bullish',
  },
  midday: {
    session: 'midday',
    volatilityMultiplier: 0.7,
    volumeMultiplier: 0.6,
    trendReliability: 0.5,
    reversalProbability: 0.5,
    institutionalActivity: 0.4,
    typicalDirection: 'neutral',
  },
  afternoon: {
    session: 'afternoon',
    volatilityMultiplier: 0.9,
    volumeMultiplier: 0.8,
    trendReliability: 0.6,
    reversalProbability: 0.4,
    institutionalActivity: 0.5,
    typicalDirection: 'neutral',
  },
  power_hour: {
    session: 'power_hour',
    volatilityMultiplier: 1.8,
    volumeMultiplier: 1.5,
    trendReliability: 0.8,
    reversalProbability: 0.2,
    institutionalActivity: 0.85,
    typicalDirection: 'bullish',
  },
  close: {
    session: 'close',
    volatilityMultiplier: 1.4,
    volumeMultiplier: 1.3,
    trendReliability: 0.7,
    reversalProbability: 0.3,
    institutionalActivity: 0.8,
    typicalDirection: 'neutral',
  },
  after_hours: {
    session: 'after_hours',
    volatilityMultiplier: 1.2,
    volumeMultiplier: 0.2,
    trendReliability: 0.3,
    reversalProbability: 0.5,
    institutionalActivity: 0.1,
    typicalDirection: 'neutral',
  },
};

/**
 * Get current market session based on time
 */
export function getCurrentSession(date: Date = new Date()): MarketSession {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours * 60 + minutes;
  
  // Convert to ET (simplified - assumes local is ET)
  // Pre-market: 4:00 - 9:30
  if (time >= 240 && time < 570) return 'pre_market';
  // Open: 9:30 - 10:00
  if (time >= 570 && time < 600) return 'open';
  // Morning: 10:00 - 12:00
  if (time >= 600 && time < 720) return 'morning';
  // Midday: 12:00 - 14:00
  if (time >= 720 && time < 840) return 'midday';
  // Afternoon: 14:00 - 15:00
  if (time >= 840 && time < 900) return 'afternoon';
  // Power hour: 15:00 - 15:45
  if (time >= 900 && time < 945) return 'power_hour';
  // Close: 15:45 - 16:00
  if (time >= 945 && time < 960) return 'close';
  // After hours: 16:00 - 20:00
  if (time >= 960 && time < 1200) return 'after_hours';
  
  return 'after_hours';
}

/**
 * Day of week effects
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface DayEffect {
  day: DayOfWeek;
  bullishBias: number;  // -1 to 1
  volatilityMultiplier: number;
  gapProbability: number;
}

export const DAY_EFFECTS: Record<DayOfWeek, DayEffect> = {
  monday: { day: 'monday', bullishBias: -0.1, volatilityMultiplier: 1.2, gapProbability: 0.4 },
  tuesday: { day: 'tuesday', bullishBias: 0.05, volatilityMultiplier: 1.0, gapProbability: 0.2 },
  wednesday: { day: 'wednesday', bullishBias: 0.0, volatilityMultiplier: 0.95, gapProbability: 0.2 },
  thursday: { day: 'thursday', bullishBias: 0.05, volatilityMultiplier: 1.0, gapProbability: 0.2 },
  friday: { day: 'friday', bullishBias: 0.1, volatilityMultiplier: 1.1, gapProbability: 0.15 },
};

/**
 * Get day of week effect
 */
export function getDayEffect(date: Date = new Date()): DayEffect {
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayIndex = date.getDay();
  
  // Weekend maps to Friday
  if (dayIndex === 0 || dayIndex === 6) return DAY_EFFECTS.friday;
  
  return DAY_EFFECTS[days[dayIndex - 1]];
}

/**
 * Calculate seasonality adjustment for predictions
 */
export function getSeasonalityAdjustment(
  basePrediction: { direction: 'bullish' | 'bearish' | 'neutral'; confidence: number },
  date: Date = new Date()
): { direction: 'bullish' | 'bearish' | 'neutral'; confidence: number; session: MarketSession } {
  const session = getCurrentSession(date);
  const dayEffect = getDayEffect(date);
  const sessionProfile = SESSION_PROFILES[session];
  
  let { direction, confidence } = basePrediction;
  
  // Adjust confidence based on trend reliability
  confidence = confidence * sessionProfile.trendReliability;
  
  // Apply reversal probability
  if (Math.random() < sessionProfile.reversalProbability * 0.3) {
    // Reduce confidence when reversal likely
    confidence *= 0.7;
  }
  
  // Day of week bias
  if (direction === 'bullish' && dayEffect.bullishBias < 0) {
    confidence *= (1 + dayEffect.bullishBias);
  } else if (direction === 'bearish' && dayEffect.bullishBias > 0) {
    confidence *= (1 - dayEffect.bullishBias);
  } else if (direction === 'bullish' && dayEffect.bullishBias > 0) {
    confidence = Math.min(1, confidence * (1 + dayEffect.bullishBias * 0.5));
  }
  
  return { direction, confidence: Math.max(0.1, confidence), session };
}

/**
 * Optimal trading windows
 */
export function getOptimalTradingWindows(): MarketSession[] {
  return ['morning', 'power_hour'];
}

/**
 * Should avoid trading during this session?
 */
export function shouldAvoidTrading(session: MarketSession): boolean {
  return session === 'open' || session === 'midday' || session === 'after_hours';
}
