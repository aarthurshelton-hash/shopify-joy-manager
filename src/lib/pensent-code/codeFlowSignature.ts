/**
 * En Pensent Code - Signature Extraction
 * 
 * Extract Code Flow Signatures from commit histories
 */

import {
  CodeCommit,
  CodeFileChange,
  CodeFlowSignature,
  CodeQuadrantProfile,
  CodeTemporalFlow,
  CodeMetrics,
  CodeArchetype,
  FileCategory,
  CommitType,
  COMMIT_TYPE_KEYWORDS,
  FILE_CATEGORY_MAP,
  CODE_ARCHETYPE_DEFINITIONS
} from './types';
import {
  generateFingerprint,
  calculateTemporalFlow,
  detectCriticalMoments,
  determineDominantForce,
  determineFlowDirection
} from '../pensent-core/signatureExtractor';
import { CriticalMoment } from '../pensent-core/types';

/**
 * Extract a Code Flow Signature from a sequence of commits
 */
export function extractCodeFlowSignature(commits: CodeCommit[]): CodeFlowSignature {
  if (commits.length === 0) {
    return createEmptyCodeSignature();
  }
  
  // Sort commits by timestamp
  const sortedCommits = [...commits].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate metrics
  const codeMetrics = calculateCodeMetrics(sortedCommits);
  
  // Calculate quadrant profile (activity by code region)
  const quadrantProfile = calculateCodeQuadrantProfile(sortedCommits);
  
  // Calculate temporal flow
  const temporalFlow = calculateCodeTemporalFlow(sortedCommits, codeMetrics);
  
  // Detect critical moments
  const criticalMoments = detectCodeCriticalMoments(sortedCommits);
  
  // Classify archetype
  const archetype = classifyCodeArchetype(quadrantProfile, temporalFlow, codeMetrics);
  
  // Calculate intensity
  const intensity = calculateCodeIntensity(codeMetrics, temporalFlow);
  
  // Determine dominant force (frontend vs backend focus)
  const dominantForce = determineDominantForce(
    quadrantProfile.q1 + (quadrantProfile.custom?.frontend ?? 0),
    quadrantProfile.q2 + (quadrantProfile.custom?.backend ?? 0),
    0.1
  );
  
  // Determine flow direction
  const flowDirection = determineFlowDirection(quadrantProfile);
  
  // Generate fingerprint
  const fingerprint = generateFingerprint(
    quadrantProfile,
    temporalFlow,
    archetype,
    intensity
  );
  
  // Date range
  const dateRange = {
    start: sortedCommits[0].timestamp,
    end: sortedCommits[sortedCommits.length - 1].timestamp
  };
  
  // Unique authors
  const uniqueAuthors = new Set(sortedCommits.map(c => c.author)).size;
  
  return {
    fingerprint,
    archetype,
    dominantForce,
    flowDirection,
    intensity,
    quadrantProfile,
    temporalFlow,
    criticalMoments,
    codeMetrics,
    domainData: {
      domain: 'code',
      totalCommits: sortedCommits.length,
      totalAuthors: uniqueAuthors,
      dateRange
    }
  };
}

/**
 * Create an empty code signature
 */
function createEmptyCodeSignature(): CodeFlowSignature {
  return {
    fingerprint: 'EP-00000000',
    archetype: 'stability_plateau',
    dominantForce: 'balanced',
    flowDirection: 'chaotic',
    intensity: 0,
    quadrantProfile: {
      q1: 0.25, q2: 0.25, q3: 0.25, q4: 0.25,
      custom: { frontend: 0, backend: 0, tests: 0, config: 0, docs: 0, types: 0, utils: 0 }
    },
    temporalFlow: {
      opening: 0, middle: 0, ending: 0,
      trend: 'stable', momentum: 0,
      velocityTrend: 'stable',
      bugToFeatureRatio: 0,
      refactorRatio: 0,
      testCoverageTrend: 'stable'
    },
    criticalMoments: [],
    codeMetrics: {
      avgCommitSize: 0,
      commitFrequency: 0,
      churnRate: 0,
      contributorCount: 0,
      fileConcentration: 0,
      bugIndicatorCount: 0,
      refactorIndicatorCount: 0,
      featureIndicatorCount: 0
    },
    domainData: {
      domain: 'code',
      totalCommits: 0,
      totalAuthors: 0,
      dateRange: { start: new Date(), end: new Date() }
    }
  };
}

