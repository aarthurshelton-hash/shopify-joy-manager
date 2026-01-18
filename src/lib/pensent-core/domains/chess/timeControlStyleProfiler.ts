/**
 * Time Control Style Profiler
 * 
 * Maps chess time controls to cognitive fingerprints and trading styles.
 * A player's relative ELO across time controls reveals their decision-making DNA:
 * 
 * TIME CONTROL → TRADING STYLE MAPPING:
 * - Bullet/Ultrabullet → Scalping/HFT (intuitive, pattern-reflex)
 * - Blitz → Day Trading (balanced speed/analysis)
 * - Rapid → Swing Trading (deliberate, trend-focused)
 * - Classical → Position Trading (deep calculation)
 * - Correspondence → Long-term Investing (Warren Buffett patience)
 * 
 * The ELO VARIANCE between time controls is the key insight:
 * - High Bullet, Low Classical = Intuitive player (thrives under pressure)
 * - High Classical, Low Bullet = Analytical player (needs time to calculate)
 * - Consistent across all = Balanced cognitive profile
 */

export type TimeControlCategory = 
  | 'ultrabullet'  // < 30 seconds per side
  | 'bullet'       // 1-2 minutes per side
  | 'blitz'        // 3-5 minutes per side
  | 'rapid'        // 10-15 minutes per side
  | 'classical'    // 30+ minutes per side
  | 'correspondence'; // Days per move

export type TradingStyleEquivalent = 
  | 'high_frequency'    // HFT, millisecond decisions
  | 'scalping'          // Seconds to minutes
  | 'day_trading'       // Hours, same-day close
  | 'swing_trading'     // Days to weeks
  | 'position_trading'  // Weeks to months
  | 'long_term_investing'; // Months to years

export interface TimeControlElo {
  category: TimeControlCategory;
  elo: number;
  gamesPlayed: number;
  winRate: number;
  averageMoveTime?: number;
  blunderRate?: number;
}

export interface StyleProfile {
  // Core identity
  dominantStyle: TimeControlCategory;
  weakestStyle: TimeControlCategory;
  
  // The key insight: ELO variance reveals cognitive DNA
  eloVariance: number;  // Standard deviation across time controls
  maxEloDelta: number;  // Biggest gap between any two time controls
  
  // Cognitive fingerprint (0-1 scale)
  intuitionScore: number;      // High bullet performance = high intuition
  calculationScore: number;    // High classical performance = high calculation
  pressureResistance: number;  // Performance under time pressure
  consistencyScore: number;    // How stable across time controls
  
  // Trading style mapping
  optimalTradingStyle: TradingStyleEquivalent;
  riskTolerance: 'low' | 'medium' | 'high' | 'extreme';
  
  // Predictions
  volatilityAffinity: number;     // 0 = prefers calm markets, 1 = thrives in chaos
  decisionSpeed: number;          // 0 = slow/deliberate, 1 = instant
  reversalProbability: number;    // Likelihood of changing position under pressure
  panicSellProbability: number;   // Based on blunder rate under time pressure
  
  // Market tempo matching
  optimalMarketConditions: {
    volatility: 'low' | 'medium' | 'high';
    trendStrength: 'ranging' | 'trending' | 'strong_trend';
    timeframe: string;
  };
}

export interface TimeControlStyleMapping {
  timeControl: TimeControlCategory;
  tradingStyle: TradingStyleEquivalent;
  decisionWindow: string;
  cognitiveProfile: string;
  marketEquivalent: string;
  strengthIndicators: string[];
  weaknessIndicators: string[];
}

