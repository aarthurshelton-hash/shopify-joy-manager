/**
 * Health Report Type Definitions
 * 
 * Types for codebase health analysis and reporting.
 */

import { CodeArchetype } from './archetypeTypes';
import { CodeExchangeValue } from './exchangeValue';
import { CodeCategory, CodeDimension } from './types';

/**
 * Complete health report for a codebase
 */
export interface CodeHealthReport {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  archetype: CodeArchetype;
  archetypeConfidence: number;
  exchangeValue: CodeExchangeValue;
  criticalIssues: HealthIssue[];
  warnings: HealthIssue[];
  strengths: HealthStrength[];
  recommendations: HealthRecommendation[];
  dimensionHealth: Record<CodeDimension, DimensionHealth>;
  categoryHealth: Record<CodeCategory, CategoryHealth>;
  generatedAt: number;
}

export interface HealthIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: CodeCategory;
  dimension: CodeDimension;
  title: string;
  description: string;
  affectedFiles: string[];
  suggestedFix: string;
  estimatedEffort: 'hours' | 'days' | 'weeks';
}

export interface HealthStrength {
  category: CodeCategory;
  dimension: CodeDimension;
  title: string;
  description: string;
  score: number;
}

export interface HealthRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  relatedArchetypeEvolution: CodeArchetype | null;
}

export interface DimensionHealth {
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  issues: number;
  topConcern: string | null;
}

export interface CategoryHealth {
  score: number;
  fileCount: number;
  avgComplexity: string;
  patternDensity: number;
  topIssue: string | null;
}
