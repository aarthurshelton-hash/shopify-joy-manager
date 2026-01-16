/**
 * En Pensent Code - Type Definitions
 * 
 * Code-specific types for analyzing software development patterns
 */

import { TemporalSignature, QuadrantProfile, TemporalFlow, CriticalMoment } from '../pensent-core/types';

// ============================================================================
// CODE DOMAIN TYPES
// ============================================================================

/**
 * A single commit in the code evolution
 */
export interface CodeCommit {
  /** Commit hash/ID */
  id: string;
  /** Commit message */
  message: string;
  /** Author name or ID */
  author: string;
  /** Timestamp */
  timestamp: Date;
  /** Files changed */
  filesChanged: CodeFileChange[];
  /** Lines added */
  additions: number;
  /** Lines removed */
  deletions: number;
  /** Optional: branch name */
  branch?: string;
}

/**
 * A file change within a commit
 */
export interface CodeFileChange {
  /** File path */
  path: string;
  /** Change type */
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  /** Lines added */
  additions: number;
  /** Lines removed */
  deletions: number;
  /** File category (derived from path/extension) */
  category: FileCategory;
}

/**
 * File categories for quadrant mapping
 */
export type FileCategory = 
  | 'frontend'      // UI components, styles, views
  | 'backend'       // Server logic, APIs, database
  | 'tests'         // Test files
  | 'config'        // Configuration, build, deployment
  | 'docs'          // Documentation
  | 'assets'        // Static assets, images
  | 'types'         // Type definitions
  | 'utils'         // Utilities, helpers
  | 'unknown';

/**
 * Code Flow Signature - extends TemporalSignature with code-specific data
 */
export interface CodeFlowSignature extends TemporalSignature {
  /** Code-specific archetype */
  archetype: CodeArchetype;
  /** Code quadrant profile maps to file categories */
  quadrantProfile: CodeQuadrantProfile;
  /** Code-specific temporal flow */
  temporalFlow: CodeTemporalFlow;
  /** Code-specific metrics */
  codeMetrics: CodeMetrics;
  /** Domain identifier */
  domainData: {
    domain: 'code';
    totalCommits: number;
    totalAuthors: number;
    dateRange: { start: Date; end: Date };
    primaryLanguage?: string;
  };
}

/**
 * Code quadrant profile - maps activity to code regions
 */
export interface CodeQuadrantProfile extends QuadrantProfile {
  /** Frontend activity (UI, styles, components) */
  q1: number;
  /** Backend activity (APIs, server, database) */
  q2: number;
  /** Test activity (unit, integration, e2e) */
  q3: number;
  /** Config/infra activity (build, deploy, docs) */
  q4: number;
  /** Utility/shared code activity */
  center?: number;
  /** Detailed breakdown by category */
  custom?: {
    frontend: number;
    backend: number;
    tests: number;
    config: number;
    docs: number;
    types: number;
    utils: number;
  };
}

/**
 * Code temporal flow with development-specific metrics
 */
export interface CodeTemporalFlow extends TemporalFlow {
  /** Development velocity trend */
  velocityTrend: 'accelerating' | 'stable' | 'declining';
  /** Bug fix to feature ratio */
  bugToFeatureRatio: number;
  /** Refactor to new code ratio */
  refactorRatio: number;
  /** Test coverage trend */
  testCoverageTrend: 'improving' | 'stable' | 'declining';
}

/**
 * Code-specific metrics
 */
export interface CodeMetrics {
  /** Average commit size (lines changed) */
  avgCommitSize: number;
  /** Commit frequency (commits per day) */
  commitFrequency: number;
  /** Code churn rate (additions + deletions / total lines) */
  churnRate: number;
  /** Number of unique contributors */
  contributorCount: number;
  /** File concentration (how focused changes are) */
  fileConcentration: number;
  /** Bug indicator keywords in commits */
  bugIndicatorCount: number;
  /** Refactor indicator keywords in commits */
  refactorIndicatorCount: number;
  /** Feature indicator keywords in commits */
  featureIndicatorCount: number;
}

// ============================================================================
// CODE ARCHETYPES
// ============================================================================

/**
 * Code-specific strategic archetypes
 */
export type CodeArchetype =
  | 'rapid_growth'          // Fast feature development, high additions
  | 'refactor_cycle'        // Heavy refactoring, balanced adds/deletes
  | 'tech_debt_spiral'      // Accumulating complexity, declining tests
  | 'stability_plateau'     // Maintenance mode, small changes
  | 'feature_burst'         // Concentrated feature work
  | 'death_march'           // Unsustainable pace, declining quality
  | 'test_driven'           // High test coverage, quality focus
  | 'documentation_push'    // Documentation and cleanup focus
  | 'infrastructure_shift'  // Major architecture/config changes
  | 'bug_hunting'           // Bug fix focused period
  | 'greenfield'            // New project, mostly additions
  | 'legacy_rescue';        // Fixing/improving old codebase

