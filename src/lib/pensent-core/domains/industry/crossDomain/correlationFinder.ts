/**
 * Correlation Finder
 * Finds matching archetypes across domains
 */

import type { TemporalSignature } from '../../../types/core';
import type { IndustryVertical, CrossIndustryCorrelation } from '../types';
import { CROSS_DOMAIN_MAPPINGS } from './archetypeMappings';
import { generateCrossDomainInsight } from './insightGenerator';

/**
 * Find matching archetypes across domains for a given signature
 */
export function findCrossDomainMatches(
  signature: TemporalSignature,
  sourceDomain: IndustryVertical | 'chess'
): CrossIndustryCorrelation[] {
  const correlations: CrossIndustryCorrelation[] = [];
  const sourceArchetype = signature.archetype.toLowerCase().replace(/\s+/g, '_');
  
  // If source is chess, find industry matches
  if (sourceDomain === 'chess') {
    const mapping = CROSS_DOMAIN_MAPPINGS.find(
      m => m.chessArchetype === sourceArchetype || 
           m.chessArchetype.includes(sourceArchetype.split('_')[0])
    );
    
    if (mapping) {
      for (const industryMatch of mapping.industryMappings) {
        correlations.push({
          sourceIndustry: 'chess' as IndustryVertical,
          sourceArchetype: mapping.chessArchetype,
          targetIndustry: industryMatch.industry,
          targetArchetype: industryMatch.archetype,
          correlationStrength: industryMatch.correlationStrength,
          discoveredAt: new Date(),
          sampleSize: 1000,
          description: industryMatch.rationale,
          actionableInsight: generateCrossDomainInsight(sourceDomain, industryMatch.industry, mapping.chessArchetype)
        });
      }
    }
  } else {
    // Source is industry, find chess and other industry matches
    for (const mapping of CROSS_DOMAIN_MAPPINGS) {
      const industryMatch = mapping.industryMappings.find(
        m => m.industry === sourceDomain && 
             m.archetype.toLowerCase().includes(sourceArchetype)
      );
      
      if (industryMatch) {
        // Add chess correlation
        correlations.push({
          sourceIndustry: sourceDomain,
          sourceArchetype: industryMatch.archetype,
          targetIndustry: 'chess' as IndustryVertical,
          targetArchetype: mapping.chessArchetype,
          correlationStrength: industryMatch.correlationStrength,
          discoveredAt: new Date(),
          sampleSize: 1000,
          description: `Inverse: ${industryMatch.rationale}`,
          actionableInsight: generateCrossDomainInsight(sourceDomain, 'chess', mapping.chessArchetype)
        });
        
        // Add other industry correlations
        for (const otherIndustry of mapping.industryMappings) {
          if (otherIndustry.industry !== sourceDomain) {
            correlations.push({
              sourceIndustry: sourceDomain,
              sourceArchetype: industryMatch.archetype,
              targetIndustry: otherIndustry.industry,
              targetArchetype: otherIndustry.archetype,
              correlationStrength: industryMatch.correlationStrength * otherIndustry.correlationStrength,
              discoveredAt: new Date(),
              sampleSize: 500,
              description: `Via chess pattern: ${mapping.chessArchetype}`,
              actionableInsight: generateCrossDomainInsight(sourceDomain, otherIndustry.industry, otherIndustry.archetype)
            });
          }
        }
      }
    }
  }
  
  return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);
}

/**
 * Get all known cross-domain correlations for a specific industry
 */
export function getIndustryCorrelations(industry: IndustryVertical): CrossIndustryCorrelation[] {
  const correlations: CrossIndustryCorrelation[] = [];
  
  for (const mapping of CROSS_DOMAIN_MAPPINGS) {
    const industryMatch = mapping.industryMappings.find(m => m.industry === industry);
    if (industryMatch) {
      correlations.push({
        sourceIndustry: industry,
        sourceArchetype: industryMatch.archetype,
        targetIndustry: 'chess' as IndustryVertical,
        targetArchetype: mapping.chessArchetype,
        correlationStrength: industryMatch.correlationStrength,
        discoveredAt: new Date(),
        sampleSize: 1000,
        description: industryMatch.rationale,
        actionableInsight: generateCrossDomainInsight(industry, 'chess', mapping.chessArchetype)
      });
    }
  }
  
  return correlations;
}
