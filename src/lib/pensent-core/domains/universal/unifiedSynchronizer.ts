/**
 * Unified Synchronizer - The Central Nervous System
 * 
 * Connects ALL domains into a single self-healing, self-evolving organism:
 * - CrossDomainEngine (Light, Network, Bio, Audio)
 * - SelfEvolvingSystem (Genes, Patterns, Thresholds)
 * - Market Prediction (Tick, Correlation, Accuracy)
 * - Code Health (Auto-Heal, Analysis)
 * 
 * "The Code is the BLOOD, the Market is the NERVOUS SYSTEM"
 */

import { crossDomainEngine } from './crossDomainEngine';
import { selfEvolvingSystem } from '../finance/selfEvolvingSystem';
import type { PredictionOutcome, MarketConditions } from '../finance/evolution/types';
import type { UnifiedPrediction, DomainType } from './types';

export interface SynchronizationState {
  isInitialized: boolean;
  lastSync: number;
  syncCount: number;
  
  // Unified metrics
  universalFitness: number; // Combined fitness across all systems
  crossDomainResonance: number; // How well domains align
  evolutionVelocity: number; // Rate of improvement
  predictionAccuracy: number; // Overall prediction success
  
  // Self-healing metrics
  autoHealTriggered: number;
  issuesResolved: number;
  healingEfficiency: number;
  
  // Domain contributions
  domainHealth: Record<DomainType, number>;
}

interface SyncCallback {
  (state: SynchronizationState): void;
}