// The core mapping between chess and trading
export const TIME_CONTROL_MAPPINGS: TimeControlStyleMapping[] = [
  {
    timeControl: 'ultrabullet',
    tradingStyle: 'high_frequency',
    decisionWindow: '< 1 second',
    cognitiveProfile: 'Pure pattern recognition, no calculation',
    marketEquivalent: 'Algorithmic HFT, order flow reading',
    strengthIndicators: [
      'Instant pattern recognition',
      'Thrives in chaos',
      'No analysis paralysis',
      'Intuitive risk assessment'
    ],
    weaknessIndicators: [
      'May miss deep opportunities',
      'Susceptible to traps',
      'Inconsistent in slow markets',
      'Overtrading tendency'
    ]
  },
  {
    timeControl: 'bullet',
    tradingStyle: 'scalping',
    decisionWindow: '1-30 seconds',
    cognitiveProfile: 'Fast pattern + minimal verification',
    marketEquivalent: 'Scalping, momentum riding',
    strengthIndicators: [
      'Quick position entry/exit',
      'Strong momentum reading',
      'Handles volatility well',
      'Fast adaptation'
    ],
    weaknessIndicators: [
      'May exit winners too early',
      'Stress under slow markets',
      'Tendency to force trades',
      'Higher transaction costs'
    ]
  },
  {
    timeControl: 'blitz',
    tradingStyle: 'day_trading',
    decisionWindow: '30 seconds - 5 minutes',
    cognitiveProfile: 'Balanced speed and analysis',
    marketEquivalent: 'Day trading, intraday swings',
    strengthIndicators: [
      'Balanced risk/reward',
      'Good position sizing',
      'Moderate stress handling',
      'Adaptable timeframes'
    ],
    weaknessIndicators: [
      'Jack of all trades',
      'May second-guess decisions',
      'Moderate in all conditions',
      'Average pattern depth'
    ]
  },
  {
    timeControl: 'rapid',
    tradingStyle: 'swing_trading',
    decisionWindow: '5-30 minutes',
    cognitiveProfile: 'Thoughtful analysis with time constraints',
    marketEquivalent: 'Swing trading, multi-day holds',
    strengthIndicators: [
      'Trend identification',
      'Patient entry points',
      'Good risk management',
      'Sees bigger picture'
    ],
    weaknessIndicators: [
      'Slow in fast markets',
      'May miss quick opportunities',
      'Overthinking tendency',
      'Struggles with volatility spikes'
    ]
  },
  {
    timeControl: 'classical',
    tradingStyle: 'position_trading',
    decisionWindow: '30+ minutes',
    cognitiveProfile: 'Deep calculation, comprehensive analysis',
    marketEquivalent: 'Position trading, fundamental analysis',
    strengthIndicators: [
      'Deep market understanding',
      'Patient capital deployment',
      'Strong risk assessment',
      'Ignores noise'
    ],
    weaknessIndicators: [
      'Paralysis by analysis',
      'Misses fast moves',
      'May hold losers too long',
      'Struggles with HFT environments'
    ]
  },
  {
    timeControl: 'correspondence',
    tradingStyle: 'long_term_investing',
    decisionWindow: 'Days to weeks',
    cognitiveProfile: 'Research-driven, fundamental focus',
    marketEquivalent: 'Value investing, Warren Buffett style',
    strengthIndicators: [
      'Ignores short-term noise',
      'Strong thesis development',
      'Patient compounding',
      'Low transaction costs'
    ],
    weaknessIndicators: [
      'Slow to react to changes',
      'May miss regime shifts',
      'Capital efficiency concerns',
      'Opportunity cost'
    ]
  }
];

/**
 * Analyze time control ELOs to generate a style profile
 */
