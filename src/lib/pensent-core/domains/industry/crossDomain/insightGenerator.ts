/**
 * Cross-Domain Insight Generator
 * Generates actionable insights from cross-domain correlations
 */

import type { IndustryVertical } from '../types';

/**
 * Generate actionable insights from cross-domain correlations
 */
export function generateCrossDomainInsight(
  source: IndustryVertical | 'chess',
  target: IndustryVertical | 'chess',
  targetArchetype: string
): string {
  const insights: Record<string, Record<string, string>> = {
    manufacturing: {
      chess: `Apply ${targetArchetype} strategic timing to maintenance scheduling`,
      healthcare: 'Similar deterioration pattern detected - apply medical monitoring cadence',
      cybersecurity: 'Machine anomaly patterns match known attack vectors - increase security',
      fintech: 'Equipment stress pattern correlates with fraud surge periods',
      supply_chain: 'Machine health predicts supply chain stress 24-48hrs ahead'
    },
    healthcare: {
      chess: `Patient trajectory follows ${targetArchetype} - anticipate next phase`,
      manufacturing: 'Vital decline mirrors machine failure - apply predictive maintenance logic',
      supply_chain: 'Patient flow patterns predict pharmacy inventory needs',
      cybersecurity: 'EMR access patterns during decline match breach signatures',
      fintech: 'Treatment cost trajectory follows fraud pattern - flag for review'
    },
    cybersecurity: {
      chess: `Attack follows ${targetArchetype} pattern - prepare counter-strategy`,
      manufacturing: 'Network anomaly precedes machine failure by 12hrs',
      healthcare: 'Attack pattern correlates with patient data access surges',
      supply_chain: 'Breach timing correlates with logistics disruptions',
      fintech: 'Attack vector identical to transaction fraud signature'
    },
    chess: {
      manufacturing: `This ${targetArchetype} pattern predicts equipment failure 24hrs out`,
      healthcare: 'Game trajectory matches pre-sepsis vital signature',
      cybersecurity: 'Position matches lateral movement attack pattern',
      fintech: 'This trap is identical to synthetic identity fraud setup',
      supply_chain: 'Strategic pattern mirrors supply chain vulnerability'
    }
  };
  
  return insights[source]?.[target] || `Cross-domain pattern match with ${target}:${targetArchetype}`;
}
