/**
 * Market Learning Dashboard
 * Comprehensive view of the 24/7 learning system
 * Shows all securities, correlations, evolution, and reports
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, Brain, TrendingUp, Link2, FileText, 
  RefreshCw, Zap, Clock, Target, BarChart3,
  CheckCircle, XCircle, Wifi, WifiOff
} from 'lucide-react';
import { useMarketLearningSystem, SecurityMetrics, MarketCorrelation } from '@/hooks/useMarketLearningSystem';
import { formatNextPulse } from '@/hooks/useLiveHeartbeat';

const SecurityCard: React.FC<{ metric: SecurityMetrics }> = ({ metric }) => {
  const accuracy = metric.composite_accuracy * 100;
  const getAccuracyColor = (acc: number) => {
    if (acc >= 70) return 'text-green-400';
    if (acc >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="p-3 bg-card/50 border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-foreground">{metric.symbol}</span>
        <Badge variant={accuracy >= 60 ? 'default' : 'secondary'} className="text-xs">
          {metric.total_predictions} pred
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Composite</span>
          <span className={getAccuracyColor(accuracy)}>{accuracy.toFixed(1)}%</span>
        </div>
        <Progress value={accuracy} className="h-1.5" />
        
        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dir:</span>
            <span className={getAccuracyColor(metric.direction_accuracy * 100)}>
              {(metric.direction_accuracy * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mag:</span>
            <span className={getAccuracyColor(metric.magnitude_accuracy * 100)}>
              {(metric.magnitude_accuracy * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tim:</span>
            <span className={getAccuracyColor(metric.timing_accuracy * 100)}>
              {(metric.timing_accuracy * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cal:</span>
            <span className={getAccuracyColor(metric.calibration_accuracy * 100)}>
              {(metric.calibration_accuracy * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const CorrelationRow: React.FC<{ correlation: MarketCorrelation }> = ({ correlation }) => {
  const strength = Math.abs(correlation.correlation_coefficient);
  const isPositive = correlation.correlation_coefficient > 0;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-foreground">{correlation.symbol_a}</span>
        <Link2 className={`w-3 h-3 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
        <span className="font-mono text-sm text-foreground">{correlation.symbol_b}</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={strength * 100} className="w-16 h-1.5" />
        <span className={`text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {(correlation.correlation_coefficient * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export const MarketLearningDashboard: React.FC = () => {
  const { 
    isConnected, 
    isCollecting,
    lastUpdate,
    securityMetrics,
    correlations,
    evolutionState,
    report,
    ticksCollectedToday,
    predictionsToday,
    error,
    heartbeat,
    actions
  } = useMarketLearningSystem(true);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    await actions.generateReport();
    setIsGeneratingReport(false);
  };

  const handleForceSync = async () => {
    await actions.syncAll();
    await actions.triggerCollection();
    await actions.triggerResolution();
    await actions.triggerCorrelation();
    await actions.triggerEvolution();
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <Card className="p-3 bg-card/80 border-border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${heartbeat.isAlive ? 'text-green-400 animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground">
                Next: {formatNextPulse(heartbeat.nextPulseIn)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {ticksCollectedToday} ticks today
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">
                {predictionsToday} predictions
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleForceSync}
              disabled={heartbeat.isProcessing}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${heartbeat.isProcessing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Button 
              size="sm" 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              <FileText className="w-3 h-3 mr-1" />
              Report
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded">
            {error}
          </div>
        )}
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="securities" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="securities" className="text-xs">
            <BarChart3 className="w-3 h-3 mr-1" />
            Securities
          </TabsTrigger>
          <TabsTrigger value="correlations" className="text-xs">
            <Link2 className="w-3 h-3 mr-1" />
            Correlations
          </TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs">
            <Brain className="w-3 h-3 mr-1" />
            Evolution
          </TabsTrigger>
          <TabsTrigger value="report" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Report
          </TabsTrigger>
        </TabsList>

        {/* Securities Tab */}
        <TabsContent value="securities">
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Security Accuracy Metrics</h3>
              <Badge variant="outline">{securityMetrics.length} tracked</Badge>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {securityMetrics.map(metric => (
                  <SecurityCard key={metric.symbol} metric={metric} />
                ))}
                
                {securityMetrics.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No security data yet. System is learning...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations">
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Cross-Market Correlations</h3>
              <Button size="sm" variant="outline" onClick={actions.triggerCorrelation}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Recalculate
              </Button>
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {correlations
                  .filter(c => Math.abs(c.correlation_coefficient) > 0.3)
                  .map((corr, i) => (
                    <CorrelationRow key={i} correlation={corr} />
                  ))}
                
                {correlations.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No correlations calculated yet.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution">
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Self-Evolving System</h3>
              {evolutionState && (
                <Badge variant="outline">Generation {evolutionState.generation}</Badge>
              )}
            </div>
            
            {evolutionState ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fitness Score</span>
                      <span className="font-mono text-foreground">
                        {(evolutionState.fitness_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={evolutionState.fitness_score * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Predictions</span>
                      <span className="font-mono text-foreground">
                        {evolutionState.total_predictions.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border/50 pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">EVOLVED GENES</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(evolutionState.genes).map(([gene, value]) => (
                      <div key={gene} className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {gene.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-mono text-foreground">
                          {(Number(value) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {evolutionState.last_mutation_at && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last mutation: {new Date(evolutionState.last_mutation_at).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Evolution state initializing...</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report">
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">System Report</h3>
              <Button 
                size="sm" 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <FileText className="w-3 h-3 mr-1" />
                )}
                Generate
              </Button>
            </div>
            
            {report ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-3 bg-background/50">
                      <div className="text-xs text-muted-foreground mb-1">Overall Accuracy</div>
                      <div className="text-2xl font-bold text-foreground">
                        {(report.overallAccuracy * 100).toFixed(1)}%
                      </div>
                    </Card>
                    <Card className="p-3 bg-background/50">
                      <div className="text-xs text-muted-foreground mb-1">Total Predictions</div>
                      <div className="text-2xl font-bold text-foreground">
                        {report.summary.totalPredictions.toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-3 bg-background/50">
                      <div className="text-xs text-muted-foreground mb-1">System Fitness</div>
                      <div className="text-2xl font-bold text-foreground">
                        {(report.summary.systemFitness * 100).toFixed(1)}%
                      </div>
                    </Card>
                  </div>
                  
                  <div className="border-t border-border/50 pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3">TOP PERFORMERS</h4>
                    <div className="space-y-2">
                      {report.securityMetrics.slice(0, 5).map(metric => (
                        <div key={metric.symbol} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-foreground">{metric.symbol}</span>
                            <Badge variant="outline" className="text-xs">
                              {metric.total_predictions} pred
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {metric.composite_accuracy >= 0.6 ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="font-mono text-sm">
                              {(metric.composite_accuracy * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Report generated: {new Date(report.generatedAt).toLocaleString()}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "Generate" to create a comprehensive report.</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-xs text-center text-muted-foreground">
          Last sync: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
