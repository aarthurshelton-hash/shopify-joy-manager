/**
 * Cybersecurity & Threat Pattern Recognition Adapter
 * 
 * Archetypal attack patterns as temporal sequences.
 * Phishing, malware, intrusion, social engineering -
 * all follow predictable temporal signatures before execution.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHETYPAL ATTACK PATTERNS (Real MITRE ATT&CK Framework + Temporal Analysis)
// ═══════════════════════════════════════════════════════════════════════════════

const ATTACK_ARCHETYPES = {
  // Reconnaissance Phase
  reconnaissance: {
    name: 'Initial Access Preparation',
    temporalPattern: 'slow_burn_information_gathering',
    indicators: [
      'port_scanning',
      'social_media_profiling', 
      'whois_lookup_patterns',
      'dns_enumeration_spikes',
      'credential_stuffing_prep'
    ],
    duration: 'days_to_weeks',
    marketAnalogy: 'Due diligence before acquisition, information asymmetry exploitation'
  },
  
  // Phishing Archetypes
  phishing: {
    spear: {
      name: 'Targeted Deception',
      temporalPattern: 'personalized_contact_buildup',
      stages: [
        'research_target',           // OSINT gathering
        'craft_persona',             // Identity construction  
        'establish_rapport',         // Trust building over time
        'urgency_injection',         // Time pressure creation
        'credential_harvest'         // Payload delivery
      ],
      detectionWindow: 'stage_3_4_boundary',
      marketAnalogy: 'Pump and dump: Build confidence, create urgency, exit'
    },
    
    whaling: {
      name: 'Executive Targeting',
      temporalPattern: 'authority_exploitation',
      keyIndicator: 'C_level_impersonation_timing',
      marketAnalogy: 'Insider trading mimicry'
    },
    
    vishing: {
      name: 'Voice Channel Exploitation',
      temporalPattern: 'real_time_pressure_application',
      marketAnalogy: 'Cold call high-pressure sales'
    }
  },
  
  // Malware Deployment Patterns  
  malware: {
    droppers: {
      name: 'Staged Delivery',
      temporalPattern: 'multi_stage_payload_assembly',
      stages: ['initial_contact', 'dropper_download', 'c2_establishment', 'payload_retrieval', 'execution'],
      detectionOpportunity: 'stage_2_to_3_transition'
    },
    
    ransomware: {
      name: 'Encryption Extortion',
      temporalPattern: 'lateral_movement_then_sudden_encryption',
      phases: [
        'initial_compromise',        // Hours
        'persistence_establishment', // Days
        'reconnaissance_internal',   // Days
        'lateral_movement',          // Days to weeks
        'backup_destruction',        // Hours
        'mass_encryption'            // Minutes
      ],
      criticalMoment: 'backup_destruction_detection',
      marketAnalogy: 'Short squeeze: Position building, then sudden move'
    },
    
    apt: {
      name: 'Advanced Persistent Threat',
      temporalPattern: 'long_term_dwell_with_sporadic_activity',
      dwellTime: 'months_to_years',
      activityBursts: 'targeted_data_exfiltration_events',
      marketAnalogy: 'Long-term insider accumulation, periodic profit taking'
    }
  },
  
  // Social Engineering
  socialEngineering: {
    pretexting: {
      name: 'Fabricated Scenario',
      temporalPattern: 'narrative_construction_over_time',
      credibilityBuilding: ' Gradual authority establishment',
      marketAnalogy: 'Fraudulent investment narrative building'
    },
    
    baiting: {
      name: 'Curiosity Exploitation',
      temporalPattern: 'immediate_gratification_trigger',
      marketAnalogy: 'FOMO trading, get rich quick schemes'
    },
    
    quidProQuo: {
      name: 'Service Exchange Deception',
      temporalPattern: 'helpful_service_then_exploit',
      marketAnalogy: 'Free trial to subscription lock-in'
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// KILL CHAIN TEMPORAL ANALYSIS (Real Cyber Kill Chain Framework)
// ═══════════════════════════════════════════════════════════════════════════════

const KILL_CHAIN_PHASES = [
  { phase: 'reconnaissance', duration: 'weeks', detectability: 0.3, criticality: 0.2 },
  { phase: 'weaponization', duration: 'days', detectability: 0.1, criticality: 0.4 },
  { phase: 'delivery', duration: 'hours', detectability: 0.6, criticality: 0.6 },
  { phase: 'exploitation', duration: 'minutes', detectability: 0.4, criticality: 0.8 },
  { phase: 'installation', duration: 'minutes', detectability: 0.5, criticality: 0.9 },
  { phase: 'c2_communication', duration: 'ongoing', detectability: 0.7, criticality: 0.9 },
  { phase: 'actions_on_objectives', duration: 'variable', detectability: 0.8, criticality: 1.0 }
];

// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIORAL BIOMETRICS (Real Technology)
// ═══════════════════════════════════════════════════════════════════════════════

const BEHAVIORAL_BIOMETRICS = {
  keystrokeDynamics: {
    description: 'Typing rhythm analysis',
    temporalFeatures: ['dwell_time', 'flight_time', 'typing_speed_variance'],
    anomalyIndicators: ['stress_typing', 'automation_signatures', 'distraction_patterns']
  },
  
  mouseDynamics: {
    description: 'Cursor movement patterns',
    temporalFeatures: ['movement_velocity', 'curvature_patterns', 'click_timing'],
    anomalyIndicators: ['robotic_precision', 'hesitation_patterns', 'unusual_paths']
  },
  
  navigationPatterns: {
    description: 'User journey analysis',
    temporalFeatures: ['page_sequence', 'time_on_page', 'interaction_depth'],
    anomalyIndicators: ['credential_focused_path', 'unusual_knowledge', 'bypass_attempts']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTION TEMPORAL SIGNATURES
// ═══════════════════════════════════════════════════════════════════════════════

const ANOMALY_SIGNATURES = {
  timeBased: {
    afterHoursAccess: { risk: 0.7, pattern: 'off_hours_admin_activity' },
    weekendActivity: { risk: 0.6, pattern: 'weekend_system_changes' },
    holidayAccess: { risk: 0.8, pattern: 'holiday_sensitive_data_access' },
    impossibleTravel: { risk: 0.9, pattern: 'geographic_impossibility' }
  },
  
  volumeBased: {
    dataExfiltration: { 
      pattern: 'sustained_high_volume_outbound',
      temporalShape: 'gradual_ramp_or_sudden_spike',
      threshold: '3_sigma_above_baseline'
    },
    credentialSpraying: {
      pattern: 'rapid_authentication_attempts',
      temporalShape: 'burst_pattern',
      threshold: '10_attempts_per_minute'
    }
  },
  
  sequenceBased: {
    privilegeEscalation: {
      pattern: 'normal_user_to_admin_in_session',
      temporalWindow: 'single_session',
      criticality: 0.95
    },
    lateralMovement: {
      pattern: 'sequential_host_access',
      temporalShape: 'systematic_progression',
      criticality: 0.9
    }
  }
};

interface SecurityEvent {
  timestamp: number;
  eventType: keyof typeof ATTACK_ARCHETYPES | string;
  severity: number; // 0-10
  sourceIP?: string;
  userAgent?: string;
  behavioralBiometrics?: {
    keystrokeVariance: number;
    mouseEntropy: number;
    navigationAnomaly: number;
  };
  killChainPhase?: number; // 0-6 index
  dataVolume?: number;
  geographicLocation?: { lat: number; lon: number };
}

class CybersecurityAdapter implements DomainAdapter<SecurityEvent> {
  domain = 'security' as const;
  name = 'Cybersecurity & Threat Pattern Recognition';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private threatScore: number = 0;
  private readonly BUFFER_SIZE = 10000; // Security needs large buffers
  
  // Active threat tracking
  private activeThreats: Map<string, {
    firstSeen: number;
    lastSeen: number;
    eventCount: number;
    killChainProgression: number;
    severityAccumulated: number;
  }> = new Map();
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[CybersecurityAdapter] Initialized - Threat detection active');
  }
  
  processRawData(event: SecurityEvent): UniversalSignal {
    const { timestamp, eventType, severity, killChainPhase, behavioralBiometrics } = event;
    
    // Calculate threat frequency (higher frequency = higher threat)
    const frequency = this.calculateThreatFrequency(event);
    
    // Intensity based on severity and kill chain progression
    const killChainWeight = killChainPhase !== undefined 
      ? KILL_CHAIN_PHASES[killChainPhase]?.criticality || 0.5
      : 0.5;
    
    const intensity = (severity / 10) * killChainWeight;
    
    // Phase encodes behavioral anomaly if present
    let phase = 0;
    if (behavioralBiometrics) {
      phase = (behavioralBiometrics.keystrokeVariance + 
               behavioralBiometrics.mouseEntropy + 
               behavioralBiometrics.navigationAnomaly) / 3 * Math.PI;
    }
    
    // Harmonics encode different threat dimensions
    const harmonics = [
      severity / 10,
      killChainWeight,
      behavioralBiometrics?.keystrokeVariance || 0.5,
      behavioralBiometrics?.mouseEntropy || 0.5,
      this.isBusinessHours(timestamp) ? 0.3 : 0.8, // After hours = higher risk
      this.isGeographicallyAnomalous(event) ? 0.9 : 0.1
    ];
    
    const signal: UniversalSignal = {
      domain: 'security',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [severity, killChainWeight, frequency, this.threatScore]
    };
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.updateThreatTracking(event);
    this.lastUpdate = timestamp;
    return signal;
  }
  
  extractSignature(signals: UniversalSignal[]): DomainSignature {
    if (signals.length === 0) {
      return this.getDefaultSignature();
    }
    
    const recent = signals.slice(-1000); // Security looks at more history
    
    // Calculate threat profile
    const avgSeverity = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgKillChain = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgFrequency = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const currentThreatScore = recent[recent.length - 1]?.rawData[3] || 0;
    
    // Quadrant profile maps to security posture
    const quadrantProfile = {
      aggressive: avgSeverity * avgKillChain, // High severity, advanced kill chain
      defensive: (1 - avgSeverity) * (1 - avgKillChain), // Low threat detected
      tactical: avgFrequency * (1 - avgKillChain), // High activity, early stage
      strategic: currentThreatScore // Overall threat intelligence
    };
    
    // Temporal flow = kill chain progression
    const temporalFlow = {
      early: 1 - avgKillChain, // Recon/weaponization
      mid: avgKillChain < 0.7 ? 0.5 : 0.2, // Delivery/exploitation
      late: avgKillChain > 0.7 ? avgKillChain : 0.1 // C2/actions on objectives
    };
    
    return {
      domain: 'security',
      quadrantProfile,
      temporalFlow,
      intensity: avgSeverity * avgKillChain,
      momentum: avgFrequency > 0.5 ? 1 : -1, // Accelerating or decelerating threats
      volatility: avgFrequency,
      dominantFrequency: avgFrequency,
      harmonicResonance: 1 - avgKillChain, // Lower = more advanced threat
      phaseAlignment: currentThreatScore,
      extractedAt: Date.now()
    };
  }
  
  private calculateThreatFrequency(event: SecurityEvent): number {
    const key = `${event.sourceIP}_${event.eventType}`;
    const existing = this.activeThreats.get(key);
    
    if (!existing) return 0.1;
    
    const timeWindow = (event.timestamp - existing.firstSeen) / 1000; // seconds
    const frequency = existing.eventCount / (timeWindow + 1);
    
    // Normalize to 0-1 range (assuming > 1 event/sec is max frequency)
    return Math.min(frequency, 1);
  }
  
  private updateThreatTracking(event: SecurityEvent): void {
    const key = `${event.sourceIP}_${event.eventType}`;
    const existing = this.activeThreats.get(key);
    
    if (existing) {
      existing.lastSeen = event.timestamp;
      existing.eventCount++;
      existing.severityAccumulated += event.severity;
      if (event.killChainPhase !== undefined) {
        existing.killChainProgression = Math.max(
          existing.killChainProgression, 
          event.killChainPhase
        );
      }
    } else {
      this.activeThreats.set(key, {
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        eventCount: 1,
        killChainProgression: event.killChainPhase || 0,
        severityAccumulated: event.severity
      });
    }
    
    // Calculate overall threat score
    this.threatScore = this.calculateOverallThreatScore();
  }
  
  private calculateOverallThreatScore(): number {
    let score = 0;
    this.activeThreats.forEach(threat => {
      const recency = (Date.now() - threat.lastSeen) / (1000 * 60 * 60); // hours ago
      if (recency < 24) { // Only count recent threats
        score += (threat.severityAccumulated / threat.eventCount) * 
                 (threat.killChainProgression / 6) * 
                 Math.exp(-recency / 24);
      }
    });
    return Math.min(score / 100, 1); // Normalize
  }
  
  private isBusinessHours(timestamp: number): boolean {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    
    // Business hours: Monday-Friday, 9am-5pm
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  }
  
  private isGeographicallyAnomalous(event: SecurityEvent): boolean {
    // Simplified - would need user baseline in real implementation
    return false;
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'security',
      quadrantProfile: { aggressive: 0.1, defensive: 0.7, tactical: 0.1, strategic: 0.1 },
      temporalFlow: { early: 0.5, mid: 0.3, late: 0.2 },
      intensity: 0.1,
      momentum: 0,
      volatility: 0.2,
      dominantFrequency: 0.1,
      harmonicResonance: 0.8,
      phaseAlignment: 0.1,
      extractedAt: Date.now()
    };
  }
  
  // Detect attack archetype from event pattern
  detectArchetype(events: SecurityEvent[]): keyof typeof ATTACK_ARCHETYPES | 'unknown' {
    if (events.length < 3) return 'unknown';
    
    const patterns = {
      phishing: events.filter(e => 
        e.eventType.toLowerCase().includes('email') || 
        e.eventType.toLowerCase().includes('credential')
      ).length,
      malware: events.filter(e => 
        e.eventType.toLowerCase().includes('malware') ||
        e.eventType.toLowerCase().includes('execution')
      ).length,
      apt: events.filter(e => 
        (e.killChainPhase || 0) > 4 && events.length > 10
      ).length
    };
    
    const maxPattern = Object.entries(patterns).sort((a, b) => b[1] - a[1])[0];
    return maxPattern[1] > 2 ? maxPattern[0] as keyof typeof ATTACK_ARCHETYPES : 'unknown';
  }
  
  // Generate security event from market conditions
  generateMarketCorrelatedData(marketVolatility: number, sentiment: number): SecurityEvent {
    // High volatility markets correlate with heightened cyber activity
    const severity = marketVolatility * 10;
    const killChainPhase = marketVolatility > 0.7 ? 5 : marketVolatility > 0.4 ? 3 : 1;
    
    return {
      timestamp: Date.now(),
      eventType: marketVolatility > 0.8 ? 'ransomware_detection' : 'anomalous_access',
      severity,
      killChainPhase,
      behavioralBiometrics: {
        keystrokeVariance: sentiment > 0 ? 0.3 : 0.7, // Negative sentiment = stress
        mouseEntropy: marketVolatility,
        navigationAnomaly: marketVolatility * 0.8
      }
    };
  }
}

export const cybersecurityAdapter = new CybersecurityAdapter();
export { ATTACK_ARCHETYPES, KILL_CHAIN_PHASES, BEHAVIORAL_BIOMETRICS, ANOMALY_SIGNATURES };
export type { SecurityEvent };