/**
 * Calculate code metrics from commits
 */
function calculateCodeMetrics(commits: CodeCommit[]): CodeMetrics {
  if (commits.length === 0) {
    return {
      avgCommitSize: 0,
      commitFrequency: 0,
      churnRate: 0,
      contributorCount: 0,
      fileConcentration: 0,
      bugIndicatorCount: 0,
      refactorIndicatorCount: 0,
      featureIndicatorCount: 0
    };
  }
  
  // Calculate average commit size
  const totalLines = commits.reduce((sum, c) => sum + c.additions + c.deletions, 0);
  const avgCommitSize = totalLines / commits.length;
  
  // Calculate commit frequency (commits per day)
  const firstCommit = commits[0].timestamp.getTime();
  const lastCommit = commits[commits.length - 1].timestamp.getTime();
  const daySpan = Math.max(1, (lastCommit - firstCommit) / (1000 * 60 * 60 * 24));
  const commitFrequency = commits.length / daySpan;
  
  // Calculate churn rate
  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  const churnRate = totalLines > 0 ? totalDeletions / totalLines : 0;
  
  // Count unique contributors
  const contributorCount = new Set(commits.map(c => c.author)).size;
  
  // Calculate file concentration
  const fileChangeCounts: Record<string, number> = {};
  for (const commit of commits) {
    for (const file of commit.filesChanged) {
      fileChangeCounts[file.path] = (fileChangeCounts[file.path] ?? 0) + 1;
    }
  }
  const totalFileChanges = Object.values(fileChangeCounts).reduce((a, b) => a + b, 0);
  const topFileChanges = Object.values(fileChangeCounts).sort((a, b) => b - a).slice(0, 10);
  const topFileSum = topFileChanges.reduce((a, b) => a + b, 0);
  const fileConcentration = totalFileChanges > 0 ? topFileSum / totalFileChanges : 0;
  
  // Count commit type indicators
  let bugIndicatorCount = 0;
  let refactorIndicatorCount = 0;
  let featureIndicatorCount = 0;
  
  for (const commit of commits) {
    const messageLower = commit.message.toLowerCase();
    
    if (COMMIT_TYPE_KEYWORDS.bugfix.some(kw => messageLower.includes(kw))) {
      bugIndicatorCount++;
    }
    if (COMMIT_TYPE_KEYWORDS.refactor.some(kw => messageLower.includes(kw))) {
      refactorIndicatorCount++;
    }
    if (COMMIT_TYPE_KEYWORDS.feature.some(kw => messageLower.includes(kw))) {
      featureIndicatorCount++;
    }
  }
  
  return {
    avgCommitSize,
    commitFrequency,
    churnRate,
    contributorCount,
    fileConcentration,
    bugIndicatorCount,
    refactorIndicatorCount,
    featureIndicatorCount
  };
}

/**
 * Calculate code quadrant profile from commits
 */
function calculateCodeQuadrantProfile(commits: CodeCommit[]): CodeQuadrantProfile {
  const categoryWeights: Record<FileCategory, number> = {
    frontend: 0,
    backend: 0,
    tests: 0,
    config: 0,
    docs: 0,
    types: 0,
    utils: 0,
    assets: 0,
    unknown: 0
  };
  
  let totalWeight = 0;
  
  for (const commit of commits) {
    for (const file of commit.filesChanged) {
      const category = categorizeFile(file.path);
      const weight = file.additions + file.deletions;
      categoryWeights[category] += weight;
      totalWeight += weight;
    }
  }
  
  if (totalWeight === 0) {
    totalWeight = 1; // Prevent division by zero
  }
  
  // Normalize weights
  for (const category of Object.keys(categoryWeights) as FileCategory[]) {
    categoryWeights[category] /= totalWeight;
  }
  
  // Map to quadrants
  // Q1 = Frontend (UI focus)
  // Q2 = Backend (Server focus)
  // Q3 = Tests (Quality focus)
  // Q4 = Config + Docs (Infrastructure focus)
  
  return {
    q1: categoryWeights.frontend + categoryWeights.assets * 0.5,
    q2: categoryWeights.backend + categoryWeights.types * 0.5,
    q3: categoryWeights.tests,
    q4: categoryWeights.config + categoryWeights.docs,
    center: categoryWeights.utils + categoryWeights.types * 0.5 + categoryWeights.assets * 0.5,
    custom: {
      frontend: categoryWeights.frontend,
      backend: categoryWeights.backend,
      tests: categoryWeights.tests,
      config: categoryWeights.config,
      docs: categoryWeights.docs,
      types: categoryWeights.types,
      utils: categoryWeights.utils
    }
  };
}

