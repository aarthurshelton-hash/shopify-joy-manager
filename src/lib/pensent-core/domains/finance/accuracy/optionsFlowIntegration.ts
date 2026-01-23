/**
 * Options Flow Integration - v7.53-ACCURACY
 * 
 * Integrates unusual options activity as a leading indicator.
 * Large options trades often precede directional moves.
 */

export type OptionType = 'call' | 'put';
export type FlowType = 'sweep' | 'block' | 'split' | 'normal';

export interface OptionsFlow {
  symbol: string;
  optionType: OptionType;
  flowType: FlowType;
  strike: number;
  expiry: string;
  premium: number;        // Total premium in dollars
  volume: number;         // Number of contracts
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  side: 'bid' | 'ask' | 'mid';
  timestamp: number;
}

export interface FlowSignal {
  symbol: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;       // 0-1
  confidence: number;     // 0-1
  timeToExpiry: number;   // Days
  premiumConcentration: number;  // How concentrated the flow is
  unusualActivity: boolean;
}

/**
 * Thresholds for unusual activity
 */
export const FLOW_THRESHOLDS = {
  minPremium: 100000,           // $100k minimum for significance
  unusualVolumeRatio: 3,        // 3x average volume
  blockSize: 500,               // 500+ contracts = block trade
  sweepSpeed: 60000,            // Sweep within 60 seconds
  ivSpike: 0.2,                 // 20% IV increase
};

/**
 * Analyze options flow for directional bias
 */
