import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedEvolution } from './useUnifiedEvolution';
import { toast } from 'sonner';

export interface CodeIssue {
  id?: string;
  file_path: string;
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  confidence: number;
  line_start?: number;
  line_end?: number;
  auto_fixable: boolean;
  metadata?: Record<string, unknown>;
}

export interface PendingFix {
  id: string;
  issue_id: string;
  file_path: string;
  fix_prompt: string;
  fixed_code?: string;
  confidence: number;
  status: string;
  generated_at: string;
}

export interface AutoHealStats {
  total_issues: number;
  unresolved_issues: number;
  auto_fixable: number;
  critical_issues: number;
  pending_fixes: number;
  applied_fixes: number;
  high_confidence_fixes: number;
  recent_runs: Array<{
    id: string;
    started_at: string;
    status: string;
    issues_detected: number;
    fixes_generated: number;
  }>;
}

export interface AutoHealConfig {
  enabled: boolean;
  autoApplyThreshold: number; // 0-1, default 0.9 for high confidence
  scanIntervalMs: number; // default 30000 (30 seconds)
  maxAutoFixesPerRun: number; // default 3
}

const DEFAULT_CONFIG: AutoHealConfig = {
  enabled: false,
  autoApplyThreshold: 0.9,
  scanIntervalMs: 30000,
  maxAutoFixesPerRun: 3
};

export function useAutoHealSystem() {
  const [config, setConfig] = useState<AutoHealConfig>(() => {
    const saved = localStorage.getItem('autoHealConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  
  const [stats, setStats] = useState<AutoHealStats | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [pendingFixes, setPendingFixes] = useState<PendingFix[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const evolution = useUnifiedEvolution();

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('autoHealConfig', JSON.stringify(config));
  }, [config]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-heal-codebase', {
        body: { action: 'get_stats' }
      });
      
      if (error) throw error;
      if (data?.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('[AutoHeal] Failed to fetch stats:', error);
    }
  }, []);

  // Detect and store issues from frontend analysis
  const detectIssues = useCallback(async (issues: CodeIssue[]) => {
    try {
      setIsRunning(true);
      
      const { data, error } = await supabase.functions.invoke('auto-heal-codebase', {
        body: { 
          action: 'detect_issues',
          issues 
        }
      });
      
      if (error) throw error;
      
      console.log(`[AutoHeal] Stored ${data.issues_stored} issues`);
      setLastScan(new Date());
      
      // Emit evolution event
      await evolution.onCodeAnalyzed({
        archetype: 'self-healing',
        health: 100 - (issues.filter(i => i.severity === 'critical').length * 10),
        recommendations: issues.slice(0, 3).map(i => i.description)
      });
      
      await fetchStats();
      return data;
    } catch (error) {
      console.error('[AutoHeal] Failed to detect issues:', error);
      toast.error('Failed to analyze codebase');
    } finally {
      setIsRunning(false);
    }
  }, [evolution, fetchStats]);

  // Generate fix for an issue
  const generateFix = useCallback(async (issue: CodeIssue & { id: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-heal-codebase', {
        body: {
          action: 'generate_fix',
          fix_request: {
            issue_id: issue.id,
            file_path: issue.file_path,
            issue_description: issue.description,
            confidence: issue.confidence
          }
        }
      });
      
      if (error) throw error;
      
      if (data.requires_manual_application) {
        toast.info('Fix prompt generated - manual application required');
      } else {
        toast.success('AI fix generated successfully');
      }
      
      await fetchStats();
      return data;
    } catch (error) {
      console.error('[AutoHeal] Failed to generate fix:', error);
      toast.error('Failed to generate fix');
    }
  }, [fetchStats]);

  // Get pending high-confidence fixes
  const getPendingFixes = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-heal-codebase', {
        body: {
          action: 'get_pending_fixes',
          auto_apply_threshold: config.autoApplyThreshold
        }
      });
      
      if (error) throw error;
      setPendingFixes(data.fixes || []);
      return data.fixes;
    } catch (error) {
      console.error('[AutoHeal] Failed to get pending fixes:', error);
    }
  }, [config.autoApplyThreshold]);

  // Apply a fix
  const applyFix = useCallback(async (fixId: string, approvedBy?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-heal-codebase', {
        body: {
          action: 'apply_fix',
          fix_request: {
            fix_id: fixId,
            approved_by: approvedBy || 'manual'
          }
        }
      });
      
      if (error) throw error;
      
      toast.success('Fix applied successfully');
      
      // Emit evolution event
      await evolution.onCodeFixed({
        file: 'auto-healed',
        issue: 'Code issue',
        resolution: 'Auto-applied fix'
      });
      
      await fetchStats();
      await getPendingFixes();
      return data;
    } catch (error) {
      console.error('[AutoHeal] Failed to apply fix:', error);
      toast.error('Failed to apply fix');
    }
  }, [evolution, fetchStats, getPendingFixes]);

  // Auto-heal loop
  const runAutoHealCycle = useCallback(async () => {
    if (!config.enabled || isRunning) return;
    
    console.log('[AutoHeal] Running auto-heal cycle...');
    
    // Check for high-confidence fixes that can be auto-applied
    const fixes = await getPendingFixes();
    
    if (fixes && fixes.length > 0) {
      const toApply = fixes
        .filter((f: PendingFix) => f.confidence >= config.autoApplyThreshold)
        .slice(0, config.maxAutoFixesPerRun);
      
      for (const fix of toApply) {
        console.log(`[AutoHeal] Auto-applying fix ${fix.id} (confidence: ${fix.confidence})`);
        await applyFix(fix.id, 'auto-heal-system');
      }
      
      if (toApply.length > 0) {
        toast.success(`Auto-applied ${toApply.length} high-confidence fixes`);
      }
    }
  }, [config.enabled, config.autoApplyThreshold, config.maxAutoFixesPerRun, isRunning, getPendingFixes, applyFix]);

  // Start/stop auto-heal loop
  useEffect(() => {
    if (config.enabled) {
      console.log('[AutoHeal] Starting auto-heal system...');
      intervalRef.current = setInterval(runAutoHealCycle, config.scanIntervalMs);
      runAutoHealCycle(); // Run immediately
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.enabled, config.scanIntervalMs, runAutoHealCycle]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    getPendingFixes();
  }, [fetchStats, getPendingFixes]);

  return {
    config,
    setConfig,
    stats,
    isRunning,
    lastScan,
    pendingFixes,
    detectIssues,
    generateFix,
    getPendingFixes,
    applyFix,
    fetchStats,
    toggleEnabled: () => setConfig(c => ({ ...c, enabled: !c.enabled }))
  };
}