/**
 * Categorize a file by its path and extension
 */
function categorizeFile(path: string): FileCategory {
  const pathLower = path.toLowerCase();
  
  // Check for test files first (can be .ts, .tsx, etc.)
  if (pathLower.includes('.test.') || pathLower.includes('.spec.') || 
      pathLower.includes('__tests__') || pathLower.includes('/test/') ||
      pathLower.includes('.cy.')) {
    return 'tests';
  }
  
  // Check for docs
  if (pathLower.includes('/docs/') || pathLower.includes('readme') ||
      pathLower.endsWith('.md') || pathLower.endsWith('.mdx')) {
    return 'docs';
  }
  
  // Check for config
  if (pathLower.includes('config') || pathLower.includes('.env') ||
      pathLower.endsWith('.json') || pathLower.endsWith('.yaml') ||
      pathLower.endsWith('.yml') || pathLower.endsWith('.toml') ||
      pathLower.includes('dockerfile') || pathLower.includes('docker-compose')) {
    return 'config';
  }
  
  // Check for frontend paths
  if (pathLower.includes('/components/') || pathLower.includes('/pages/') ||
      pathLower.includes('/views/') || pathLower.includes('/ui/') ||
      pathLower.includes('/styles/') || pathLower.includes('/css/') ||
      pathLower.endsWith('.css') || pathLower.endsWith('.scss') ||
      pathLower.endsWith('.tsx') || pathLower.endsWith('.jsx') ||
      pathLower.endsWith('.vue') || pathLower.endsWith('.svelte')) {
    return 'frontend';
  }
  
  // Check for backend paths
  if (pathLower.includes('/api/') || pathLower.includes('/server/') ||
      pathLower.includes('/backend/') || pathLower.includes('/functions/') ||
      pathLower.includes('/routes/') || pathLower.includes('/controllers/') ||
      pathLower.includes('/models/') || pathLower.includes('/services/') ||
      pathLower.endsWith('.sql') || pathLower.endsWith('.py') ||
      pathLower.endsWith('.go') || pathLower.endsWith('.rs') ||
      pathLower.endsWith('.java') || pathLower.endsWith('.rb')) {
    return 'backend';
  }
  
  // Check for types
  if (pathLower.includes('/types/') || pathLower.endsWith('.d.ts') ||
      pathLower.includes('/interfaces/')) {
    return 'types';
  }
  
  // Check for utils
  if (pathLower.includes('/utils/') || pathLower.includes('/helpers/') ||
      pathLower.includes('/lib/') || pathLower.includes('/shared/')) {
    return 'utils';
  }
  
  // Check for assets
  if (pathLower.includes('/assets/') || pathLower.includes('/images/') ||
      pathLower.includes('/public/') || pathLower.includes('/static/') ||
      pathLower.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|mp3|wav)$/)) {
    return 'assets';
  }
  
  // Default based on extension
  const ext = '.' + pathLower.split('.').pop();
  return FILE_CATEGORY_MAP[ext] ?? 'unknown';
}

/**
 * Calculate code temporal flow
 */
