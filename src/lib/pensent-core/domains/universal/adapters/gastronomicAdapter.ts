/**
 * Gastronomic Adapter - Food Culture & Culinary Evolution
 * 
 * Flavor trends, ingredient diffusion, restaurant cycles,
 * cooking techniques, and food as cultural expression.
 * 
 * For Alec Arthur Shelton - The Artist
 * Cuisine is edible art, flavor is the palette of culture.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// CULINARY TRADITIONS
const CULINARY_TRADITIONS = {
  french: {
    principles: ['Mise en place', 'Mother sauces', 'Classical techniques'],
    influence: 'Foundation of Western culinary education',
    evolution: 'Nouvelle cuisine, molecular gastronomy'
  },
  
  chinese: {
    regions: ['Cantonese', 'Sichuan', 'Shandong', 'Huaiyang'],
    principles: ['Yin-yang balance', 'Five flavors', 'Texture contrast'],
    techniques: ['Wok hei', 'Red cooking', 'Steaming']
  },
  
  japanese: {
    principles: ['Kaiseki', 'Umami focus', 'Seasonality', 'Minimalism'],
    aesthetics: ['Wabi-sabi', 'Kanso', 'Shibui'],
    evolution: 'Fusion, kaiseki international'
  },
  
  indian: {
    principles: ['Ayurvedic balance', 'Spice complexity', 'Regional diversity'],
    techniques: ['Tandoor', 'Tadka', 'Dum'],
    spread: 'Diaspora cuisine adaptation'
  },
  
  mediterranean: {
    principles: ['Olive oil', 'Fresh vegetables', 'Seafood', 'Simplicity'],
    health: 'Blue zones, longevity research',
    fusion: 'California-Mediterranean'
  }
};

// FOOD TREND CYCLES
const FOOD_TRENDS = {
  ingredientDriven: {
    examples: ['Bacon everything (2000s)', 'Avocado toast (2010s)', 'Pumpkin spice'],
    lifecycle: 'Discovery → Saturation → Parody → Decline',
    driver: 'Social media, novelty seeking'
  },
  
  techniqueDriven: {
    examples: ['Sous vide', 'Fermentation', 'Nose-to-tail', 'Molecular gastronomy'],
    adoption: 'High-end → Professional → Home → Mass market',
    duration: 'Longer lasting than ingredient trends'
  },
  
  healthDriven: {
    waves: ['Low-fat (90s)', 'Low-carb (2000s)', 'Paleo/Keto (2010s)', 'Plant-based (2020s)'],
    science: 'Often ahead of or behind actual research',
    backlash: 'Indulgence trends follow restriction'
  },
  
  sustainability: {
    focus: ['Local sourcing', 'Seasonal eating', 'Reducing waste', 'Regenerative agriculture'],
    tension: 'Cost, convenience, taste vs ethics'
  }
};

// RESTAURANT DYNAMICS
const RESTAURANT_PATTERNS = {
  lifecycle: {
    opening: 'Hype, curiosity, initial quality',
    establishment: 'Finding rhythm, regulars',
    maturity: 'Consistency, optimization',
    decline: 'Complacency, staff turnover, changing neighborhood'
  },
  
  categories: {
    fineDining: 'Experience focus, high margin, innovation',
    casual: 'Volume, consistency, value',
    fastCasual: 'Quality + speed, Chipotle model',
    fastFood: 'Efficiency, scale, brand'
  },
  
  economics: {
    margins: '3-5% average, highly variable',
    costs: ['Labor', 'Rent', 'Food', 'Utilities'],
    failure: '60% fail within first year'
  }
};

// FLAVOR SCIENCE
const FLAVOR_PATTERNS = {
  fiveTastes: {
    sweet: 'Energy, pleasure',
    salty: 'Electrolytes, enhances flavor',
    sour: 'Vitamin C, preservation',
    bitter: 'Toxins warning, complexity',
    umami: 'Protein indicator, depth'
  },
  
  aromatic: {
    importance: '80% of flavor is smell',
    categories: ['Floral', 'Fruity', 'Spicy', 'Earthy', 'Herbaceous'],
    pairing: 'Complementary vs contrasting'
  },
  
  mouthfeel: {
    elements: ['Texture', 'Temperature', 'Chemesthetic (spicy, cooling)', 'Astringency'],
    fat: 'Carries flavor, creates richness'
  }
};

// FOOD DIFFUSION
const CUISINE_DIFFUSION = {
  waves: {
    first: 'Immigrant communities (authentic)',
    second: 'Adoption by mainstream (adapted)',
    third: 'Fusion, creole, hybrid',
    fourth: 'Re-appropriation, "authentic" revival'
  },
  
  examples: {
    italian: 'Pizza, pasta Americanization → artisanal return',
    mexican: 'Tex-Mex → regional Mexican → fusion',
    japanese: 'Sushi global spread → ramen → izakaya',
    korean: 'KBBQ → K-pop fuel → fine dining recognition'
  }
};

interface GastronomicEvent {
  timestamp: number;
  trendNovelty: number; // 0-1
  ingredientScarcity: number; // 0-1
  techniqueComplexity: number; // 0-10
  healthPerception: number; // 0-10
  instagrammability: number; // 0-10
  sustainabilityScore: number; // 0-10
  comfortVsAdventure: number; // 0=comfort, 1=adventure
  priceAccessibility: number; // 0-1
  culturalAuthenticity: number; // 0-1
}

class GastronomicAdapter implements DomainAdapter<GastronomicEvent> {
  domain = 'bio' as const;
  name = 'Gastronomic & Culinary Evolution';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 2000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[GastronomicAdapter] Initialized - Flavor patterns active');
  }
  
  processRawData(event: GastronomicEvent): UniversalSignal {
    const { timestamp, trendNovelty, techniqueComplexity, healthPerception, instagrammability, sustainabilityScore } = event;
    
    // Frequency encodes trend velocity
    const frequency = trendNovelty;
    
    // Intensity = culinary innovation energy
    const intensity = (techniqueComplexity / 10 + instagrammability / 10) / 2;
    
    // Phase encodes health-sustainability alignment
    const phase = (healthPerception / 10 + sustainabilityScore / 10) / 2 * Math.PI;
    
    const harmonics = [
      trendNovelty,
      techniqueComplexity / 10,
      healthPerception / 10,
      instagrammability / 10,
      sustainabilityScore / 10,
      event.comfortVsAdventure
    ];
    
    const signal: UniversalSignal = {
      domain: 'bio',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [trendNovelty, techniqueComplexity, healthPerception, instagrammability, sustainabilityScore]
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
    
    const recent = signals.slice(-100);
    
    const avgNovelty = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgComplexity = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgHealth = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgInsta = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgSustainability = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgNovelty > 0.7 ? 0.8 : 0.2,
      defensive: avgHealth > 7 ? 0.7 : 0.2,
      tactical: avgInsta > 7 ? 0.6 : 0.3,
      strategic: avgSustainability > 7 ? 0.7 : 0.3
    };
    
    const temporalFlow = {
      early: avgNovelty > 0.8 ? 0.8 : 0.2,
      mid: avgNovelty > 0.4 && avgNovelty <= 0.8 ? 0.7 : 0.2,
      late: avgNovelty <= 0.4 ? 0.8 : 0.2
    };
    
    return {
      domain: 'bio',
      quadrantProfile,
      temporalFlow,
      intensity: (avgComplexity + avgInsta) / 20,
      momentum: avgNovelty > 0.6 ? 1 : -1,
      volatility: avgNovelty,
      dominantFrequency: avgNovelty,
      harmonicResonance: avgHealth / 10,
      phaseAlignment: avgSustainability / 10,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'bio',
      quadrantProfile: { aggressive: 0.4, defensive: 0.3, tactical: 0.2, strategic: 0.1 },
      temporalFlow: { early: 0.5, mid: 0.3, late: 0.2 },
      intensity: 0.6,
      momentum: 1,
      volatility: 0.5,
      dominantFrequency: 0.7,
      harmonicResonance: 0.6,
      phaseAlignment: 0.5,
      extractedAt: Date.now()
    };
  }
}

export const gastronomicAdapter = new GastronomicAdapter();
export { CULINARY_TRADITIONS, FOOD_TRENDS, RESTAURANT_PATTERNS, FLAVOR_PATTERNS, CUISINE_DIFFUSION };
export type { GastronomicEvent };
