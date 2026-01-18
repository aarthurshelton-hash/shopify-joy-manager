/**
 * Temporal & Geographic Context Tracker
 * 
 * Tracks when and where chess games are played to identify
 * universal patterns in human decision-making.
 * 
 * Key Insights:
 * - Time of day affects cognitive performance (circadian rhythms)
 * - Geographic location reveals cultural play styles
 * - Time zones create "market hours" for chess activity
 * - Seasonal patterns may correlate with trading behavior
 */

export interface TemporalContext {
  // UTC timestamp of game
  timestamp: Date;
  
  // Derived temporal attributes
  hourUTC: number;
  dayOfWeek: number; // 0=Sunday
  monthOfYear: number;
  
  // Inferred local context (from typical chess activity patterns)
  likelyRegion: 'americas' | 'europe' | 'asia' | 'unknown';
  localHourEstimate: number;
  
  // Temporal trading zones
  marketSession: 'asia' | 'europe' | 'americas' | 'overlap' | 'closed';
  
  // Cognitive context
  cognitiveWindow: 'peak' | 'standard' | 'fatigued';
  weekendEffect: boolean;
}

export interface GeographicPattern {
  region: string;
  totalGames: number;
  avgAccuracy: number;
  peakHours: number[];
  preferredTimeControls: string[];
  dominantArchetypes: string[];
}

export interface TemporalPattern {
  hour: number;
  gamesCount: number;
  avgHybridAccuracy: number;
  avgStockfishAccuracy: number;
  dominantArchetypes: string[];
}

/**
 * Extract temporal context from a game timestamp
 */
export function extractTemporalContext(timestamp: Date | string): TemporalContext {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  const hourUTC = date.getUTCHours();
  const dayOfWeek = date.getUTCDay();
  const monthOfYear = date.getUTCMonth();
  
  // Infer likely region based on active hours
  // Peak chess times: Americas (evening EST), Europe (evening CET), Asia (evening JST)
  let likelyRegion: TemporalContext['likelyRegion'] = 'unknown';
  let localHourEstimate = hourUTC;
  
  if (hourUTC >= 0 && hourUTC < 8) {
    // UTC 00:00-08:00 = Americas evening / Asia morning
    likelyRegion = 'americas';
    localHourEstimate = (hourUTC - 5 + 24) % 24; // EST
  } else if (hourUTC >= 8 && hourUTC < 16) {
    // UTC 08:00-16:00 = Europe day / Asia evening
    likelyRegion = hourUTC < 12 ? 'asia' : 'europe';
    localHourEstimate = likelyRegion === 'asia' ? hourUTC + 9 : hourUTC + 1; // JST or CET
  } else {
    // UTC 16:00-24:00 = Americas day / Europe evening
    likelyRegion = hourUTC < 22 ? 'europe' : 'americas';
    localHourEstimate = likelyRegion === 'europe' ? hourUTC + 1 : hourUTC - 5;
  }
  
  // Market session (forex-style)
  let marketSession: TemporalContext['marketSession'] = 'closed';
  if (hourUTC >= 0 && hourUTC < 8) marketSession = 'asia';
  else if (hourUTC >= 7 && hourUTC < 9) marketSession = 'overlap'; // Asia/Europe
  else if (hourUTC >= 8 && hourUTC < 13) marketSession = 'europe';
  else if (hourUTC >= 13 && hourUTC < 17) marketSession = 'overlap'; // Europe/Americas
  else if (hourUTC >= 14 && hourUTC < 21) marketSession = 'americas';
  
  // Cognitive window based on local time estimate
  let cognitiveWindow: TemporalContext['cognitiveWindow'] = 'standard';
  if (localHourEstimate >= 10 && localHourEstimate <= 14) {
    cognitiveWindow = 'peak'; // Mid-morning to early afternoon
  } else if (localHourEstimate >= 22 || localHourEstimate <= 6) {
    cognitiveWindow = 'fatigued'; // Late night / early morning
  }
  
  const weekendEffect = dayOfWeek === 0 || dayOfWeek === 6;
  
  return {
    timestamp: date,
    hourUTC,
    dayOfWeek,
    monthOfYear,
    likelyRegion,
    localHourEstimate: localHourEstimate % 24,
    marketSession,
    cognitiveWindow,
    weekendEffect,
  };
}