export function analyzeTimeControlProfile(elos: TimeControlElo[]): StyleProfile {
  if (elos.length === 0) {
    return getDefaultProfile();
  }

  // Sort by ELO to find dominant/weakest
  const sorted = [...elos].sort((a, b) => b.elo - a.elo);
  const dominantStyle = sorted[0].category;
  const weakestStyle = sorted[sorted.length - 1].category;
  
  // Calculate variance
  const avgElo = elos.reduce((sum, e) => sum + e.elo, 0) / elos.length;
  const eloVariance = Math.sqrt(
    elos.reduce((sum, e) => sum + Math.pow(e.elo - avgElo, 2), 0) / elos.length
  );
  const maxEloDelta = sorted[0].elo - sorted[sorted.length - 1].elo;
  
  // Calculate cognitive scores
  const bulletPerf = elos.find(e => e.category === 'bullet' || e.category === 'ultrabullet');
  const classicalPerf = elos.find(e => e.category === 'classical' || e.category === 'correspondence');
  const blitzPerf = elos.find(e => e.category === 'blitz');
  
  // Intuition = bullet strength relative to classical
  const intuitionScore = bulletPerf && classicalPerf 
    ? Math.min(1, Math.max(0, 0.5 + (bulletPerf.elo - classicalPerf.elo) / 400))
    : 0.5;
    
  // Calculation = classical strength relative to bullet
  const calculationScore = bulletPerf && classicalPerf
    ? Math.min(1, Math.max(0, 0.5 + (classicalPerf.elo - bulletPerf.elo) / 400))
    : 0.5;
    
  // Pressure resistance = bullet/blitz performance relative to average
  const fastElo = (bulletPerf?.elo || avgElo);
  const pressureResistance = Math.min(1, Math.max(0, 0.5 + (fastElo - avgElo) / 200));
  
  // Consistency = inverse of variance (normalized)
  const consistencyScore = Math.max(0, 1 - (eloVariance / 200));
  
  // Map to trading style
  const optimalTradingStyle = mapToTradingStyle(dominantStyle);
  
  // Risk tolerance based on bullet/ultrabullet affinity
  const riskTolerance = determineRiskTolerance(dominantStyle, intuitionScore);
  
  // Volatility affinity
  const volatilityAffinity = intuitionScore * 0.7 + (1 - consistencyScore) * 0.3;
  
  // Decision speed
  const decisionSpeed = getDecisionSpeed(dominantStyle);
  
  // Reversal probability = low consistency + high intuition
  const reversalProbability = (1 - consistencyScore) * 0.5 + intuitionScore * 0.3;
  
  // Panic sell = poor bullet performance under time pressure
  const avgBlunderRate = elos.reduce((sum, e) => sum + (e.blunderRate || 0.1), 0) / elos.length;
  const panicSellProbability = avgBlunderRate * (1 - pressureResistance);
  
  return {
    dominantStyle,
    weakestStyle,
    eloVariance,
    maxEloDelta,
    intuitionScore,
    calculationScore,
    pressureResistance,
    consistencyScore,
    optimalTradingStyle,
    riskTolerance,
    volatilityAffinity,
    decisionSpeed,
    reversalProbability,
    panicSellProbability,
    optimalMarketConditions: {
      volatility: volatilityAffinity > 0.6 ? 'high' : volatilityAffinity > 0.3 ? 'medium' : 'low',
      trendStrength: calculationScore > 0.6 ? 'strong_trend' : 'trending',
      timeframe: getOptimalTimeframe(dominantStyle)
    }
  };
}

/**
 * Map time control to trading style
 */
function mapToTradingStyle(timeControl: TimeControlCategory): TradingStyleEquivalent {
  const mapping: Record<TimeControlCategory, TradingStyleEquivalent> = {
    'ultrabullet': 'high_frequency',
    'bullet': 'scalping',
    'blitz': 'day_trading',
    'rapid': 'swing_trading',
    'classical': 'position_trading',
    'correspondence': 'long_term_investing'
  };
  return mapping[timeControl];
}

/**
 * Determine risk tolerance from dominant style
 */
function determineRiskTolerance(
  style: TimeControlCategory, 
  intuitionScore: number
): 'low' | 'medium' | 'high' | 'extreme' {
  if (style === 'ultrabullet' && intuitionScore > 0.7) return 'extreme';
  if (style === 'bullet' || style === 'ultrabullet') return 'high';
  if (style === 'blitz') return 'medium';
  if (style === 'rapid') return 'medium';
  return 'low';
}

/**
 * Get decision speed for time control
 */
function getDecisionSpeed(style: TimeControlCategory): number {
  const speeds: Record<TimeControlCategory, number> = {
    'ultrabullet': 1.0,
    'bullet': 0.85,
    'blitz': 0.6,
    'rapid': 0.4,
    'classical': 0.2,
    'correspondence': 0.05
  };
  return speeds[style];
}

/**
 * Get optimal trading timeframe for style
 */
function getOptimalTimeframe(style: TimeControlCategory): string {
  const timeframes: Record<TimeControlCategory, string> = {
    'ultrabullet': '1-5 minute charts',
    'bullet': '5-15 minute charts',
    'blitz': '15min-1hr charts',
    'rapid': '4hr-Daily charts',
    'classical': 'Daily-Weekly charts',
    'correspondence': 'Weekly-Monthly charts'
  };
  return timeframes[style];
}

/**
 * Default profile when no data available
 */
function getDefaultProfile(): StyleProfile {
  return {
    dominantStyle: 'blitz',
    weakestStyle: 'classical',
    eloVariance: 0,
    maxEloDelta: 0,
    intuitionScore: 0.5,
    calculationScore: 0.5,
    pressureResistance: 0.5,
    consistencyScore: 0.5,
    optimalTradingStyle: 'day_trading',
    riskTolerance: 'medium',
    volatilityAffinity: 0.5,
    decisionSpeed: 0.5,
    reversalProbability: 0.3,
    panicSellProbability: 0.2,
    optimalMarketConditions: {
      volatility: 'medium',
      trendStrength: 'trending',
      timeframe: '1hr-4hr charts'
    }
  };
}

