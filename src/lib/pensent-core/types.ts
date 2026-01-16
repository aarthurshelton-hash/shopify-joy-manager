/**
 * En Pensent Core SDK - Universal Types
 * 
 * Domain-agnostic pattern recognition interfaces that can be applied
 * to any temporal-spatial-chromatic domain: chess, code, music, light, health, etc.
 */

// ============================================================================
// CORE SIGNATURE TYPES
// ============================================================================

/**
 * Universal quadrant/region profile for any 2D spatial domain
 * Generalizes chess quadrants to any grid-based or region-based analysis
 */
export interface QuadrantProfile {
  /** Top-left or primary region activity (0-1) */
  q1: number;
  /** Top-right or secondary region activity (0-1) */
  q2: number;
  /** Bottom-left or tertiary region activity (0-1) */
  q3: number;
  /** Bottom-right or quaternary region activity (0-1) */
  q4: number;
  /** Optional: center region for domains with central focus */
  center?: number;
  /** Optional: custom named regions for domain-specific analysis */
  custom?: Record<string, number>;
}

/**
 * Temporal flow describes how activity evolves over time
 */
export interface TemporalFlow {
  /** Activity level in opening/early phase (0-1) */
  opening: number;
  /** Activity level in middle/development phase (0-1) */
  middle: number;
  /** Activity level in endgame/completion phase (0-1) */
  ending: number;
  /** Trend direction */
  trend: 'accelerating' | 'stable' | 'declining' | 'volatile';
  /** Momentum score (-1 to 1, negative = losing momentum) */
  momentum: number;
}

/**
 * Critical moments are turning points in the temporal sequence
 */