function calculateCodeTemporalFlow(
  commits: CodeCommit[],
  metrics: CodeMetrics
): CodeTemporalFlow {
  // Calculate activity levels per commit
  const activityLevels = commits.map(c => 
    Math.min(1, (c.additions + c.deletions) / 500) // Normalize to 0-1
  );
  
  // Use core temporal flow calculation
  const baseFlow = calculateTemporalFlow(activityLevels);
  
  // Calculate velocity trend
  const halfIndex = Math.floor(commits.length / 2);
  const firstHalf = commits.slice(0, halfIndex);
  const secondHalf = commits.slice(halfIndex);
  
  const firstHalfAvg = firstHalf.length > 0 
    ? firstHalf.reduce((sum, c) => sum + c.additions + c.deletions, 0) / firstHalf.length 
    : 0;
  const secondHalfAvg = secondHalf.length > 0 
    ? secondHalf.reduce((sum, c) => sum + c.additions + c.deletions, 0) / secondHalf.length 
    : 0;
  
  let velocityTrend: 'accelerating' | 'stable' | 'declining';
  if (secondHalfAvg > firstHalfAvg * 1.2) {
    velocityTrend = 'accelerating';
  } else if (secondHalfAvg < firstHalfAvg * 0.8) {
    velocityTrend = 'declining';
  } else {
    velocityTrend = 'stable';
  }
  
  // Calculate bug to feature ratio
  const bugToFeatureRatio = metrics.featureIndicatorCount > 0 
    ? metrics.bugIndicatorCount / metrics.featureIndicatorCount 
    : metrics.bugIndicatorCount;
  
  // Calculate refactor ratio
  const totalIndicators = metrics.bugIndicatorCount + metrics.refactorIndicatorCount + metrics.featureIndicatorCount;
  const refactorRatio = totalIndicators > 0 
    ? metrics.refactorIndicatorCount / totalIndicators 
    : 0;
  
  // Determine test coverage trend (based on test file activity)
  const testCommitCount = commits.filter(c => 
    c.filesChanged.some(f => categorizeFile(f.path) === 'tests')
  ).length;
  const testRatio = commits.length > 0 ? testCommitCount / commits.length : 0;
  
  let testCoverageTrend: 'improving' | 'stable' | 'declining';
  if (testRatio > 0.3) {
    testCoverageTrend = 'improving';
  } else if (testRatio < 0.1) {
    testCoverageTrend = 'declining';
  } else {
    testCoverageTrend = 'stable';
  }
  
  return {
    ...baseFlow,
    velocityTrend,
    bugToFeatureRatio,
    refactorRatio,
    testCoverageTrend
  };
}

/**
 * Detect critical moments in code evolution
 */
function detectCodeCriticalMoments(commits: CodeCommit[]): CriticalMoment[] {
  const moments: CriticalMoment[] = [];
  
  if (commits.length < 3) return moments;
  
  // Calculate change magnitudes
  const magnitudes = commits.map(c => c.additions + c.deletions);
  const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const magnitude = magnitudes[i];
    
    // Large commits (> 3x average)
    if (magnitude > avgMagnitude * 3) {
      moments.push({
        index: i,
        type: 'major_change',
        severity: Math.min(1, magnitude / (avgMagnitude * 5)),
        description: `Major change: ${commit.message.substring(0, 50)}...`,
        metadata: { commitId: commit.id, filesChanged: commit.filesChanged.length }
      });
    }
    
    // Hotfix/emergency commits
    const messageLower = commit.message.toLowerCase();
    if (messageLower.includes('hotfix') || messageLower.includes('emergency') || 
        messageLower.includes('critical') || messageLower.includes('urgent')) {
      moments.push({
        index: i,
        type: 'emergency',
        severity: 0.9,
        description: `Emergency: ${commit.message.substring(0, 50)}...`,
        metadata: { commitId: commit.id }
      });
    }
    
    // Revert commits
    if (messageLower.includes('revert')) {
      moments.push({
        index: i,
        type: 'revert',
        severity: 0.7,
        description: `Revert: ${commit.message.substring(0, 50)}...`,
        metadata: { commitId: commit.id }
      });
    }
    
    // Breaking changes
    if (messageLower.includes('breaking') || messageLower.includes('migration required')) {
      moments.push({
        index: i,
        type: 'breaking_change',
        severity: 0.85,
        description: `Breaking change: ${commit.message.substring(0, 50)}...`,
        metadata: { commitId: commit.id }
      });
    }
  }
  
  // Sort by index and limit
  moments.sort((a, b) => a.index - b.index);
  return moments.slice(0, 10);
}

/**
 * Classify code archetype from signature components
 */
