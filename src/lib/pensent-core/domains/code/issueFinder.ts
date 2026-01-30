/**
 * Issue Finder
 * 
 * Detects critical issues and warnings in codebase analysis.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { FileAnalysis } from './types';
import { HealthIssue } from './healthTypes';

/**
 * Find critical issues requiring immediate attention
 */
export function findCriticalIssues(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): HealthIssue[] {
  const issues: HealthIssue[] = [];
  
  // Critical complexity files
  const criticalFiles = files.filter(f => f.complexity === 'critical');
  if (criticalFiles.length > 0) {
    issues.push({
      id: 'critical-complexity',
      severity: 'critical',
      category: 'core-sdk',
      dimension: 'complexity',
      title: 'Critical Complexity Detected',
      description: `${criticalFiles.length} files have critical complexity levels`,
      affectedFiles: criticalFiles.map(f => f.path),
      suggestedFix: 'Split large files into smaller, focused modules',
      estimatedEffort: criticalFiles.length > 3 ? 'weeks' : 'days',
    });
  }
  
  // Very low pattern density in core files
  const lowPatternCore = files.filter(
    f => f.category === 'core-sdk' && f.patternDensity < 0.1
  );
  if (lowPatternCore.length > 0) {
    issues.push({
      id: 'core-sdk-coverage',
      severity: 'critical',
      category: 'core-sdk',
      dimension: 'coverage',
      title: 'Core SDK Coverage Gap',
      description: 'Core SDK files lack pattern integration',
      affectedFiles: lowPatternCore.map(f => f.path),
      suggestedFix: 'Integrate En Pensent patterns into core modules',
      estimatedEffort: 'days',
    });
  }
  
  return issues;
}

/**
 * Find warnings that should be addressed
 */
export function findWarnings(
  signature: CodeFlowSignature,
  files: FileAnalysis[]
): HealthIssue[] {
  const warnings: HealthIssue[] = [];
  
  // High complexity files
  const highComplexity = files.filter(f => f.complexity === 'high');
  if (highComplexity.length > 5) {
    warnings.push({
      id: 'high-complexity',
      severity: 'high',
      category: 'utils-types',
      dimension: 'complexity',
      title: 'High Complexity Files',
      description: `${highComplexity.length} files have high complexity`,
      affectedFiles: highComplexity.slice(0, 5).map(f => f.path),
      suggestedFix: 'Consider refactoring to reduce complexity',
      estimatedEffort: 'days',
    });
  }
  
  // Low pattern density
  const lowPattern = files.filter(
    f => f.patternDensity < 0.3 && f.linesOfCode > 50
  );
  if (lowPattern.length > 10) {
    warnings.push({
      id: 'low-pattern-density',
      severity: 'medium',
      category: 'ui-components',
      dimension: 'coverage',
      title: 'Low Pattern Integration',
      description: `${lowPattern.length} files have low En Pensent integration`,
      affectedFiles: lowPattern.slice(0, 5).map(f => f.path),
      suggestedFix: 'Add pattern-based abstractions and SDK usage',
      estimatedEffort: 'weeks',
    });
  }
  
  return warnings;
}
