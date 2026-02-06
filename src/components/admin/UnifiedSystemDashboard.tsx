/**
 * Unified System Dashboard
 * 
 * Real-time visualization of all En Pensent systems:
 * - Code analysis metrics
 * - Universal adapter signals
 * - Cross-domain resonances
 * - Evolution events
 * - Live issue tracking
 * 
 * Shows ACTUAL live data from telemetry hub
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Zap,
  GitBranch,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Brain,
  Target,
  Layers,
  Cpu,
  Radio
} from 'lucide-react';
import { useUnifiedTelemetry, useCodeTelemetry, useAdapterTelemetry, useEvolutionTelemetry } from '@/hooks/useUnifiedTelemetry';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Color palette
const COLORS = {
  primary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  code: '#10b981',
  adapter: '#8b5cf6',
  resonance: '#f59e0b',
  evolution: '#ec4899'
};

interface UnifiedDashboardProps {
  className?: string;
}

export function UnifiedSystemDashboard({ className }: UnifiedDashboardProps) {
  const telemetry = useUnifiedTelemetry();
  const codeTelemetry = useCodeTelemetry();
  const adapterTelemetry = useAdapterTelemetry();
  const evolutionTelemetry = useEvolutionTelemetry();
  const [activeTab, setActiveTab] = useState('overview');

  // Format health for display
  const healthPercent = Math.round(telemetry.averageHealth);
  const healthColor = healthPercent > 80 ? COLORS.success : healthPercent > 60 ? COLORS.warning : COLORS.danger;

  // Build live data for charts
  const adapterChartData = useMemo(() => {
    return adapterTelemetry.topDomains.map(domain => ({
      name: domain.domain,
      value: domain.count,
      signals: domain.signals
    }));
  }, [adapterTelemetry.topDomains]);

  const issueChartData = useMemo(() => {
    return [
      { name: 'Critical', value: codeTelemetry.issues.counts.critical, color: COLORS.danger },
      { name: 'High', value: codeTelemetry.issues.counts.high, color: COLORS.warning },
      { name: 'Medium', value: codeTelemetry.issues.counts.medium, color: COLORS.info },
      { name: 'Low', value: codeTelemetry.issues.counts.low, color: COLORS.success }
    ];
  }, [codeTelemetry.issues.counts]);

  const evolutionChartData = useMemo(() => {
    return Object.entries(evolutionTelemetry.eventsByType).map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      count
    }));
  }, [evolutionTelemetry.eventsByType]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Live Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-green-500"
            />
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-green-500"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Network className="w-5 h-5 text-violet-500" />
              Unified System Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time telemetry from {telemetry.totalAdapters} adapters, {telemetry.code?.fileCount || 0} files
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
          <Radio className="w-3 h-3 mr-1" />
          LIVE
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Cpu className="w-4 h-4" />}
          label="Active Adapters"
          value={adapterTelemetry.activeAdapters}
          total={adapterTelemetry.totalAdapters}
          color={COLORS.adapter}
          trend={`${adapterTelemetry.totalSignals} signals`}
        />
        <MetricCard
          icon={<GitBranch className="w-4 h-4" />}
          label="Code Health"
          value={`${healthPercent}%`}
          subvalue={codeTelemetry.analysis?.fileCount}
          sublabel="files"
          color={healthColor}
          trend={healthPercent > 80 ? 'Excellent' : healthPercent > 60 ? 'Good' : 'Needs Attention'}
        />
        <MetricCard
          icon={<Network className="w-4 h-4" />}
          label="Resonances"
          value={adapterTelemetry.resonances.length}
          color={COLORS.resonance}
          trend="cross-domain pairs"
        />
        <MetricCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Issues"
          value={codeTelemetry.issues.counts.critical + codeTelemetry.issues.counts.high}
          subvalue={codeTelemetry.issues.counts.medium + codeTelemetry.issues.counts.low}
          sublabel="medium/low"
          color={codeTelemetry.issues.counts.critical > 0 ? COLORS.danger : COLORS.warning}
          trend={codeTelemetry.issues.counts.critical > 0 ? 'Critical!' : 'Manageable'}
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="adapters" className="gap-2">
            <Cpu className="h-4 w-4" />
            Adapters
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="evolution" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolution
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* System Health Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  System Health Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Code', value: codeTelemetry.analysis?.health || 0, color: COLORS.code },
                          { name: 'Adapters', value: Math.round(telemetry.averageHealth), color: COLORS.adapter },
                          { name: 'Gap', value: Math.max(0, 100 - (codeTelemetry.analysis?.health || 0) - Math.round(telemetry.averageHealth)), color: '#e5e7eb' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: 'Code', value: codeTelemetry.analysis?.health || 0, color: COLORS.code },
                          { name: 'Adapters', value: Math.round(telemetry.averageHealth), color: COLORS.adapter },
                          { name: 'Gap', value: Math.max(0, 100 - (codeTelemetry.analysis?.health || 0) - Math.round(telemetry.averageHealth)), color: '#e5e7eb' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    Code {codeTelemetry.analysis?.health || 0}%
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    Adapters {Math.round(telemetry.averageHealth)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Adapter Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adapterChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS.adapter} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Event Stream */}
          <LiveEventStream events={evolutionTelemetry.recentEvents} />
        </TabsContent>

        {/* Adapters Tab */}
        <TabsContent value="adapters" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Active Adapters ({adapterTelemetry.adapters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {adapterTelemetry.adapters.slice(0, 20).map((adapter) => (
                      <motion.div
                        key={adapter.adapterName}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-lg border bg-card/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${adapter.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium text-sm">{adapter.adapterName}</p>
                            <p className="text-xs text-muted-foreground">{adapter.domain}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{adapter.signalCount} signals</p>
                          <p className="text-xs text-muted-foreground">
                            Learning: {(adapter.learningRate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resonance Pairs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {adapterTelemetry.resonances.map((resonance, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {resonance.adapter1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {resonance.adapter2}
                          </Badge>
                        </div>
                        <Progress 
                          value={resonance.resonanceScore * 100} 
                          className="h-1"
                        />
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          {(resonance.resonanceScore * 100).toFixed(0)}% resonance
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Issue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Issues by Severity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={issueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {issueChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Code Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Code Health Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pattern Density</span>
                    <span>{(codeTelemetry.analysis?.patternDensity || 0).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={codeTelemetry.analysis?.patternDensity || 0} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>File Count</span>
                    <span>{codeTelemetry.analysis?.fileCount || 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {codeTelemetry.analysis?.linesOfCode || 0} lines of code
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Archetype</span>
                    <Badge variant="outline">{codeTelemetry.analysis?.archetype || 'Unknown'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {codeTelemetry.issues.all.slice(0, 20).map((issue) => (
                    <div 
                      key={issue.id} 
                      className={`p-3 rounded-lg border ${
                        issue.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                        issue.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                        'bg-yellow-500/10 border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={issue.severity === 'critical' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {issue.severity}
                          </Badge>
                          <span className="text-sm font-medium">{issue.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(issue.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{issue.file}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Event Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolutionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS.evolution} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Cross-Domain Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-pink-500" />
                      <span className="text-sm font-medium">Total Events</span>
                    </div>
                    <span className="text-lg font-bold">{evolutionTelemetry.eventCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-medium">Cross-Domain</span>
                    </div>
                    <span className="text-lg font-bold">{evolutionTelemetry.crossDomainEvents.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Evolution Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Evolution Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {evolutionTelemetry.allEvents.slice(0, 30).map((event, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.eventType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">from {event.source}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  total,
  subvalue,
  sublabel,
  color,
  trend
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  total?: number;
  subvalue?: number;
  sublabel?: string;
  color: string;
  trend: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-1 h-full bg-[var(--color)]"
        style={{ '--color': color } as React.CSSProperties}
      />
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm">{label}</span>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            {total !== undefined && (
              <span className="text-sm text-muted-foreground">/ {total}</span>
            )}
            {subvalue !== undefined && (
              <span className="text-xs text-muted-foreground">({subvalue} {sublabel})</span>
            )}
          </div>
          <p className="text-xs mt-1 text-[var(--color)]" style={{ '--color': color } as React.CSSProperties}>{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Live Event Stream Component
function LiveEventStream({ events }: { events: Array<{ eventType: string; source: string; timestamp: number }> }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Live Event Stream
          <Badge variant="outline" className="ml-auto text-xs bg-green-500/10 text-green-400">
            <Activity className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[150px]">
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {events.slice(0, 10).map((event, idx) => (
                <motion.div
                  key={`${event.timestamp}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                  className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm"
                >
                  <Badge variant="outline" className="text-xs shrink-0">
                    {event.source}
                  </Badge>
                  <span className="flex-1 truncate">{event.eventType.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {events.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                Waiting for events...
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