export function analyzeOptionsFlow(flows: OptionsFlow[]): FlowSignal {
  if (flows.length === 0) {
    return {
      symbol: '',
      direction: 'neutral',
      strength: 0,
      confidence: 0,
      timeToExpiry: 0,
      premiumConcentration: 0,
      unusualActivity: false,
    };
  }
  
  const symbol = flows[0].symbol;
  
  // Separate calls and puts
  const calls = flows.filter(f => f.optionType === 'call');
  const puts = flows.filter(f => f.optionType === 'put');
  
  // Calculate premium weighted direction
  const callPremium = calls.reduce((sum, f) => sum + f.premium, 0);
  const putPremium = puts.reduce((sum, f) => sum + f.premium, 0);
  const totalPremium = callPremium + putPremium;
  
  if (totalPremium === 0) {
    return {
      symbol,
      direction: 'neutral',
      strength: 0,
      confidence: 0,
      timeToExpiry: 0,
      premiumConcentration: 0,
      unusualActivity: false,
    };
  }
  
  // Premium ratio determines direction
  const callRatio = callPremium / totalPremium;
  const direction: 'bullish' | 'bearish' | 'neutral' = 
    callRatio > 0.6 ? 'bullish' : callRatio < 0.4 ? 'bearish' : 'neutral';
  
  // Strength based on total premium and concentration
  const strengthFromPremium = Math.min(1, totalPremium / 10000000);  // $10M = max strength
  
  // Check for unusual activity
  const hasBlocks = flows.some(f => f.volume >= FLOW_THRESHOLDS.blockSize);
  const hasSweeps = flows.filter(f => f.flowType === 'sweep').length >= 2;
  const hasHighPremium = totalPremium >= FLOW_THRESHOLDS.minPremium * 5;
  const unusualActivity = hasBlocks || hasSweeps || hasHighPremium;
  
  // Confidence based on flow type and ask-side activity
  const askSideFlows = flows.filter(f => f.side === 'ask').length / flows.length;
  const sweepRatio = flows.filter(f => f.flowType === 'sweep').length / flows.length;
  const confidence = (askSideFlows * 0.5) + (sweepRatio * 0.3) + (unusualActivity ? 0.2 : 0);
  
  // Average time to expiry
  const avgExpiry = flows.reduce((sum, f) => {
    const expiryDate = new Date(f.expiry);
    const now = new Date();
    return sum + (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  }, 0) / flows.length;
  
  // Premium concentration (Herfindahl index)
  const premiumShares = flows.map(f => f.premium / totalPremium);
  const concentration = premiumShares.reduce((sum, s) => sum + s * s, 0);
  
  return {
    symbol,
    direction,
    strength: strengthFromPremium * (unusualActivity ? 1.5 : 1),
    confidence: Math.min(1, confidence),
    timeToExpiry: avgExpiry,
    premiumConcentration: concentration,
    unusualActivity,
  };
}

/**
 * Detect smart money positioning from flow patterns
 */
export function detectSmartMoneyFlow(flows: OptionsFlow[]): {
  isSmartMoney: boolean;
  conviction: number;
  expectedTimeframe: 'intraday' | 'swing' | 'position';
  notes: string[];
} {
  const notes: string[] = [];
  let smartMoneyScore = 0;
  
  // Large block trades at bid = smart money buying
  const bidBlocks = flows.filter(f => f.side === 'bid' && f.volume >= FLOW_THRESHOLDS.blockSize);
  if (bidBlocks.length > 0) {
    smartMoneyScore += 0.3;
    notes.push(`${bidBlocks.length} large block(s) at bid`);
  }
  
  // Sweeps indicate urgency = smart money
  const sweeps = flows.filter(f => f.flowType === 'sweep');
  if (sweeps.length >= 2) {
    smartMoneyScore += 0.3;
    notes.push(`${sweeps.length} sweep orders detected`);
  }
  
  // OTM options with high premium = informed speculation
  const avgDelta = flows.reduce((sum, f) => sum + Math.abs(f.delta), 0) / flows.length;
  if (avgDelta < 0.3) {
    const otmPremium = flows.filter(f => Math.abs(f.delta) < 0.3)
      .reduce((sum, f) => sum + f.premium, 0);
    if (otmPremium > FLOW_THRESHOLDS.minPremium * 2) {
      smartMoneyScore += 0.2;
      notes.push('Heavy OTM positioning');
    }
  }
  
  // Short-dated with high premium = directional bet
  const shortDated = flows.filter(f => {
    const expiryDate = new Date(f.expiry);
    const now = new Date();
    return (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 7;
  });
  const shortDatedPremium = shortDated.reduce((sum, f) => sum + f.premium, 0);
  if (shortDatedPremium > FLOW_THRESHOLDS.minPremium) {
    smartMoneyScore += 0.2;
    notes.push('Short-dated conviction trades');
  }
  
  // Determine expected timeframe
  const avgExpiry = flows.reduce((sum, f) => {
    const expiryDate = new Date(f.expiry);
    const now = new Date();
    return sum + (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  }, 0) / flows.length;
  
  const expectedTimeframe: 'intraday' | 'swing' | 'position' = 
    avgExpiry < 1 ? 'intraday' : avgExpiry < 14 ? 'swing' : 'position';
  
  return {
    isSmartMoney: smartMoneyScore >= 0.5,
    conviction: Math.min(1, smartMoneyScore),
    expectedTimeframe,
    notes,
  };
}

/**
 * Integrate options flow into price prediction
 */
export function integrateOptionsFlowPrediction(
  basePrediction: { direction: 'bullish' | 'bearish' | 'neutral'; confidence: number },
  flowSignal: FlowSignal
): { direction: 'bullish' | 'bearish' | 'neutral'; confidence: number; flowInfluence: number } {
  if (!flowSignal.unusualActivity || flowSignal.strength < 0.3) {
    return { ...basePrediction, flowInfluence: 0 };
  }
  
  let { direction, confidence } = basePrediction;
  const flowInfluence = flowSignal.strength * flowSignal.confidence;
  
  // If flow agrees with base prediction, boost confidence
  if (flowSignal.direction === direction || flowSignal.direction === 'neutral') {
    confidence = Math.min(1, confidence * (1 + flowInfluence * 0.5));
  } else {
    // Flow disagrees - reduce confidence or flip
    if (flowInfluence > 0.6) {
      // Strong flow signal overrides
      direction = flowSignal.direction;
      confidence = flowInfluence * 0.7;
    } else {
      // Moderate disagreement reduces confidence
      confidence *= (1 - flowInfluence * 0.5);
    }
  }
  
  return { direction, confidence, flowInfluence };
}