/**
 * Code archetype definitions with success patterns
 */
export const CODE_ARCHETYPE_DEFINITIONS: Record<CodeArchetype, {
  name: string;
  description: string;
  successRate: number;
  predictedOutcome: 'success' | 'failure' | 'uncertain';
  confidence: number;
  keywords: string[];
  relatedArchetypes: CodeArchetype[];
  warningSignals: string[];
  recommendations: string[];
}> = {
  rapid_growth: {
    name: 'Rapid Growth',
    description: 'Fast feature development with high code additions',
    successRate: 0.65,
    predictedOutcome: 'success',
    confidence: 0.7,
    keywords: ['add', 'feature', 'implement', 'create', 'new'],
    relatedArchetypes: ['feature_burst', 'greenfield'],
    warningSignals: ['Test coverage declining', 'Rising bug reports'],
    recommendations: ['Maintain test coverage', 'Schedule refactoring sprints']
  },
  refactor_cycle: {
    name: 'Refactor Cycle',
    description: 'Focused code improvement and restructuring',
    successRate: 0.75,
    predictedOutcome: 'success',
    confidence: 0.8,
    keywords: ['refactor', 'cleanup', 'improve', 'restructure', 'optimize'],
    relatedArchetypes: ['tech_debt_spiral', 'legacy_rescue'],
    warningSignals: ['Scope creep', 'Breaking changes accumulating'],
    recommendations: ['Complete refactoring before new features', 'Increase test coverage']
  },
  tech_debt_spiral: {
    name: 'Tech Debt Spiral',
    description: 'Accumulating technical debt with declining quality indicators',
    successRate: 0.35,
    predictedOutcome: 'failure',
    confidence: 0.75,
    keywords: ['hack', 'workaround', 'todo', 'fixme', 'temporary'],
    relatedArchetypes: ['death_march', 'bug_hunting'],
    warningSignals: ['Rising bug count', 'Declining velocity', 'Team burnout'],
    recommendations: ['Stop feature work', 'Dedicated debt reduction sprint', 'Code review enforcement']
  },
  stability_plateau: {
    name: 'Stability Plateau',
    description: 'Maintenance mode with minimal changes',
    successRate: 0.7,
    predictedOutcome: 'success',
    confidence: 0.6,
    keywords: ['fix', 'update', 'bump', 'minor', 'patch'],
    relatedArchetypes: ['documentation_push', 'test_driven'],
    warningSignals: ['Stagnation risk', 'Missing innovation'],
    recommendations: ['Plan next feature cycle', 'Evaluate modernization opportunities']
  },
  feature_burst: {
    name: 'Feature Burst',
    description: 'Concentrated period of feature development',
    successRate: 0.6,
    predictedOutcome: 'uncertain',
    confidence: 0.65,
    keywords: ['feature', 'add', 'implement', 'ship', 'release'],
    relatedArchetypes: ['rapid_growth', 'death_march'],
    warningSignals: ['Quality degradation', 'Integration issues'],
    recommendations: ['Plan consolidation period', 'Increase QA resources']
  },
  death_march: {
    name: 'Death March',
    description: 'Unsustainable development pace with declining quality',
    successRate: 0.25,
    predictedOutcome: 'failure',
    confidence: 0.85,
    keywords: ['urgent', 'hotfix', 'asap', 'critical', 'emergency'],
    relatedArchetypes: ['tech_debt_spiral', 'bug_hunting'],
    warningSignals: ['Team burnout imminent', 'Quality in freefall'],
    recommendations: ['Reduce scope immediately', 'Prioritize sustainability', 'Consider team health']
  },
  test_driven: {
    name: 'Test Driven',
    description: 'Quality-focused development with high test coverage',
    successRate: 0.8,
    predictedOutcome: 'success',
    confidence: 0.85,
    keywords: ['test', 'spec', 'coverage', 'assert', 'mock'],
    relatedArchetypes: ['refactor_cycle', 'stability_plateau'],
    warningSignals: ['Over-testing', 'Slow velocity'],
    recommendations: ['Balance test investment', 'Focus on critical paths']
  },
  documentation_push: {
    name: 'Documentation Push',
    description: 'Focus on documentation and knowledge sharing',
    successRate: 0.7,
    predictedOutcome: 'success',
    confidence: 0.7,
    keywords: ['docs', 'readme', 'comment', 'explain', 'guide'],
    relatedArchetypes: ['stability_plateau', 'refactor_cycle'],
    warningSignals: ['Documentation debt', 'Knowledge silos'],
    recommendations: ['Integrate docs into workflow', 'Regular doc reviews']
  },
  infrastructure_shift: {
    name: 'Infrastructure Shift',
    description: 'Major changes to build, deploy, or architecture',
    successRate: 0.55,
    predictedOutcome: 'uncertain',
    confidence: 0.6,
    keywords: ['config', 'deploy', 'ci', 'docker', 'infrastructure', 'migrate'],
    relatedArchetypes: ['refactor_cycle', 'greenfield'],
    warningSignals: ['Breaking changes', 'Deployment issues'],
    recommendations: ['Thorough testing', 'Staged rollout', 'Rollback plan']
  },
  bug_hunting: {
    name: 'Bug Hunting',
    description: 'Focused period of bug fixes and issue resolution',
    successRate: 0.7,
    predictedOutcome: 'success',
    confidence: 0.75,
    keywords: ['fix', 'bug', 'issue', 'resolve', 'patch', 'error'],
    relatedArchetypes: ['tech_debt_spiral', 'stability_plateau'],
    warningSignals: ['Recurring bugs', 'Root cause not addressed'],
    recommendations: ['Address root causes', 'Improve error handling', 'Add regression tests']
  },
  greenfield: {
    name: 'Greenfield',
    description: 'New project with mostly additions',
    successRate: 0.6,
    predictedOutcome: 'uncertain',
    confidence: 0.5,
    keywords: ['init', 'initial', 'setup', 'create', 'scaffold'],
    relatedArchetypes: ['rapid_growth', 'feature_burst'],
    warningSignals: ['Architecture decisions pending', 'Foundation quality'],
    recommendations: ['Establish patterns early', 'Invest in foundation', 'Set up CI/CD']
  },
  legacy_rescue: {
    name: 'Legacy Rescue',
    description: 'Modernizing and improving old codebase',
    successRate: 0.5,
    predictedOutcome: 'uncertain',
    confidence: 0.55,
    keywords: ['upgrade', 'migrate', 'modernize', 'deprecate', 'replace'],
    relatedArchetypes: ['refactor_cycle', 'infrastructure_shift'],
    warningSignals: ['Compatibility issues', 'Hidden complexity'],
    recommendations: ['Incremental migration', 'Maintain compatibility', 'Comprehensive testing']
  }
};

