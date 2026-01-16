/**
 * Futures Correlation Panel
 * Shows real-time correlations between key 24H futures contracts
 */

import { motion } from 'framer-motion';
import { 
  ArrowRightLeft, TrendingUp, TrendingDown, Clock, 
  Zap, Target, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FUTURES_CONTRACTS, getHighConfidenceCorrelations, type FuturesContract } from '@/lib/pensent-core/domains/finance/futuresCorrelations';

interface FuturesCorrelationPanelProps {
  activeCorrelations?: Array<{
    contract1: string;
    contract2: string;
    correlation: number;
    confidence: number;
  }>;
}

function ContractBadge({ contract }: { contract: FuturesContract }) {
  return (
    <div className="p-2 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono font-bold text-sm">{contract.symbol}</span>
        <span className="text-[10px] text-muted-foreground">{contract.exchange}</span>
      </div>
      <div className="text-[10px] text-muted-foreground truncate">
        {contract.name}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Clock className="w-2.5 h-2.5 text-primary" />
        <span className="text-[9px] text-muted-foreground">24H</span>
        {contract.leadLagProfile.leadsBy > 0 && (
          <span className="text-[9px] text-green-400 ml-auto">
            Leads +{contract.leadLagProfile.leadsBy}
          </span>
        )}
      </div>
    </div>
  );
}

function CorrelationLine({ 
  contract1, 
  contract2, 
  correlation, 
  confidence 
}: { 
  contract1: string; 
  contract2: string; 
  correlation: number; 
  confidence: number;
}) {
  const isPositive = correlation > 0;
  const isStrong = Math.abs(correlation) > 0.6;
  const isWeak = Math.abs(correlation) < 0.3;

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg border",
      isStrong && isPositive && "border-green-500/30 bg-green-500/5",
      isStrong && !isPositive && "border-red-500/30 bg-red-500/5",
      !isStrong && "border-border/30 bg-card/30"
    )}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold">{contract1}</span>
        <ArrowRightLeft className={cn(
          "w-3 h-3",
          isPositive ? "text-green-400" : "text-red-400"
        )} />
        <span className="font-mono text-xs font-bold">{contract2}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={cn(
          "text-xs font-mono font-bold",
          isPositive ? "text-green-400" : "text-red-400"
        )}>
          {isPositive ? '+' : ''}{(correlation * 100).toFixed(0)}%
        </div>
        <div className={cn(
          "text-[10px] px-1.5 py-0.5 rounded",
          confidence >= 0.8 ? "bg-primary/20 text-primary" :
          confidence >= 0.6 ? "bg-yellow-500/20 text-yellow-400" :
          "bg-muted text-muted-foreground"
        )}>
          {(confidence * 100).toFixed(0)}% conf
        </div>
      </div>
    </div>
  );
}

function LeadingIndicator({ contract }: { contract: FuturesContract }) {
  const leadTime = contract.leadLagProfile.leadsBy;
  const reliability = contract.leadLagProfile.reliability;
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/30">
      <div className="flex items-center gap-2">
        <Zap className="w-3 h-3 text-green-400" />
        <span className="font-mono text-xs font-bold">{contract.symbol}</span>
      </div>
      <div className="text-[10px] text-green-400">
        Leads by {leadTime} ticks ({(reliability * 100).toFixed(0)}% reliable)
      </div>
    </div>
  );
}

export function FuturesCorrelationPanel({ activeCorrelations }: FuturesCorrelationPanelProps) {
  const contracts = Object.values(FUTURES_CONTRACTS);
  const keyContracts = ['ES', 'NQ', 'ZN', 'VX', 'GC', 'CL'];
  const displayContracts = contracts.filter(c => keyContracts.includes(c.symbol));
  
  // Get leading indicators
  const leadingContracts = contracts.filter(
    c => c.leadLagProfile.leadsBy > 0 && c.leadLagProfile.reliability > 0.7
  );
  
  // Use provided correlations or get defaults
  const correlations = activeCorrelations || getHighConfidenceCorrelations();

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">24H Futures Correlations</span>
      </div>

      {/* Key Contracts Grid */}
      <div className="grid grid-cols-3 gap-2">
        {displayContracts.slice(0, 6).map(contract => (
          <ContractBadge key={contract.symbol} contract={contract} />
        ))}
      </div>

      {/* Leading Indicators */}
      {leadingContracts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium">Leading Indicators</span>
          </div>
          {leadingContracts.map(contract => (
            <LeadingIndicator key={contract.symbol} contract={contract} />
          ))}
        </div>
      )}

      {/* Active Correlations */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">High-Confidence Correlations</span>
        </div>
        
        <div className="space-y-1 overflow-y-auto flex-1">
          {correlations.slice(0, 8).map((corr, i) => (
            <CorrelationLine 
              key={`${corr.contract1}-${corr.contract2}-${i}`}
              {...corr}
            />
          ))}
        </div>
      </div>

      {/* Trading Implications */}
      <div className="p-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-muted-foreground">
            <strong className="text-yellow-400">VIX leads ES</strong> by 3 ticks with 85% reliability. 
            Watch for divergence between NQ and ES for sector rotation signals.
          </div>
        </div>
      </div>
    </div>
  );
}
