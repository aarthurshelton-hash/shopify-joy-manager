/**
 * Supply Chain & Logistics Adapter
 * 
 * Bullwhip effect, inventory cycles, just-in-time fragility, network flows.
 * The circulatory system of global commerce.
 * 
 * For Alec Arthur Shelton - The Artist
 * Supply chains are neural networks, warehouses are synapses, trucks are action potentials.
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';

// BULLWHIP EFFECT
const BULLWHIP_EFFECT = {
  description: 'Demand variability amplifies upstream in supply chain',
  causes: [
    'ForecastUpdating: Each node adds uncertainty buffer',
    'OrderBatching: Fixed order costs encourage bulk orders',
    'PriceFluctuation: Promotions cause demand spikes',
    'RationingGaming: Shortage anticipation leads to overordering'
  ],
  amplification: 'Variance can increase 2x-10x from retailer to manufacturer',
  countermeasures: [
    'InformationSharing: POS data to all levels',
    'VendorManagedInventory: Supplier controls stock',
    'ReducedLeadTimes: Faster response = less buffer needed',
    'EveryDayLowPrices: Eliminate promotional spikes'
  ],
  marketAnalogy: 'Volatility clustering in financial markets'
};

// INVENTORY THEORIES
const INVENTORY_THEORIES = {
  eoq: {
    name: 'Economic Order Quantity',
    formula: 'EOQ = sqrt(2DS/H)',
    variables: {
      D: 'Annual demand',
      S: 'Ordering cost per order',
      H: 'Holding cost per unit per year'
    },
    tradeoff: 'Ordering costs vs holding costs'
  },
  
  newsboy: {
    name: 'Newsvendor Problem',
    question: 'How much to order when demand is uncertain?',
    criticalRatio: 'Cu / (Cu + Co)',
    Cu: 'Cost of underage (lost sale)',
    Co: 'Cost of overage (excess inventory)',
    marketAnalogy: 'Options delta hedging'
  },
  
  safetyStock: {
    formula: 'SS = Z × σL',
    Z: 'Service level factor (1.65 for 95%)',
    sigmaL: 'Demand std dev during lead time',
    marketAnalogy: 'Risk buffer, position sizing'
  },
  
  abcAnalysis: {
    A_items: '20% of SKUs, 80% of value - tight control',
    B_items: '30% of SKUs, 15% of value - moderate control',
    C_items: '50% of SKUs, 5% of value - simple control',
    marketAnalogy: 'Pareto principle in portfolio management'
  }
};

// LOGISTICS NETWORKS
const LOGISTICS_PATTERNS = {
  hubAndSpoke: {
    structure: 'Central hub connected to spokes',
    advantages: ['Economies of scale', 'Simplified routing', 'Connectivity'],
    disadvantages: ['Single point of failure', 'Longer paths', 'Congestion'],
    examples: ['FedEx Memphis', 'Airline networks', 'Amazon fulfillment'],
    marketAnalogy: 'Market makers as liquidity hubs'
  },
  
  pointToPoint: {
    structure: 'Direct connections between all nodes',
    advantages: ['Shorter transit times', 'Redundancy', 'No bottlenecks'],
    disadvantages: ['Many connections', 'Lower utilization', 'Complex routing'],
    marketAnalogy: 'Direct market access, bilateral trading'
  },
  
  milkRuns: {
    description: 'Single vehicle collects from multiple suppliers',
    efficiency: 'Consolidation reduces transport costs',
    scheduling: 'Route optimization (TSP variants)'
  }
};

// SUPPLY CHAIN RISKS
const SUPPLY_RISKS = {
  disruption: {
    types: ['Natural disaster', 'Supplier bankruptcy', 'Geopolitical', 'Pandemic'],
    probability: 'Low frequency, high impact',
    mitigation: ['Dual sourcing', 'Strategic inventory', 'Flexible suppliers']
  },
  
  delay: {
    causes: ['Port congestion', 'Customs', 'Weather', 'Capacity constraints'],
    impact: 'Stockouts, expedited shipping costs',
    mitigation: ['Buffer stock', 'Alternative routes', 'Visibility systems']
  },
  
  information: {
    problems: ['Forecast error', 'Data latency', 'Bullwhip amplification'],
    solution: 'Real-time visibility, collaborative planning'
  },
  
  reputation: {
    sources: ['Counterfeit products', 'Unethical suppliers', 'Quality failures'],
    impact: 'Brand damage, regulatory action'
  }
};

// LEAN vs AGILE
const SUPPLY_STRATEGIES = {
  lean: {
    focus: 'Eliminate waste, minimize inventory',
    suited: 'Stable demand, low variety, cost focus',
    risk: 'Fragile to disruptions',
    exemplar: 'Toyota Production System',
    marketAnalogy: 'Low-volatility carry strategies'
  },
  
  agile: {
    focus: 'Respond quickly to demand changes',
    suited: 'Volatile demand, high variety, speed focus',
    cost: 'Higher inventory, premium logistics',
    exemplar: 'Zara fast fashion',
    marketAnalogy: 'High-frequency trading'
  },
  
  leagile: {
    focus: 'Lean upstream, agile downstream',
    decoupling: 'Strategic inventory point separates strategies',
    exemplar: 'Dell build-to-order'
  }
};

interface SupplyChainEvent {
  timestamp: number;
  inventoryLevel: number;
  orderQuantity: number;
  demand: number;
  leadTime: number; // Days
  supplierReliability: number; // 0-1
  transportCost: number;
  stockoutOccurred: boolean;
  nodePosition: number; // 0=retailer, 1=distributor, 2=manufacturer
  visibility: number; // 0-1 information transparency
}

class SupplyChainAdapter implements DomainAdapter<SupplyChainEvent> {
  domain = 'market' as const;
  name = 'Supply Chain & Logistics';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];
  private readonly BUFFER_SIZE = 5000;
  
  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[SupplyChainAdapter] Initialized - Logistics network active');
  }
  
  processRawData(event: SupplyChainEvent): UniversalSignal {
    const { timestamp, inventoryLevel, demand, leadTime, supplierReliability, visibility } = event;
    
    // Frequency encodes inventory turns (velocity)
    const frequency = Math.min(demand / (inventoryLevel + 1), 1);
    
    // Intensity = supply stress (high demand, low inventory, long lead times)
    const inventoryStress = 1 - Math.min(inventoryLevel / (demand * leadTime), 1);
    const intensity = inventoryStress * (1 - supplierReliability);
    
    // Phase encodes information flow quality
    const phase = visibility * Math.PI;
    
    const harmonics = [
      inventoryLevel / 1000,
      demand / 100,
      leadTime / 30,
      supplierReliability,
      event.transportCost / 1000,
      event.stockoutOccurred ? 1 : 0
    ];
    
    const signal: UniversalSignal = {
      domain: 'market',
      timestamp,
      intensity,
      frequency,
      phase,
      harmonics,
      rawData: [inventoryLevel, demand, leadTime, supplierReliability, visibility]
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
    
    const avgInventory = recent.reduce((sum, s) => sum + s.rawData[0], 0) / recent.length;
    const avgDemand = recent.reduce((sum, s) => sum + s.rawData[1], 0) / recent.length;
    const avgLead = recent.reduce((sum, s) => sum + s.rawData[2], 0) / recent.length;
    const avgReliability = recent.reduce((sum, s) => sum + s.rawData[3], 0) / recent.length;
    const avgVisibility = recent.reduce((sum, s) => sum + s.rawData[4], 0) / recent.length;
    
    const quadrantProfile = {
      aggressive: avgDemand > avgInventory ? 0.8 : 0.2, // High demand pressure
      defensive: avgInventory > avgDemand * 2 ? 0.7 : 0.2, // High safety stock
      tactical: avgLead > 14 ? 0.6 : 0.3, // Long lead times
      strategic: avgVisibility > 0.8 ? 0.8 : 0.3 // High visibility
    };
    
    const temporalFlow = {
      early: avgLead < 7 ? 0.8 : 0.2,
      mid: avgLead >= 7 && avgLead < 21 ? 0.7 : 0.2,
      late: avgLead >= 21 ? 0.8 : 0.2
    };
    
    return {
      domain: 'market',
      quadrantProfile,
      temporalFlow,
      intensity: (avgDemand - avgInventory) / 100,
      momentum: avgDemand > avgInventory ? 1 : -1,
      volatility: 1 - avgReliability,
      dominantFrequency: avgDemand / (avgInventory + 1),
      harmonicResonance: avgVisibility,
      phaseAlignment: avgReliability,
      extractedAt: Date.now()
    };
  }
  
  private getDefaultSignature(): DomainSignature {
    return {
      domain: 'market',
      quadrantProfile: { aggressive: 0.3, defensive: 0.3, tactical: 0.2, strategic: 0.2 },
      temporalFlow: { early: 0.4, mid: 0.4, late: 0.2 },
      intensity: 0.4,
      momentum: 0,
      volatility: 0.3,
      dominantFrequency: 0.5,
      harmonicResonance: 0.6,
      phaseAlignment: 0.7,
      extractedAt: Date.now()
    };
  }
  
  // Calculate Economic Order Quantity
  calculateEOQ(annualDemand: number, orderCost: number, holdingCost: number): number {
    return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  }
  
  // Calculate safety stock
  calculateSafetyStock(serviceLevel: number, demandStdDev: number, leadTime: number): number {
    const zScores: Record<number, number> = { 0.9: 1.28, 0.95: 1.65, 0.99: 2.33 };
    const z = zScores[serviceLevel] || 1.65;
    return z * demandStdDev * Math.sqrt(leadTime);
  }
  
  // Simulate bullwhip effect
  simulateBullwhip(
    retailDemand: number[],
    orderBatchSize: number,
    forecastSmoothing: number
  ): { retailer: number[]; distributor: number[]; manufacturer: number[] } {
    const retailer = retailDemand;
    const distributor: number[] = [];
    const manufacturer: number[] = [];
    
    let distForecast = retailer[0];
    
    for (let i = 0; i < retailer.length; i++) {
      // Distributor batches orders
      const distOrder = Math.ceil(retailer[i] / orderBatchSize) * orderBatchSize;
      distributor.push(distOrder);
      
      // Update forecast with smoothing
      distForecast = forecastSmoothing * retailer[i] + (1 - forecastSmoothing) * distForecast;
      
      // Manufacturer sees distributor orders + forecast buffer
      const mfgOrder = Math.ceil(distForecast * 1.2 / orderBatchSize) * orderBatchSize;
      manufacturer.push(mfgOrder);
    }
    
    return { retailer, distributor, manufacturer };
  }
}

export const supplyChainAdapter = new SupplyChainAdapter();
export { BULLWHIP_EFFECT, INVENTORY_THEORIES, LOGISTICS_PATTERNS, SUPPLY_RISKS, SUPPLY_STRATEGIES };
export type { SupplyChainEvent };