// ============================================================================
// COMMIT CLASSIFICATION
// ============================================================================

/**
 * Commit type classification
 */
export type CommitType = 
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'test'
  | 'docs'
  | 'chore'
  | 'style'
  | 'perf'
  | 'build'
  | 'ci'
  | 'revert'
  | 'unknown';

/**
 * Keywords for classifying commits
 */
export const COMMIT_TYPE_KEYWORDS: Record<CommitType, string[]> = {
  feature: ['feat', 'feature', 'add', 'implement', 'create', 'new', 'support'],
  bugfix: ['fix', 'bug', 'issue', 'resolve', 'patch', 'error', 'crash', 'hotfix'],
  refactor: ['refactor', 'restructure', 'cleanup', 'improve', 'optimize', 'simplify'],
  test: ['test', 'spec', 'coverage', 'jest', 'mocha', 'cypress', 'e2e'],
  docs: ['docs', 'readme', 'documentation', 'comment', 'jsdoc', 'guide'],
  chore: ['chore', 'update', 'bump', 'upgrade', 'deps', 'dependencies'],
  style: ['style', 'format', 'lint', 'prettier', 'eslint', 'whitespace'],
  perf: ['perf', 'performance', 'optimize', 'speed', 'faster', 'cache'],
  build: ['build', 'webpack', 'vite', 'bundle', 'compile'],
  ci: ['ci', 'cd', 'pipeline', 'github actions', 'deploy', 'workflow'],
  revert: ['revert', 'rollback', 'undo'],
  unknown: []
};

/**
 * File extension to category mapping
 */
export const FILE_CATEGORY_MAP: Record<string, FileCategory> = {
  // Frontend
  '.tsx': 'frontend',
  '.jsx': 'frontend',
  '.vue': 'frontend',
  '.svelte': 'frontend',
  '.css': 'frontend',
  '.scss': 'frontend',
  '.less': 'frontend',
  '.html': 'frontend',
  
  // Backend
  '.py': 'backend',
  '.go': 'backend',
  '.rs': 'backend',
  '.java': 'backend',
  '.rb': 'backend',
  '.php': 'backend',
  '.sql': 'backend',
  
  // Tests
  '.test.ts': 'tests',
  '.test.tsx': 'tests',
  '.test.js': 'tests',
  '.spec.ts': 'tests',
  '.spec.js': 'tests',
  '.cy.ts': 'tests',
  '.cy.js': 'tests',
  
  // Config
  '.json': 'config',
  '.yaml': 'config',
  '.yml': 'config',
  '.toml': 'config',
  '.env': 'config',
  
  // Docs
  '.md': 'docs',
  '.mdx': 'docs',
  '.txt': 'docs',
  
  // Types
  '.d.ts': 'types',
  
  // Utils (determined by path)
  '.ts': 'utils', // Default, overridden by path analysis
  '.js': 'utils',
  
  // Assets
  '.png': 'assets',
  '.jpg': 'assets',
  '.svg': 'assets',
  '.gif': 'assets',
  '.ico': 'assets',
  '.webp': 'assets',
  '.mp4': 'assets',
  '.mp3': 'assets'
};
