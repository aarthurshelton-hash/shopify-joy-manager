import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useAutoHealSystem, CodeIssue } from '@/hooks/useAutoHealSystem';
import { motion, AnimatePresence } from 'framer-motion';

interface AutoHealPanelProps {
  issues?: CodeIssue[];
  onScanComplete?: () => void;
}

export const AutoHealPanel: React.FC<AutoHealPanelProps> = ({ 
  issues = [],
  onScanComplete 
}) => {
  const {
    config,
    setConfig,
    stats,
    isRunning,
    lastScan,
    pendingFixes,
    detectIssues,
    applyFix,
    toggleEnabled,
    fetchStats
  } = useAutoHealSystem();

  const handleScan = async () => {
    await detectIssues(issues);
    onScanComplete?.();
  };

  const healthScore = stats 
    ? Math.max(0, 100 - (stats.critical_issues * 20) - (stats.unresolved_issues * 2))
    : 100;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={config.enabled ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className={`h-5 w-5 ${config.enabled ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
            </motion.div>
            <CardTitle className="text-lg">Self-Healing System</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {config.enabled ? 'Active' : 'Paused'}
            </span>
            <Switch
              checked={config.enabled}
              onCheckedChange={toggleEnabled}
            />
          </div>
        </div>
        <CardDescription>
          Continuous code analysis with auto-fix capabilities
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Shield className={`h-8 w-8 ${getHealthColor(healthScore)}`} />
            <div>
              <p className="text-sm font-medium">Codebase Health</p>
              <p className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
                {healthScore}%
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchStats}
            disabled={isRunning}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1 text-red-500">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">Critical</span>
              </div>
              <p className="text-xl font-bold">{stats.critical_issues}</p>
            </div>
            <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-1 text-yellow-500">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Pending</span>
              </div>
              <p className="text-xl font-bold">{stats.pending_fixes}</p>
            </div>
            <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="h-3 w-3" />
                <span className="text-xs">Applied</span>
              </div>
              <p className="text-xl font-bold">{stats.applied_fixes}</p>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1 text-blue-500">
                <Sparkles className="h-3 w-3" />
                <span className="text-xs">High Conf.</span>
              </div>
              <p className="text-xl font-bold">{stats.high_confidence_fixes}</p>
            </div>
          </div>
        )}

        {/* Auto-Apply Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Auto-Apply Threshold</label>
            <span className="text-sm text-muted-foreground">
              {(config.autoApplyThreshold * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[config.autoApplyThreshold * 100]}
            onValueChange={([value]) => setConfig(c => ({ ...c, autoApplyThreshold: value / 100 }))}
            min={70}
            max={99}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Fixes with confidence ≥ {(config.autoApplyThreshold * 100).toFixed(0)}% will be auto-applied
          </p>
        </div>

        {/* Pending Fixes */}
        {pendingFixes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Pending Fixes ({pendingFixes.length})
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingFixes.map((fix) => (
                    <motion.div
                      key={fix.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-mono text-xs">{fix.file_path}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {(fix.confidence * 100).toFixed(0)}%
                          </Badge>
                          <Badge 
                            variant={fix.status === 'generated' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {fix.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => applyFix(fix.id)}
                        className="ml-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleScan}
            disabled={isRunning || issues.length === 0}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Scan & Store Issues
              </>
            )}
          </Button>
          <Button
            variant={config.enabled ? 'destructive' : 'default'}
            onClick={toggleEnabled}
          >
            {config.enabled ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Last Scan */}
        {lastScan && (
          <p className="text-xs text-muted-foreground text-center">
            Last scan: {lastScan.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