/**
 * Compare player style to current market conditions
 * Returns a "fit score" - how well suited this player is for current market
 */
export function calculateMarketFit(
  profile: StyleProfile,
  marketConditions: {
    volatility: number;      // 0-1
    momentum: number;        // -1 to 1
    trendStrength: number;   // 0-1
    timeframeMinutes: number;
  }
): {
  fitScore: number;
  recommendation: string;
  warnings: string[];
} {
  let fitScore = 0.5;
  const warnings: string[] = [];
  
  // Volatility match
  const volMatch = 1 - Math.abs(profile.volatilityAffinity - marketConditions.volatility);
  fitScore += volMatch * 0.3;
  
  // If high volatility and low pressure resistance = warning
  if (marketConditions.volatility > 0.7 && profile.pressureResistance < 0.4) {
    warnings.push('High volatility may trigger panic decisions');
    fitScore -= 0.15;
  }
  
  // Timeframe match
  const optimalMinutes = getOptimalMinutes(profile.dominantStyle);
  const timeframeDiff = Math.abs(marketConditions.timeframeMinutes - optimalMinutes) / optimalMinutes;
  fitScore -= timeframeDiff * 0.2;
  
  // Trend match for calculation-heavy players
  if (profile.calculationScore > 0.6 && marketConditions.trendStrength < 0.3) {
    warnings.push('Ranging market - your analytical style needs trends');
    fitScore -= 0.1;
  }
  
  // Intuition players struggle in slow trends
  if (profile.intuitionScore > 0.7 && marketConditions.momentum === 0) {
    warnings.push('Flat momentum - intuitive style needs action');
    fitScore -= 0.1;
  }
  
  fitScore = Math.max(0, Math.min(1, fitScore));
  
  let recommendation: string;
  if (fitScore > 0.7) {
    recommendation = 'Excellent fit - trade with confidence';
  } else if (fitScore > 0.5) {
    recommendation = 'Moderate fit - adjust position size';
  } else if (fitScore > 0.3) {
    recommendation = 'Poor fit - consider sitting out';
  } else {
    recommendation = 'Stay out - market doesn\'t match your style';
  }
  
  return { fitScore, recommendation, warnings };
}

function getOptimalMinutes(style: TimeControlCategory): number {
  const minutes: Record<TimeControlCategory, number> = {
    'ultrabullet': 1,
    'bullet': 5,
    'blitz': 30,
    'rapid': 240,
    'classical': 1440,
    'correspondence': 10080
  };
  return minutes[style];
}

/**
 * Format style profile for display
 */
export function formatStyleProfile(profile: StyleProfile): {
  summary: string;
  cognitiveFingerprint: string;
  tradingAdvice: string;
  strengthsWeaknesses: { strengths: string[]; weaknesses: string[] };
} {
  const mapping = TIME_CONTROL_MAPPINGS.find(m => m.timeControl === profile.dominantStyle);
  
  return {
    summary: `${profile.dominantStyle.toUpperCase()} dominant (${profile.riskTolerance} risk). ` +
             `ELO variance: ${profile.eloVariance.toFixed(0)} pts. ` +
             `Max gap: ${profile.maxEloDelta.toFixed(0)} pts.`,
    cognitiveFingerprint: 
      `Intuition: ${(profile.intuitionScore * 100).toFixed(0)}% | ` +
      `Calculation: ${(profile.calculationScore * 100).toFixed(0)}% | ` +
      `Pressure Resistance: ${(profile.pressureResistance * 100).toFixed(0)}%`,
    tradingAdvice: 
      `Optimal: ${mapping?.tradingStyle.replace('_', ' ').toUpperCase() || 'N/A'} on ${profile.optimalMarketConditions.timeframe}. ` +
      `Volatility affinity: ${(profile.volatilityAffinity * 100).toFixed(0)}%. ` +
      `Panic sell risk: ${(profile.panicSellProbability * 100).toFixed(0)}%.`,
    strengthsWeaknesses: {
      strengths: mapping?.strengthIndicators || [],
      weaknesses: mapping?.weaknessIndicators || []
    }
  };
}