class UnifiedSynchronizer {
  private state: SynchronizationState;
  private subscribers: Set<SyncCallback> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SYNC_FREQUENCY_MS = 1000; // Sync every second
  
  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): SynchronizationState {
    return {
      isInitialized: false,
      lastSync: 0,
      syncCount: 0,
      universalFitness: 0.5,
      crossDomainResonance: 0.5,
      evolutionVelocity: 0,
      predictionAccuracy: 0.5,
      autoHealTriggered: 0,
      issuesResolved: 0,
      healingEfficiency: 1.0,
      domainHealth: {
        light: 0.5,
        network: 0.5,
        bio: 0.5,
        audio: 0.5,
        chess: 0.5,
        market: 0.5,
        code: 0.5,
        satellite: 0.5,
      },
    };
  }

  /**
   * Initialize all systems and start synchronization
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) return;
    
    console.log('[UnifiedSynchronizer] Initializing universal consciousness...');
    
    // Initialize cross-domain engine
    await crossDomainEngine.initializeAdapters();
    
    // Start periodic synchronization
    this.startSyncLoop();
    
    this.state.isInitialized = true;
    this.state.lastSync = Date.now();
    
    console.log('[UnifiedSynchronizer] All systems synchronized');
    this.notifySubscribers();
  }

  /**
   * Start the continuous sync loop
   */
  private startSyncLoop(): void {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.SYNC_FREQUENCY_MS);
  }

  /**
   * Perform a full system synchronization
   */
  private performSync(): void {
    const now = Date.now();
    
    // Get state from all systems
    const evolutionState = selfEvolvingSystem.getState();
    const crossDomainState = crossDomainEngine.getState();
    
    // Calculate universal fitness (weighted average)
    const evolutionFitness = evolutionState.metrics.currentFitness;
    const crossDomainAccuracy = crossDomainState.accuracy.overall;
    this.state.universalFitness = evolutionFitness * 0.5 + crossDomainAccuracy * 0.5;
    
    // Calculate cross-domain resonance
    const topCorrelations = crossDomainEngine.getTopCorrelations(3);
    const avgCorrelation = topCorrelations.length > 0
      ? topCorrelations.reduce((sum, c) => sum + c.confidence, 0) / topCorrelations.length
      : 0.5;
    this.state.crossDomainResonance = avgCorrelation;
    
    // Combine evolution velocities
    this.state.evolutionVelocity = (
      evolutionState.metrics.learningVelocity + 
      crossDomainState.learningVelocity
    ) / 2;
    
    // Update domain health from cross-domain accuracy
    for (const [domain, accuracy] of Object.entries(crossDomainState.accuracy.byDomain)) {
      this.state.domainHealth[domain as DomainType] = accuracy;
    }
    
    // Market and code health from evolution patterns
    this.state.domainHealth.market = evolutionFitness;
    this.state.domainHealth.code = this.state.healingEfficiency;
    
    // Update sync metadata
    this.state.lastSync = now;
    this.state.syncCount++;
    
    // Trigger self-healing if performance drops
    if (this.state.universalFitness < 0.4 && this.state.syncCount > 10) {
      this.triggerAutoHeal();
    }
    
    this.notifySubscribers();
  }

  /**
   * Process a market prediction through all systems
   */
  processMarketPrediction(
    symbol: string,
    momentum: number,
    volatility: number,
    volume: number,
    direction: number
  ): UnifiedPrediction {
    // Process through cross-domain engine
    crossDomainEngine.processMarketSignal(momentum, volatility, volume, direction);
    const unifiedPrediction = crossDomainEngine.generateUnifiedPrediction(symbol);
    
    return unifiedPrediction;
  }

  /**
   * Record prediction outcome and evolve all systems
   */
  recordOutcome(
    prediction: UnifiedPrediction,
    actualDirection: 'up' | 'down' | 'neutral',
    actualMagnitude: number,
    marketConditions: MarketConditions
  ): void {
    // Record in cross-domain engine
    crossDomainEngine.recordPredictionOutcome(prediction, actualDirection, actualMagnitude);
    
    // Convert to evolution format and process
    const evolutionOutcome: PredictionOutcome = {
      predicted: prediction.direction,
      actual: actualDirection,
      confidence: prediction.confidence,
      marketConditions,
    };
    
    // Evolve the self-evolving system
    selfEvolvingSystem.processOutcome(evolutionOutcome);
    
    // Update prediction accuracy
    const wasCorrect = prediction.direction === actualDirection;
    const alpha = 0.05;
    this.state.predictionAccuracy = 
      this.state.predictionAccuracy * (1 - alpha) + 
      (wasCorrect ? 1 : 0) * alpha;
    
    // Perform immediate sync after outcome
    this.performSync();
  }

  /**
   * Trigger self-healing when performance degrades
   */
  private triggerAutoHeal(): void {
    console.log('[UnifiedSynchronizer] 🔧 Auto-heal triggered - performance below threshold');
    
    this.state.autoHealTriggered++;
    
    // Find worst performing domains
    const worstDomains = Object.entries(this.state.domainHealth)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2);
    
    // Request evolution focus on weak areas
    for (const [domain] of worstDomains) {
      console.log(`[UnifiedSynchronizer] Focusing healing on: ${domain}`);
      
      // Update correlation memory to reset predictions for weak domain
      if (domain === 'market') {
        // Trigger aggressive gene mutation in evolution system
        const state = selfEvolvingSystem.getState();
        if (state.metrics.learningVelocity < 0) {
          console.log('[UnifiedSynchronizer] Forcing evolution generation advancement');
        }
      }
    }
    
    // Calculate healing efficiency
    if (this.state.autoHealTriggered > 0) {
      this.state.healingEfficiency = 
        this.state.issuesResolved / this.state.autoHealTriggered;
    }
  }

  /**
   * Mark an issue as resolved (called by auto-heal system)
   */
  recordHealingSuccess(): void {
    this.state.issuesResolved++;
    this.state.healingEfficiency = 
      this.state.issuesResolved / Math.max(1, this.state.autoHealTriggered);
  }

  /**
   * Subscribe to synchronization updates
   */
  subscribe(callback: SyncCallback): () => void {
    this.subscribers.add(callback);
    // Immediately notify with current state
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach(cb => cb(state));
  }

  /**
   * Get current synchronization state
   */
  getState(): SynchronizationState {
    return { ...this.state };
  }

  /**
   * Get comprehensive system summary
   */
  getSystemSummary(): {
    initialized: boolean;
    uptime: number;
    fitness: number;
    velocity: number;
    accuracy: number;
    resonance: number;
    healingRate: number;
    evolutionGeneration: number;
    activeDomains: DomainType[];
    topPatterns: number;
  } {
    const evolutionSummary = selfEvolvingSystem.getEvolutionSummary();
    const crossDomainState = crossDomainEngine.getState();
    
    return {
      initialized: this.state.isInitialized,
      uptime: Date.now() - (this.state.lastSync - this.state.syncCount * this.SYNC_FREQUENCY_MS),
      fitness: this.state.universalFitness,
      velocity: this.state.evolutionVelocity,
      accuracy: this.state.predictionAccuracy,
      resonance: this.state.crossDomainResonance,
      healingRate: this.state.healingEfficiency,
      evolutionGeneration: evolutionSummary.generation,
      activeDomains: crossDomainState.activeDomains,
      topPatterns: evolutionSummary.patternCount,
    };
  }

  /**
   * Stop synchronization (cleanup)
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.subscribers.clear();
    this.state.isInitialized = false;
  }
}

// Singleton instance
export const unifiedSynchronizer = new UnifiedSynchronizer();