function classifyCodeArchetype(
  quadrantProfile: CodeQuadrantProfile,
  temporalFlow: CodeTemporalFlow,
  metrics: CodeMetrics
): CodeArchetype {
  // Score each archetype
  const scores: Record<CodeArchetype, number> = {
    rapid_growth: 0,
    refactor_cycle: 0,
    tech_debt_spiral: 0,
    stability_plateau: 0,
    feature_burst: 0,
    death_march: 0,
    test_driven: 0,
    documentation_push: 0,
    infrastructure_shift: 0,
    bug_hunting: 0,
    greenfield: 0,
    legacy_rescue: 0
  };
  
  // Rapid growth indicators
  if (temporalFlow.velocityTrend === 'accelerating') scores.rapid_growth += 2;
  if (metrics.featureIndicatorCount > metrics.bugIndicatorCount * 2) scores.rapid_growth += 2;
  if (metrics.avgCommitSize > 100) scores.rapid_growth += 1;
  
  // Refactor cycle indicators
  const refactorRatio = metrics.refactorIndicatorCount / Math.max(1, metrics.bugIndicatorCount + metrics.refactorIndicatorCount + metrics.featureIndicatorCount);
  if (refactorRatio > 0.3) scores.refactor_cycle += 3;
  if (metrics.churnRate > 0.4) scores.refactor_cycle += 1;
  
  // Tech debt spiral indicators
  if (temporalFlow.bugToFeatureRatio > 1) scores.tech_debt_spiral += 2;
  if (temporalFlow.testCoverageTrend === 'declining') scores.tech_debt_spiral += 2;
  if (metrics.churnRate > 0.6) scores.tech_debt_spiral += 1;
  
  // Stability plateau indicators
  if (temporalFlow.trend === 'stable' && metrics.avgCommitSize < 50) scores.stability_plateau += 3;
  if (temporalFlow.velocityTrend === 'stable') scores.stability_plateau += 1;
  
  // Feature burst indicators
  if (metrics.featureIndicatorCount > metrics.refactorIndicatorCount * 2) scores.feature_burst += 2;
  if (temporalFlow.momentum > 0.5) scores.feature_burst += 1;
  
  // Death march indicators
  if (temporalFlow.velocityTrend === 'accelerating' && temporalFlow.bugToFeatureRatio > 0.5) scores.death_march += 2;
  if (metrics.commitFrequency > 10) scores.death_march += 1; // Very high commit frequency
  
  // Test driven indicators
  if (quadrantProfile.q3 > 0.25) scores.test_driven += 3;
  if (temporalFlow.testCoverageTrend === 'improving') scores.test_driven += 2;
  
  // Documentation push indicators
  if ((quadrantProfile.custom?.docs ?? 0) > 0.15) scores.documentation_push += 3;
  
  // Infrastructure shift indicators
  if (quadrantProfile.q4 > 0.3) scores.infrastructure_shift += 3;
  
  // Bug hunting indicators
  if (temporalFlow.bugToFeatureRatio > 2) scores.bug_hunting += 3;
  if (metrics.bugIndicatorCount > metrics.featureIndicatorCount) scores.bug_hunting += 1;
  
  // Greenfield indicators
  if (metrics.churnRate < 0.1) scores.greenfield += 2;
  if (quadrantProfile.custom?.config ?? 0 > 0.2) scores.greenfield += 1;
  
  // Legacy rescue indicators
  if (metrics.churnRate > 0.5 && refactorRatio > 0.2) scores.legacy_rescue += 2;
  
  // Find highest scoring archetype
  let maxScore = 0;
  let bestArchetype: CodeArchetype = 'stability_plateau';
  
  for (const [archetype, score] of Object.entries(scores) as [CodeArchetype, number][]) {
    if (score > maxScore) {
      maxScore = score;
      bestArchetype = archetype;
    }
  }
  
  return bestArchetype;
}

/**
 * Calculate code intensity
 */
function calculateCodeIntensity(
  metrics: CodeMetrics,
  temporalFlow: CodeTemporalFlow
): number {
  // Factors contributing to intensity
  const commitSizeIntensity = Math.min(1, metrics.avgCommitSize / 200);
  const frequencyIntensity = Math.min(1, metrics.commitFrequency / 5);
  const churnIntensity = metrics.churnRate;
  const momentumIntensity = (temporalFlow.momentum + 1) / 2; // Normalize from -1..1 to 0..1
  
  // Weighted average
  return (
    commitSizeIntensity * 0.25 +
    frequencyIntensity * 0.25 +
    churnIntensity * 0.25 +
    momentumIntensity * 0.25
  );
}

/**
 * Classify commit type from message
 */
export function classifyCommitType(message: string): CommitType {
  const messageLower = message.toLowerCase();
  
  for (const [type, keywords] of Object.entries(COMMIT_TYPE_KEYWORDS) as [CommitType, string[]][]) {
    if (keywords.some(kw => messageLower.includes(kw))) {
      return type;
    }
  }
  
  return 'unknown';
}
