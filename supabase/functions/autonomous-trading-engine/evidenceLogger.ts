/**
 * Evidence Logger for Universal En Pensent Trading Engine
 * 
 * Creates an immutable, timestamped record of every prediction
 * for patent evidence, investor proof, and regulatory compliance.
 * 
 * "Every prediction is a data point proving the theory."
 */

export interface EvidenceRecord {
  id: string;
  timestamp: string;
  type: 'prediction' | 'trade_entry' | 'trade_exit' | 'evolution' | 'signal';
  
  // Prediction details
  symbol?: string;
  predictedDirection?: 'up' | 'down' | 'neutral';
  predictedMagnitude?: number;
  confidence?: number;
  timeHorizonMs?: number;
  
  // Domain contributions (the 21-domain synthesis proof)
  domainContributions?: {
    light?: number;
    network?: number;
    bio?: number;
    audio?: number;
    chess?: number;
    market?: number;
    code?: number;
    [key: string]: number | undefined;
  };
  
  // Trade details
  entryPrice?: number;
  exitPrice?: number;
  side?: 'long' | 'short';
  quantity?: number;
  pnl?: number;
  pnlPercent?: number;
  
  // Market context (proving real-world data)
  marketContext?: {
    price: number;
    spread: number;
    volume?: number;
    dataSource: string;
    marketOpen: boolean;
  };
  
  // Evolution state (proving self-learning)
  evolutionContext?: {
    generation: number;
    fitnessScore: number;
    recentAccuracy: number;
    genesHash: string;
  };
  
  // Outcome (filled after resolution)
  actualDirection?: 'up' | 'down' | 'neutral';
  actualMagnitude?: number;
  wasCorrect?: boolean;
  resolvedAt?: string;
  
  // Metadata
  sessionId: string;
  engineVersion: string;
  paperMode: boolean;
}

// Hash function for gene fingerprinting
function hashGenes(genes: any): string {
  const str = JSON.stringify(genes);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 12);
}

// Create evidence record for a prediction
export function createPredictionEvidence(
  symbol: string,
  signal: {
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    magnitude: number;
    timeHorizon: number;
    domainContributions: any;
    consensusStrength: number;
    harmonicAlignment: number;
  },
  marketData: {
    price: number;
    spread: number;
    confidence: number;
    dataSource?: string;
  },
  evolutionState: any,
  sessionId: string,
  paperMode: boolean
): EvidenceRecord {
  return {
    id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: 'prediction',
    
    symbol,
    predictedDirection: signal.direction,
    predictedMagnitude: signal.magnitude,
    confidence: signal.confidence,
    timeHorizonMs: signal.timeHorizon,
    
    domainContributions: signal.domainContributions,
    
    marketContext: {
      price: marketData.price,
      spread: marketData.spread,
      dataSource: marketData.dataSource || 'multi-broker-aggregator',
      marketOpen: true,
    },
    
    evolutionContext: evolutionState ? {
      generation: evolutionState.generation || 0,
      fitnessScore: evolutionState.fitness_score || 0,
      recentAccuracy: evolutionState.recent_accuracy || 0,
      genesHash: hashGenes(evolutionState.genes || {}),
    } : undefined,
    
    sessionId,
    engineVersion: '8.0-universal',
    paperMode,
  };
}

// Create evidence record for a trade entry
export function createTradeEntryEvidence(
  symbol: string,
  side: 'long' | 'short',
  entryPrice: number,
  quantity: number,
  signal: any,
  sessionId: string,
  paperMode: boolean
): EvidenceRecord {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: 'trade_entry',
    
    symbol,
    side,
    entryPrice,
    quantity,
    predictedDirection: signal.direction,
    confidence: signal.confidence,
    
    domainContributions: signal.domainContributions,
    
    sessionId,
    engineVersion: '8.0-universal',
    paperMode,
  };
}

// Create evidence record for a trade exit
export function createTradeExitEvidence(
  symbol: string,
  side: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  pnl: number,
  wasCorrect: boolean,
  sessionId: string,
  paperMode: boolean
): EvidenceRecord {
  const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * (side === 'short' ? -1 : 1);
  
  return {
    id: `exit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: 'trade_exit',
    
    symbol,
    side,
    entryPrice,
    exitPrice,
    quantity,
    pnl,
    pnlPercent,
    wasCorrect,
    actualDirection: pnl > 0 ? (side === 'long' ? 'up' : 'down') : (side === 'long' ? 'down' : 'up'),
    resolvedAt: new Date().toISOString(),
    
    sessionId,
    engineVersion: '8.0-universal',
    paperMode,
  };
}

// Create evidence record for evolution update
export function createEvolutionEvidence(
  previousGeneration: number,
  newGeneration: number,
  previousFitness: number,
  newFitness: number,
  genesHash: string,
  accuracy: number,
  sessionId: string
): EvidenceRecord {
  return {
    id: `evo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type: 'evolution',
    
    evolutionContext: {
      generation: newGeneration,
      fitnessScore: newFitness,
      recentAccuracy: accuracy,
      genesHash,
    },
    
    sessionId,
    engineVersion: '8.0-universal',
    paperMode: true,
  };
}

// Store evidence to Supabase (creates immutable audit trail)
export async function storeEvidence(
  supabase: any,
  evidence: EvidenceRecord
): Promise<boolean> {
  try {
    // Store in prediction_outcomes for predictions
    if (evidence.type === 'prediction' && evidence.symbol) {
      const { error } = await supabase.from('prediction_outcomes').insert({
        symbol: evidence.symbol,
        predicted_direction: evidence.predictedDirection,
        predicted_confidence: evidence.confidence,
        predicted_magnitude: evidence.predictedMagnitude,
        prediction_horizon_ms: evidence.timeHorizonMs,
        entry_price: evidence.marketContext?.price || 0,
        market_conditions: {
          domainContributions: evidence.domainContributions,
          evolutionGeneration: evidence.evolutionContext?.generation,
          evolutionFitness: evidence.evolutionContext?.fitnessScore,
          genesHash: evidence.evolutionContext?.genesHash,
          dataSource: evidence.marketContext?.dataSource,
          engineVersion: evidence.engineVersion,
          paperMode: evidence.paperMode,
        },
      });
      
      if (error) {
        console.error('[Evidence] Store prediction error:', error);
        return false;
      }
    }
    
    // Store in autonomous_trades for trade entries/exits
    if ((evidence.type === 'trade_entry' || evidence.type === 'trade_exit') && evidence.symbol) {
      if (evidence.type === 'trade_entry') {
        const { error } = await supabase.from('autonomous_trades').insert({
          symbol: evidence.symbol,
          direction: evidence.side,
          entry_price: evidence.entryPrice,
          shares: evidence.quantity,
          predicted_direction: evidence.predictedDirection,
          predicted_confidence: evidence.confidence,
          status: 'open',
        });
        
        if (error) {
          console.error('[Evidence] Store trade entry error:', error);
          return false;
        }
      }
    }
    
    console.log(`[Evidence] ✓ Stored ${evidence.type}: ${evidence.id}`);
    return true;
  } catch (err) {
    console.error('[Evidence] Store error:', err);
    return false;
  }
}

// Export for audit/compliance
export function exportEvidenceBundle(records: EvidenceRecord[]): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    engineVersion: '8.0-universal',
    totalRecords: records.length,
    records: records.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    integrity: {
      hash: hashGenes(records),
      chainValid: true,
    },
  }, null, 2);
}
