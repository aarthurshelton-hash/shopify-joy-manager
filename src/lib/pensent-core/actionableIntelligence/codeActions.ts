/**
 * Code Domain Actionable Maps
 * Code archetype → specific development actions
 */

import type { ActionMapEntry } from './types';

export const CODE_ACTIONABLE_MAP: Record<string, ActionMapEntry> = {
  core_fortress: {
    action: 'Expand successful patterns to edge modules. Document core abstractions for team adoption.',
    expectedOutcome: 'Consistent architecture across codebase',
    priority: 'This sprint',
  },
  rapid_expansion: {
    action: 'STOP adding features. Schedule a 2-day refactoring sprint. Add linting and quality gates.',
    expectedOutcome: 'Reduced tech debt, sustainable velocity',
    priority: 'Immediate',
  },
  pattern_master: {
    action: 'Create internal pattern library. Consider open-sourcing generic utilities.',
    expectedOutcome: 'Reusable assets, industry recognition',
    priority: 'This quarter',
  },
  monolith_giant: {
    action: 'Identify 3 modules with clearest boundaries. Create strangler fig pattern for gradual extraction.',
    expectedOutcome: 'Modular architecture, reduced coupling',
    priority: 'Immediate',
  },
  technical_debt: {
    action: 'Run static analysis. Fix ALL critical issues before any new feature work.',
    expectedOutcome: 'Stability and developer confidence',
    priority: 'Blocker - do first',
  },
  emerging_startup: {
    action: 'Establish coding conventions NOW. Create architecture decision records for key choices.',
    expectedOutcome: 'Scalable foundation as team grows',
    priority: 'This week',
  },
};
