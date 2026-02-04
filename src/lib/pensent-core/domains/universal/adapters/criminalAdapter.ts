/**
 * Criminal Adapter - Crime Patterns & Rehabilitation Dynamics
 * 
 * Offense cycles, recidivism patterns, policing strategies,
 * criminal justice reform, and rehabilitation trajectories.
 * 
 * For Alec Arthur Shelton - The Artist
 * Justice is the pattern of harm recognition and healing.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// CRIME TYPES & PATTERNS
const CRIME_PATTERNS = {
  violent: {
    types: ['Homicide', 'Assault', 'Robbery', 'Sexual assault'],
    trends: 'Generally declining since 1990s',
    seasonality: 'Higher in summer months',
    geography: 'Concentrated in specific areas'
  },
  
  property: {
    types: ['Burglary', 'Larceny', 'Motor vehicle theft', 'Arson'],
    trends: 'Declining with technology (alarms, cameras)',
    cycles: 'Economic correlation'
  },
  
  whiteCollar: {
    types: ['Fraud', 'Embezzlement', 'Insider trading', 'Cybercrime'],
    detection: 'Low, prosecution difficult',
    harm: 'Often exceeds street crime in dollar terms'
  },
  
  organized: {
    structure: 'Hierarchical, network-based',
    activities: ['Drugs', 'Trafficking', 'Racketeering', 'Money laundering'],
    evolution: 'Adapts to law enforcement pressure'
  }
};

// CRIMINOLOGICAL THEORIES
const CRIMINOLOGY_THEORIES = {
  rationalChoice: {
    premise: 'Crime as cost-benefit decision',
    factors: ['Expected punishment', 'Opportunity', 'Rewards'],
    policy: 'Increase certainty and severity of sanctions'
  },
  
  socialDisorganization: {
    premise: 'Community breakdown enables crime',
    factors: ['Poverty', 'Residential turnover', 'Ethnic heterogeneity'],
    policy: 'Community building, social cohesion'
  },
  
  strainTheory: {
    premise: 'Gap between goals and means creates pressure',
    types: ['Conformity', 'Innovation (crime)', 'Ritualism', 'Retreatism', 'Rebellion'],
    policy: 'Legitimate opportunity expansion'
  },
  
  learningTheory: {
    premise: 'Crime learned through social interaction',
    mechanisms: ['Differential association', 'Imitation', 'Reinforcement'],
    policy: 'Disrupt criminal networks, pro-social alternatives'
  },
  
  controlTheory: {
    premise: 'Social bonds prevent crime',
    elements: ['Attachment', 'Commitment', 'Involvement', 'Belief'],
    policy: 'Strengthen institutions (family, school, religion)'
  },
  
  labelingTheory: {
    premise: 'Official processing increases deviance',
    effect: 'Secondary deviance, stigma, exclusion',
    policy: 'Diversion, restorative justice, decriminalization'
  }
};

// POLICING STRATEGIES
const POLICING_PATTERNS = {
  reactive: {
    approach: 'Respond to calls',
    effectiveness: 'Limited deterrent effect',
    criticism: 'Arrives after harm'
  },
  
  preventive: {
    approach: 'Proactive presence',
    types: ['Hot spots policing', 'Broken windows', 'Stop and frisk'],
    controversy: 'Effectiveness vs civil liberties, disparate impact'
  },
  
  community: {
    approach: 'Partnership with residents',
    elements: ['Foot patrol', 'Problem solving', 'Trust building'],
    evidence: 'Promising for legitimacy, mixed on crime reduction'
  },
  
  intelligenceLed: {
    approach: 'Data-driven targeting',
    tools: ['CompStat', 'Predictive policing', 'Risk terrain modeling'],
    risks: 'Feedback loops, over-policing'
  },
  
  proceduralJustice: {
    approach: 'Focus on fair process',
    elements: ['Voice', 'Neutrality', 'Respect', 'Trustworthy motives'],
    goal: 'Increase compliance, cooperation'
  }
};

// PUNISHMENT & REHABILITATION
const CORRECTIONS_PATTERNS = {
  incarceration: {
    trends: 'US rate peaked 2008, declining slowly',
    disparities: 'Racial, economic, geographic',
    effects: ['Incapacitation', 'Deterrence (weak)', 'Rehabilitation (poor)', 'Collateral consequences']
  },
  
  probationParole: {
    scale: 'Larger population than prison',
    violation: 'Leading cause of incarceration',
    reform: 'Risk-need-responsivity model'
  },
  
  rehabilitation: {
    whatWorks: ['Cognitive behavioral therapy', 'Education', 'Employment', 'Substance treatment'],
    riskPrinciple: 'Intensive treatment for high-risk',
    needPrinciple: 'Target criminogenic needs'
  },
  
  restorativeJustice: {
    process: 'Victim-offender-community dialogue',
    outcomes: ['Victim satisfaction', 'Reduced recidivism', 'Cost savings'],
    scope: 'Appropriate for less serious offenses'
  },
  
  decriminalization: {
    approaches: ['Legalization', 'Civil fines', 'Diversion'],
    examples: ['Drug policy reform', 'Sex work', 'Homelessness'],
    debate: 'Public health vs moral order'
  }
};

// RECIDIVIS
const RECIDIVISM_PATTERNS = {
  rates: {
    us: '~70% within 5 years',
    variation: 'By offense type, age, programming',
    trajectory: 'Highest immediately post-release, declining over time'
  },
  
  riskFactors: {
    static: ['Prior record', 'Age at first arrest', 'History of violence'],
    dynamic: ['Substance use', 'Employment', 'Housing', 'Peer associations']
  },
  
  protectiveFactors: {
    social: 'Stable family, prosocial peers',
    practical: 'Employment, housing, education',
    personal: 'Self-efficacy, motivation to change'
  }
};

interface CriminalEvent {
  timestamp: number;
  offenseSeverity: number; // 1-10
  recidivismRisk: number; // 0-1
  rehabilitationProgress: number; // 0-1
  socialSupportLevel: number; // 0-1
  employmentStatus: number; // 0-1
  substanceUse: number; // 0-1 severity
  housingStability: number; // 0-1
  treatmentEngagement: number; // 0-1
  daysSinceRelease: number;
}

class CriminalAdapter implements DomainAdapter<CriminalEvent> {
  domain = 'security' as const;
  name = 'Criminal Justice & Rehabilitation';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 3000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[CriminalAdapter] Initialized - Justice patterns active');
  }
  
  processRawData(event: CriminalEvent): UniversalSignal {
    const { timestamp, offenseSeverity, recidivismRisk, rehabilitationProgress, socialSupportLevel, daysSinceRelease } = event;
    
    // Frequency encodes time since release (higher = more stable)
    const frequency = Math.min(daysSinceRelease / 365, 1);
    
    // Intensity = criminal justice stress
    const intensity = recidivismRisk * (1 - rehabilitationProgress) * offenseSeverity / 10;
    
    // Phase encodes support-rehabilitation alignment
    const phase = (socialSupportLevel + rehabilitationProgress) / 2 * Math.PI;
    
    const harmonics = [
      offenseSeverity / 10,
      recidivismRisk,
      rehabilitationProgress,
      socialSupportLevel,
      event.employmentStatus,
      1 - event.substanceUse
    ];
    
    const signal: UniversalSignal = {
      domain: 'security',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [offenseSeverity, recidivismRisk, rehabilitationProgress, socialSupportLevel, daysSinceRelease]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.lastUpdate = timestamp;
    return signal;
  }
  
  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }
    
    const recent = signals.slice(-150);
    
    const avgSeverity = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgRecidivism = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgRehab = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgSupport = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgDays = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgSeverity > 7 ? 0.8 : 0.2,
      defensive: avgRecidivism > 0.6 ? 0.7 : 0.2,
      tactical: avgSupport < 0.3 ? 0.6 : 0.3,
      strategic: avgRehab > 0.6 ? 0.8 : 0.2
    };
    
    const temporalFlow = {
      early: avgDays < 90 ? 0.9 : 0.2,
      mid: avgDays >= 90 && avgDays < 365 ? 0.7 : 0.2,
      late: avgDays >= 365 ? 0.7 : 0.3
    };
    
    return {
      domain: 'security',
      quadrantProfile,
      temporalFlow,
      intensity: avgRecidivism * (1 - avgRehab),
      momentum: avgRehab > avgRecidivism ? 1 : -1,
      volatility: avgRecidivism,
      dominantFrequency: Math.min(avgDays / 365, 1),
      harmonicResonance: avgSupport,
      phaseAlignment: avgRehab,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'security',
      quadrantProfile: { aggressive: 0.3, defensive: 0.4, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.8, mid: 0.15, late: 0.05 },
      intensity: 0.5,
      momentum: 1,
      volatility: 0.6,
      dominantFrequency: 0.2,
      harmonicResonance: 0.4,
      phaseAlignment: 0.3,
      extractedAt: Date.now()
    };
  }
  
  // Calculate recidivism risk score
  calculateRecidivismRisk(
    priorArrests: number,
    ageAtRelease: number,
    employmentHistory: number,
    substanceUseSeverity: number
  ): number {
    // Simplified risk model
    const ageFactor = Math.max(0, (30 - ageAtRelease) / 30);
    const priorFactor = Math.min(priorArrests / 5, 1);
    const employmentFactor = 1 - employmentHistory;
    const substanceFactor = substanceUseSeverity;
    
    return (ageFactor * 0.2 + priorFactor * 0.3 + employmentFactor * 0.2 + substanceFactor * 0.3);
  }
}

export const criminalAdapter = new CriminalAdapter();
export { CRIME_PATTERNS, CRIMINOLOGY_THEORIES, POLICING_PATTERNS, CORRECTIONS_PATTERNS, RECIDIVISM_PATTERNS };
export type { CriminalEvent };