/**
 * Analyze temporal patterns from prediction attempts
 */
export function analyzeTemporalPatterns(
  attempts: Array<{
    created_at: string;
    hybrid_correct: boolean;
    stockfish_correct: boolean;
    hybrid_archetype?: string | null;
  }>
): TemporalPattern[] {
  const hourlyData: Record<number, {
    count: number;
    hybridCorrect: number;
    sfCorrect: number;
    archetypes: Record<string, number>;
  }> = {};
  
  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { count: 0, hybridCorrect: 0, sfCorrect: 0, archetypes: {} };
  }
  
  // Aggregate by hour
  attempts.forEach(attempt => {
    const context = extractTemporalContext(attempt.created_at);
    const hour = context.hourUTC;
    
    hourlyData[hour].count++;
    if (attempt.hybrid_correct) hourlyData[hour].hybridCorrect++;
    if (attempt.stockfish_correct) hourlyData[hour].sfCorrect++;
    
    if (attempt.hybrid_archetype) {
      hourlyData[hour].archetypes[attempt.hybrid_archetype] = 
        (hourlyData[hour].archetypes[attempt.hybrid_archetype] || 0) + 1;
    }
  });
  
  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    gamesCount: data.count,
    avgHybridAccuracy: data.count > 0 ? (data.hybridCorrect / data.count) * 100 : 0,
    avgStockfishAccuracy: data.count > 0 ? (data.sfCorrect / data.count) * 100 : 0,
    dominantArchetypes: Object.entries(data.archetypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([arch]) => arch),
  }));
}

/**
 * Get market correlation insights from temporal patterns
 */
export function getMarketCorrelationInsights(patterns: TemporalPattern[]): {
  peakPredictionHours: number[];
  asianSessionAdvantage: number;
  europeanSessionAdvantage: number;
  americasSessionAdvantage: number;
  weekendCorrelation: string;
} {
  // Find hours with highest hybrid vs stockfish advantage
  const advantages = patterns.map(p => ({
    hour: p.hour,
    advantage: p.avgHybridAccuracy - p.avgStockfishAccuracy,
    count: p.gamesCount,
  })).filter(p => p.count > 0);
  
  const peakPredictionHours = advantages
    .sort((a, b) => b.advantage - a.advantage)
    .slice(0, 3)
    .map(p => p.hour);
  
  // Calculate session advantages
  const asianHours = patterns.filter(p => p.hour >= 0 && p.hour < 8);
  const europeanHours = patterns.filter(p => p.hour >= 8 && p.hour < 16);
  const americasHours = patterns.filter(p => p.hour >= 16 && p.hour < 24);
  
  const calcAdvantage = (hours: TemporalPattern[]) => {
    const totalCount = hours.reduce((sum, h) => sum + h.gamesCount, 0);
    if (totalCount === 0) return 0;
    const weightedHybrid = hours.reduce((sum, h) => sum + h.avgHybridAccuracy * h.gamesCount, 0);
    const weightedSF = hours.reduce((sum, h) => sum + h.avgStockfishAccuracy * h.gamesCount, 0);
    return (weightedHybrid - weightedSF) / totalCount;
  };
  
  return {
    peakPredictionHours,
    asianSessionAdvantage: calcAdvantage(asianHours),
    europeanSessionAdvantage: calcAdvantage(europeanHours),
    americasSessionAdvantage: calcAdvantage(americasHours),
    weekendCorrelation: 'Weekend games show different cognitive patterns - more recreational, less competitive pressure',
  };
}

/**
 * Format temporal context for display
 */
export function formatTemporalContext(context: TemporalContext): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const regions = {
    americas: '🇺🇸 Americas',
    europe: '🇪🇺 Europe',
    asia: '🇯🇵 Asia',
    unknown: '🌍 Unknown',
  };
  
  return `${days[context.dayOfWeek]} ${context.hourUTC}:00 UTC | ${regions[context.likelyRegion]} (~${context.localHourEstimate}:00 local) | ${context.marketSession.toUpperCase()} session | ${context.cognitiveWindow} window`;
}
