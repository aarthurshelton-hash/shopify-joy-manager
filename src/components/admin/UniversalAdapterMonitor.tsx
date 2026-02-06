/**
 * Universal Adapter Monitor
 * 
 * Real-time visualization of all 55 domain adapters with:
 * - Domain grouping and health metrics
 * - Cross-domain resonance visualization
 * - Evolution cycle tracking
 * - Integration with code analysis results
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Zap, 
  GitBranch, 
  Brain,
  Target,
  RefreshCw,
  Layers,
  Network,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2
} from 'lucide-react';
import { 
  useUniversalAdapterMonitor, 
  getDomainColor,
  type AdapterMetrics,
  type ResonanceMetrics 
} from '@/hooks/useUniversalAdapterMonitor';
import { useUnifiedEvolution } from '@/hooks/useUnifiedEvolution';

interface UniversalAdapterMonitorProps {
  compact?: boolean;
  showCodeIntegration?: boolean;
  codeHealth?: number;
  onAdapterClick?: (adapter: AdapterMetrics) => void;
}

export const UniversalAdapterMonitor: React.FC<UniversalAdapterMonitorProps> = ({
  compact = false,
  showCodeIntegration = true,
  codeHealth,
  onAdapterClick
}) => {
  const monitor = useUniversalAdapterMonitor(3000);
  const evolution = useUnifiedEvolution();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [showResonances, setShowResonances] = useState(false);

  // Group adapters by domain
  const adaptersByDomain = useMemo(() => {
    const groups = new Map<string, AdapterMetrics[]>();
    monitor.adapters.forEach(adapter => {
      const list = groups.get(adapter.domain) || [];
      list.push(adapter);
      groups.set(adapter.domain, list);
    });
    return groups;
  }, [monitor.adapters]);

  // Calculate overall system health
  const systemHealth = useMemo(() => {
    if (monitor.adapters.length === 0) return 0;
    const totalHealth = monitor.adapters.reduce((sum, a) => sum + a.healthScore, 0);
    return Math.round(totalHealth / monitor.adapters.length);
  }, [monitor.adapters]);

  // Calculate cross-domain resonance intensity
  const resonanceIntensity = useMemo(() => {
    if (monitor.resonances.length === 0) return 0;
    const totalScore = monitor.resonances.reduce((sum, r) => sum + r.resonanceScore, 0);
    return Math.round((totalScore / monitor.resonances.length) * 100);
  }, [monitor.resonances]);

  const handleSync = () => {
    monitor.triggerSync();
    evolution.emitEvolution({
      type: 'pattern_discovered',
      source: 'code',
      data: { action: 'manual_sync', systemHealth, resonanceIntensity },
      timestamp: new Date()
    });
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-violet-500/5 via-background to-fuchsia-500/10 border-violet-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-violet-500" />
              <CardTitle className="text-lg">Universal Adapters</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {monitor.activeCount}/{monitor.adapters.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">System Health</span>
            <span className={`font-bold ${systemHealth >= 80 ? 'text-green-500' : systemHealth >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {systemHealth}%
            </span>
          </div>
          <Progress value={systemHealth} className="h-2" />
          
          {showCodeIntegration && codeHealth !== undefined && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <GitBranch className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Code Health: {codeHealth}%</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {resonanceIntensity > 70 ? 'Synced' : 'Drifting'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-violet-500/5 via-background to-fuchsia-500/10 border-violet-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Network className="h-6 w-6 text-violet-500" />
            </motion.div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Universal Adapter Monitor
                <Badge variant="outline" className="text-xs">v7.52-SYNC</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {monitor.adapters.length} domain adapters • Cycle #{monitor.evolutionCycle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSync}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowResonances(!showResonances)}
            >
              <Share2 className="h-4 w-4 mr-1" />
              {showResonances ? 'Hide' : 'Show'} Resonances
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            icon={<Activity className="h-4 w-4" />}
            label="System Health"
            value={`${systemHealth}%`}
            color={systemHealth >= 80 ? 'text-green-500' : systemHealth >= 60 ? 'text-yellow-500' : 'text-red-500'}
          />
          <MetricCard
            icon={<Zap className="h-4 w-4" />}
            label="Total Signals"
            value={monitor.totalSignals.toLocaleString()}
            color="text-violet-500"
          />
          <MetricCard
            icon={<Layers className="h-4 w-4" />}
            label="Active Adapters"
            value={`${monitor.activeCount}/${monitor.adapters.length}`}
            color="text-blue-500"
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Resonance"
            value={`${resonanceIntensity}%`}
            color={resonanceIntensity > 70 ? 'text-green-500' : 'text-orange-500'}
          />
        </div>

        {/* Code Integration Section */}
        {showCodeIntegration && codeHealth !== undefined && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Code-Adapter Integration</h3>
              </div>
              <Badge 
                variant="outline" 
                className={Math.abs(systemHealth - codeHealth) < 15 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}
              >
                {Math.abs(systemHealth - codeHealth) < 15 ? 'Aligned' : 'Drift Detected'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Code Health</span>
                  <span className="font-medium">{codeHealth}%</span>
                </div>
                <Progress value={codeHealth} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Adapter Health</span>
                  <span className="font-medium">{systemHealth}%</span>
                </div>
                <Progress value={systemHealth} className="h-2 bg-violet-500/20" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Alignment Score: {Math.round(100 - Math.abs(systemHealth - codeHealth))}% • 
              Difference: {Math.abs(systemHealth - codeHealth)}%
            </p>
          </div>
        )}

        {/* Domain Groups */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Domain Groups ({adaptersByDomain.size} domains)
          </h3>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {Array.from(adaptersByDomain.entries()).map(([domain, adapters]) => (
                <DomainAccordion
                  key={domain}
                  domain={domain}
                  adapters={adapters}
                  isExpanded={expandedDomain === domain}
                  onToggle={() => setExpandedDomain(expandedDomain === domain ? null : domain)}
                  onAdapterClick={onAdapterClick}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Resonance View */}
        <AnimatePresence>
          {showResonances && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Cross-Domain Resonances ({monitor.resonances.length} pairs)
              </h3>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {monitor.topResonances.map((resonance, idx) => (
                    <ResonanceCard key={`${resonance.adapter1}-${resonance.adapter2}`} resonance={resonance} index={idx} />
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-4">
            <span>Evolution Cycle: #{monitor.evolutionCycle}</span>
            <span>Last Update: {new Date(monitor.lastUpdate).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            <span>Self-Evolving Architecture Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="p-3 rounded-lg bg-muted/50 border">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);

// Domain Accordion Component
const DomainAccordion: React.FC<{
  domain: string;
  adapters: AdapterMetrics[];
  isExpanded: boolean;
  onToggle: () => void;
  onAdapterClick?: (adapter: AdapterMetrics) => void;
}> = ({ domain, adapters, isExpanded, onToggle, onAdapterClick }) => {
  const color = getDomainColor(domain);
  const avgHealth = Math.round(adapters.reduce((sum, a) => sum + a.healthScore, 0) / adapters.length);
  const activeCount = adapters.filter(a => a.isActive).length;
  const totalSignals = adapters.reduce((sum, a) => sum + a.signalCount, 0);

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          />
          <span className="font-medium capitalize">{domain}</span>
          <Badge variant="outline" className="text-xs">
            {adapters.length} adapters
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {activeCount} active • {totalSignals.toLocaleString()} signals
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2 bg-background/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Domain Health</span>
                <span className={`font-medium ${avgHealth >= 80 ? 'text-green-500' : avgHealth >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {avgHealth}%
                </span>
              </div>
              <Progress value={avgHealth} className="h-1.5 mb-3" />
              
              <div className="grid grid-cols-1 gap-1">
                {adapters.map(adapter => (
                  <button
                    key={adapter.name}
                    onClick={() => onAdapterClick?.(adapter)}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${adapter.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-mono">{adapter.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{adapter.signalCount.toLocaleString()} signals</span>
                      <span>LR: {(adapter.learningRate * 100).toFixed(1)}%</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${adapter.healthScore >= 80 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}
                      >
                        {adapter.healthScore}%
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Resonance Card Component
const ResonanceCard: React.FC<{
  resonance: ResonanceMetrics;
  index: number;
}> = ({ resonance, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className="p-3 rounded-lg bg-muted/30 border flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">{resonance.adapter1}</Badge>
        <Share2 className="h-3 w-3 text-muted-foreground" />
        <Badge variant="outline" className="text-xs">{resonance.adapter2}</Badge>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {resonance.sharedPatterns.slice(0, 2).map((pattern, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">
            {pattern}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Brain className="h-3 w-3 text-violet-500" />
        <span className={`font-medium ${resonance.resonanceScore > 0.8 ? 'text-green-500' : 'text-yellow-500'}`}>
          {Math.round(resonance.resonanceScore * 100)}%
        </span>
      </div>
    </div>
  </motion.div>
);

export default UniversalAdapterMonitor;