export interface CriticalMoment {
  /** Position in sequence (0-indexed) */
  index: number;
  /** Type of critical moment */
  type: string;
  /** Severity/importance (0-1) */
  severity: number;
  /** Human-readable description */
  description: string;
  /** Domain-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Universal temporal signature - the core pattern fingerprint
 * Every domain implements this with domain-specific details
 */
export interface TemporalSignature {
  /** Unique hash fingerprint of this pattern */
  fingerprint: string;
  /** Strategic archetype classification */
  archetype: string;
  /** Dominant side/direction/force */
  dominantForce: 'primary' | 'secondary' | 'balanced';
  /** Flow direction tendency */
  flowDirection: 'forward' | 'lateral' | 'backward' | 'chaotic';
  /** Overall intensity/activity level (0-1) */
  intensity: number;
  /** Spatial distribution profile */
  quadrantProfile: QuadrantProfile;
  /** Temporal evolution profile */
  temporalFlow: TemporalFlow;
  /** Key turning points */
  criticalMoments: CriticalMoment[];
  /** Domain-specific extended data */
  domainData?: Record<string, unknown>;
}

// ============================================================================
// ARCHETYPE SYSTEM
// ============================================================================

/**
 * Archetype definition describes a strategic pattern category
 */
export interface ArchetypeDefinition {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of this pattern type */
  description: string;
  /** Historical success rate (0-1) */
  successRate: number;
  /** Typical outcome prediction */
  predictedOutcome: 'primary_wins' | 'secondary_wins' | 'draw' | 'uncertain';
  /** Confidence in predictions for this archetype (0-1) */
  confidence: number;
  /** Keywords for matching */
  keywords: string[];
  /** Related archetypes for fuzzy matching */
  relatedArchetypes: string[];
}

/**
 * Archetype registry for a domain
 */
export interface ArchetypeRegistry {
  /** Domain name */
  domain: string;
  /** Version of archetype definitions */
  version: string;
  /** All archetype definitions */
  archetypes: Record<string, ArchetypeDefinition>;
}

// ============================================================================
// PATTERN MATCHING
// ============================================================================

/**
 * A matched pattern from the database
 */
export interface PatternMatch {
  /** Pattern ID from database */
  patternId: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** The matched pattern's signature */
  signature: TemporalSignature;
  /** Outcome of this historical pattern */
  outcome: string;
  /** Metadata about the source */
  sourceMetadata?: Record<string, unknown>;
}

/**
 * Pattern search criteria
 */
export interface PatternSearchCriteria {
  /** Target signature to match against */
  targetSignature: TemporalSignature;
  /** Minimum similarity threshold (0-1) */
  minSimilarity?: number;
  /** Maximum results to return */
  limit?: number;
  /** Filter by archetype */
  archetypeFilter?: string[];
  /** Filter by outcome */
  outcomeFilter?: string[];
}

// ============================================================================
// TRAJECTORY PREDICTION
// ============================================================================

/**
 * A milestone in the predicted trajectory
 */
export interface TrajectoryMilestone {
  /** Predicted position in sequence */
  predictedIndex: number;
  /** What happens at this milestone */
  event: string;
  /** Probability of this occurring (0-1) */
  probability: number;
  /** Impact if it occurs (-1 to 1) */
  impact: number;
  /** Recommended action */
  recommendation?: string;
}

/**
 * Full trajectory prediction
 */
export interface TrajectoryPrediction {
  /** Predicted final outcome */
  predictedOutcome: string;
  /** Confidence in prediction (0-1) */
  confidence: number;
  /** Win probability for primary side */
  primaryWinProbability: number;
  /** Win probability for secondary side */
  secondaryWinProbability: number;
  /** Draw/neutral probability */
  drawProbability: number;
  /** Key milestones ahead */
  milestones: TrajectoryMilestone[];
  /** Recommended strategy */
  strategicGuidance: string;
  /** How far ahead we can reliably predict */
  lookaheadHorizon: number;
  /** Based on how many similar patterns */
  patternSampleSize: number;
}

// ============================================================================
// HYBRID FUSION
// ============================================================================

/**
 * Tactical insight from calculation-based analysis
 */
export interface TacticalInsight {
  /** Evaluation score (domain-specific units) */
  evaluation: number;
  /** Best calculated move/action */
  bestAction: string;
  /** Calculation depth */
  depth: number;
  /** Confidence in calculation (0-1) */
  confidence: number;
  /** Key tactical themes */
  themes: string[];
}

/**
 * Strategic insight from pattern-based analysis
 */
export interface StrategicInsight {
  /** Strategic archetype */
  archetype: string;
  /** Long-term trajectory assessment */
  trajectory: 'improving' | 'stable' | 'declining';
  /** Key strategic factors */
  factors: string[];
  /** Confidence in strategic assessment (0-1) */
  confidence: number;
}

/**
 * Fused recommendation combining tactical and strategic
 */
export interface FusedRecommendation {
  /** Primary recommended action */
  action: string;
  /** Tactical reasoning */
  tacticalReason: string;
  /** Strategic reasoning */
  strategicReason: string;
  /** Combined confidence (0-1) */
  confidence: number;
  /** Priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Alternative actions */
  alternatives: string[];
}

/**
 * Complete hybrid prediction combining all analysis
 */
export interface HybridPrediction {
  /** Domain this prediction applies to */
  domain: string;
  /** Timestamp of analysis */
  timestamp: number;
  /** Position/state being analyzed */
  currentState: string;
  /** Tactical analysis results */
  tactical: TacticalInsight;
  /** Strategic analysis results */
  strategic: StrategicInsight;
  /** Fused recommendation */
  recommendation: FusedRecommendation;
  /** Full trajectory prediction */
  trajectory: TrajectoryPrediction;
  /** Overall confidence in hybrid prediction */
  overallConfidence: number;
}

// ============================================================================
// DOMAIN ADAPTER INTERFACE
// ============================================================================

/**
 * Interface that each domain must implement to use the En Pensent engine
 */
export interface DomainAdapter<TInput, TState> {
  /** Domain identifier */
  readonly domain: string;
  
  /** Convert raw input to sequence of states */
  parseInput(input: TInput): TState[];
  
  /** Extract signature from state sequence */
  extractSignature(states: TState[]): TemporalSignature;
  
  /** Get archetype registry for this domain */
  getArchetypeRegistry(): ArchetypeRegistry;
  
  /** Classify signature into archetype */
  classifyArchetype(signature: TemporalSignature): string;
  
  /** Calculate similarity between two signatures */
  calculateSimilarity(a: TemporalSignature, b: TemporalSignature): number;
  
  /** Generate tactical insight (if domain supports calculation) */
  analyzeTactically?(state: TState): Promise<TacticalInsight>;
  
  /** Render state for human viewing */
  renderState(state: TState): string;
}

// ============================================================================
// PERSISTENCE TYPES
// ============================================================================

/**
 * Persisted pattern record
 */
export interface PersistedPattern {
  id: string;
  domain: string;
  fingerprint: string;
  archetype: string;
  outcome: string;
  signature: TemporalSignature;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

/**
 * Pattern statistics
 */
export interface PatternStats {
  domain: string;
  totalPatterns: number;
  byArchetype: Record<string, number>;
  byOutcome: Record<string, number>;
  averageSimilarityScore: number;
  oldestPattern: string;
  newestPattern: string;
}
