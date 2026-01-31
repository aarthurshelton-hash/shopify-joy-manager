/**
 * Industry Vertical Dashboard
 * 
 * Demonstrates how the 64-square Color Flow Signature system applies
 * to high-value industrial verticals: Manufacturing, Supply Chain, etc.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  Factory, Truck, Heart, Shield, CreditCard, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Zap, Grid3X3
} from 'lucide-react';
import {
  MANUFACTURING_ARCHETYPES,
  SUPPLY_CHAIN_ARCHETYPES,
  HEALTHCARE_ARCHETYPES,
  CYBERSECURITY_ARCHETYPES,
  FRAUD_ARCHETYPES
} from '@/lib/pensent-core/domains/industry/types';

interface IndustryTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  gridExplanation: {
    rows: string;
    columns: string;
  };
  archetypes: Array<{
    id: string;
    name: string;
    description: string;
    riskLevel: string;
    accuracy: number;
    action: string;
  }>;
  marketSize: string;
  useCase: string;
}

const INDUSTRY_TABS: IndustryTab[] = [
  {
    id: 'manufacturing',
    name: 'Predictive Maintenance',
    icon: <Factory className="w-4 h-4" />,
    description: 'Predict machine failures 24-72 hours before they occur',
    gridExplanation: {
      rows: '8 time windows (sequential sensor readings)',
      columns: 'Vibration (XYZ), Temperature, Pressure, RPM, Power, Sound'
    },
    archetypes: MANUFACTURING_ARCHETYPES.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      riskLevel: a.failureRisk,
      accuracy: a.historicalAccuracy,
      action: a.recommendedAction
    })),
    marketSize: '$23B by 2028',
    useCase: 'A factory machine\'s vibration pattern matches "Bearing Degradation" archetype with 87% confidence → Schedule replacement in 24 hours, avoid $500K unplanned downtime'
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain Resilience',
    icon: <Truck className="w-4 h-4" />,
    description: 'Detect bottlenecks and vulnerabilities before disruption',
    gridExplanation: {
      rows: '8 time periods (daily/weekly snapshots)',
      columns: 'Inventory, Transit, Delays, Demand, Supplier, Route, Weather, Geopolitical'
    },
    archetypes: SUPPLY_CHAIN_ARCHETYPES.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      riskLevel: a.bottleneckRisk,
      accuracy: a.resilienceScore,
      action: a.recommendedAction
    })),
    marketSize: '$8B consulting market',
    useCase: 'Supply chain shows "Single Point Failure" pattern (same as chess exposed king) → Diversify suppliers before Q4 demand surge'
  },
  {
    id: 'healthcare',
    name: 'Patient Deterioration',
    icon: <Heart className="w-4 h-4" />,
    description: 'Early warning for sepsis, cardiac events, respiratory decline',
    gridExplanation: {
      rows: '8 time intervals (vital sign readings)',
      columns: 'Heart Rate, BP Systolic, BP Diastolic, O2 Sat, Temp, Resp Rate, Glucose, Mobility'
    },
    archetypes: HEALTHCARE_ARCHETYPES.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      riskLevel: a.urgency,
      accuracy: 0.85,
      action: a.recommendedAction
    })),
    marketSize: '$30K saved per early sepsis detection',
    useCase: 'Patient vitals show "Sepsis Precursor" pattern (matches thermal runaway in machines) → Activate sepsis protocol 4-6 hours before clinical presentation'
  },
  {
    id: 'cybersecurity',
    name: 'Threat Detection',
    icon: <Shield className="w-4 h-4" />,
    description: 'Identify attack patterns before breach completion',
    gridExplanation: {
      rows: '8 time slices (network traffic windows)',
      columns: 'Bytes In/Out, Packets, Duration, Port Sequence, Geo, TLS, User Agent, Protocol'
    },
    archetypes: CYBERSECURITY_ARCHETYPES.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      riskLevel: a.threatLevel,
      accuracy: 0.82,
      action: a.recommendedAction
    })),
    marketSize: '$8B threat hunting market',
    useCase: 'Network traffic shows "Lateral Movement" pattern (same as chess piece invasion) → Isolate affected segments before data exfiltration'
  },
  {
    id: 'fintech',
    name: 'Fraud Detection',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Stop fraud in real-time using temporal pattern matching',
    gridExplanation: {
      rows: '8 transaction windows',
      columns: 'Amount, Category, Location, Device, Velocity, Account Age, Distance, Time of Day'
    },
    archetypes: FRAUD_ARCHETYPES.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      riskLevel: a.fraudProbability > 0.8 ? 'critical' : a.fraudProbability > 0.5 ? 'high' : 'low',
      accuracy: 1 - a.fraudProbability + 0.1,
      action: a.recommendedAction
    })),
    marketSize: '$35B fraud prevention market',
    useCase: 'Transaction pattern shows "Velocity Attack" (same as chess blitz tactics) → Decline transaction, lock card, request 2FA'
  }
];

function getRiskBadge(risk: string): React.ReactNode {
  const colors: Record<string, string> = {
    critical: 'bg-destructive/20 text-destructive border-destructive/50',
    emergency: 'bg-destructive/20 text-destructive border-destructive/50',
    high: 'bg-warning/20 text-warning border-warning/50',
    urgent: 'bg-warning/20 text-warning border-warning/50',
    moderate: 'bg-muted/50 text-muted-foreground border-muted',
    routine: 'bg-muted/50 text-muted-foreground border-muted',
    low: 'bg-success/20 text-success border-success/50',
    nominal: 'bg-success/20 text-success border-success/50',
    preventive: 'bg-primary/20 text-primary border-primary/50',
    info: 'bg-primary/20 text-primary border-primary/50'
  };
  
  return (
    <Badge variant="outline" className={colors[risk] || colors.moderate}>
      {risk}
    </Badge>
  );
}

export function IndustryVerticalDashboard() {
  const [selectedTab, setSelectedTab] = useState('manufacturing');
  const currentIndustry = INDUSTRY_TABS.find(t => t.id === selectedTab)!;

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-primary" />
          64-Square Industry Applications
        </CardTitle>
        <CardDescription>
          The same pattern recognition that predicts chess outcomes now predicts industrial failures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-5 gap-1">
            {INDUSTRY_TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                {tab.icon}
                <span className="hidden sm:inline ml-1">{tab.id.split('_')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {INDUSTRY_TABS.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-4">
              {/* Header */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {tab.icon}
                      {tab.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{tab.description}</p>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/50">
                    {tab.marketSize}
                  </Badge>
                </div>
              </div>

              {/* Grid Mapping Explanation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Rows (8)</div>
                  <div className="text-sm font-medium">{tab.gridExplanation.rows}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Columns (8)</div>
                  <div className="text-sm font-medium">{tab.gridExplanation.columns}</div>
                </div>
              </div>

              {/* Archetypes */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Detected Archetypes
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tab.archetypes.slice(0, 4).map((archetype, idx) => (
                    <motion.div
                      key={archetype.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 bg-muted/20 rounded-lg border border-border/50"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{archetype.name}</span>
                        {getRiskBadge(archetype.riskLevel)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{archetype.description}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Progress value={archetype.accuracy * 100} className="h-1" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(archetype.accuracy * 100).toFixed(0)}% accuracy
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Real-world Use Case */}
              <div className="p-4 bg-gradient-to-r from-success/10 to-transparent rounded-lg border border-success/20">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-success">Example ROI:</span>
                    <p className="text-sm text-muted-foreground mt-1">{tab.useCase}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Universal Pattern Message */}
        <div className="p-4 bg-muted/30 rounded-lg border border-muted">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Why This Works
          </h4>
          <p className="text-sm text-muted-foreground">
            Temporal patterns are universal. A "cascade failure" looks the same whether it's a 
            chess position collapsing, a machine bearing degrading, or a patient developing sepsis. 
            By mapping everything to the same 64-square grid, we can transfer learning across domains 
            and detect patterns that single-industry tools miss.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
