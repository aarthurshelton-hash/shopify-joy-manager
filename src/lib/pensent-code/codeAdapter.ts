/**
 * En Pensent Code - Domain Adapter
 * 
 * Implements the DomainAdapter interface for code analysis
 */

import {
  DomainAdapter,
  TemporalSignature,
  ArchetypeRegistry,
  ArchetypeDefinition
} from '../pensent-core/types';
import { calculateSignatureSimilarity } from '../pensent-core/patternMatcher';
import {
  CodeCommit,
  CodeFlowSignature,
  CodeArchetype,
  CODE_ARCHETYPE_DEFINITIONS
} from './types';
import { extractCodeFlowSignature } from './codeFlowSignature';

/**
 * Input format for code analysis
 */
export interface CodeInput {
  commits: CodeCommit[];
  metadata?: {
    repoName?: string;
    primaryLanguage?: string;
    repoUrl?: string;
  };
}

/**
 * Code state represents the codebase at a point in time
 */
export interface CodeState {
  commitIndex: number;
  commit: CodeCommit;
  cumulativeAdditions: number;
  cumulativeDeletions: number;
  activeFiles: Set<string>;
}

/**
 * Code Domain Adapter for En Pensent
 */
export const codeDomainAdapter: DomainAdapter<CodeInput, CodeState> = {
  domain: 'code',
  
  /**
   * Parse commits into sequence of states
   */
  parseInput(input: CodeInput): CodeState[] {
    const states: CodeState[] = [];
    let cumulativeAdditions = 0;
    let cumulativeDeletions = 0;
    const activeFiles = new Set<string>();
    
    // Sort commits by timestamp
    const sortedCommits = [...input.commits].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    for (let i = 0; i < sortedCommits.length; i++) {
      const commit = sortedCommits[i];
      
      cumulativeAdditions += commit.additions;
      cumulativeDeletions += commit.deletions;
      
      // Track active files
      for (const file of commit.filesChanged) {
        if (file.changeType === 'deleted') {
          activeFiles.delete(file.path);
        } else {
          activeFiles.add(file.path);
        }
      }
      
      states.push({
        commitIndex: i,
        commit,
        cumulativeAdditions,
        cumulativeDeletions,
        activeFiles: new Set(activeFiles)
      });
    }
    
    return states;
  },
  
  /**
   * Extract signature from states
   */
  extractSignature(states: CodeState[]): TemporalSignature {
    const commits = states.map(s => s.commit);
    return extractCodeFlowSignature(commits);
  },
  
  /**
   * Get archetype registry for code domain
   */
  getArchetypeRegistry(): ArchetypeRegistry {
    const archetypes: Record<string, ArchetypeDefinition> = {};
    
    for (const [id, def] of Object.entries(CODE_ARCHETYPE_DEFINITIONS)) {
      archetypes[id] = {
        id,
        name: def.name,
        description: def.description,
        successRate: def.successRate,
        predictedOutcome: def.predictedOutcome === 'success' ? 'primary_wins' : 
                         def.predictedOutcome === 'failure' ? 'secondary_wins' : 'uncertain',
        confidence: def.confidence,
        keywords: def.keywords,
        relatedArchetypes: def.relatedArchetypes
      };
    }
    
    return {
      domain: 'code',
      version: '1.0.0',
      archetypes
    };
  },
  
  /**
   * Classify signature into archetype
   */
  classifyArchetype(signature: TemporalSignature): string {
    // The archetype is already determined during signature extraction
    return signature.archetype;
  },
  
  /**
   * Calculate similarity between two code signatures
   */
  calculateSimilarity(a: TemporalSignature, b: TemporalSignature): number {
    return calculateSignatureSimilarity(a, b);
  },
  
  /**
   * Render state for display
   */
  renderState(state: CodeState): string {
    const { commit } = state;
    return `[${commit.id.substring(0, 7)}] ${commit.message} (+${commit.additions}/-${commit.deletions})`;
  }
};

/**
 * Create a code analysis engine
 */
export function createCodeAnalysisEngine() {
  return {
    /**
     * Analyze a repository's commit history
     */
    analyzeRepository(commits: CodeCommit[], metadata?: CodeInput['metadata']): CodeFlowSignature {
      const input: CodeInput = { commits, metadata };
      const states = codeDomainAdapter.parseInput(input);
      return codeDomainAdapter.extractSignature(states) as CodeFlowSignature;
    },
    
    /**
     * Get archetype definition
     */
    getArchetypeDefinition(archetype: CodeArchetype) {
      return CODE_ARCHETYPE_DEFINITIONS[archetype];
    },
    
    /**
     * Compare two repository signatures
     */
    compareSignatures(a: CodeFlowSignature, b: CodeFlowSignature): number {
      return codeDomainAdapter.calculateSimilarity(a, b);
    },
    
    /**
     * Get recommendations for current state
     */
    getRecommendations(signature: CodeFlowSignature): string[] {
      const archetype = signature.archetype;
      const definition = CODE_ARCHETYPE_DEFINITIONS[archetype];
      
      const recommendations: string[] = [...definition.recommendations];
      
      // Add warning-specific recommendations
      for (const warning of definition.warningSignals) {
        // Check if warning applies based on signature
        if (signature.temporalFlow.testCoverageTrend === 'declining' && 
            warning.toLowerCase().includes('test')) {
          recommendations.push('⚠️ ' + warning);
        }
        if (signature.codeMetrics.bugIndicatorCount > signature.codeMetrics.featureIndicatorCount &&
            warning.toLowerCase().includes('bug')) {
          recommendations.push('⚠️ ' + warning);
        }
      }
      
      return recommendations;
    },
    
    /**
     * Predict project outcome
     */
    predictOutcome(signature: CodeFlowSignature): {
      outcome: 'success' | 'failure' | 'uncertain';
      confidence: number;
      reasoning: string;
    } {
      const archetype = signature.archetype;
      const definition = CODE_ARCHETYPE_DEFINITIONS[archetype];
      
      let confidence = definition.confidence;
      
      // Adjust confidence based on signature characteristics
      if (signature.temporalFlow.testCoverageTrend === 'improving') {
        confidence = Math.min(1, confidence + 0.1);
      } else if (signature.temporalFlow.testCoverageTrend === 'declining') {
        confidence = Math.max(0, confidence - 0.1);
      }
      
      if (signature.codeMetrics.bugIndicatorCount > signature.codeMetrics.featureIndicatorCount * 2) {
        confidence = Math.max(0, confidence - 0.15);
      }
      
      return {
        outcome: definition.predictedOutcome,
        confidence,
        reasoning: `Project follows "${definition.name}" pattern with ${Math.round(definition.successRate * 100)}% historical success rate. ${definition.description}`
      };
    }
  };
}
