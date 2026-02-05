/**
 * Data Authenticity & Bias Detection System
 * v8.2-AUDIT: Comprehensive audit of chess benchmark data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Database, Shield } from 'lucide-react';

interface AuditResult {
  totalRecords: number;
  sources: Record<string, number>;
  duplicates: string[];
  suspiciousRecords: string[];
  avgStockfishDepth: number;
  avgHybridConfidence: number;
  biases: BiasReport;
}

interface BiasReport {
  sourceDistribution: Record<string, number>;
  eloRangeDistribution: Record<string, number>;
  timeControlBias: Record<string, number>;
  resultBias: Record<string, number>;
  concerns: string[];
}

/**
 * Audit all chess_prediction_attempts for authenticity and bias
 */
export async function runDataAudit(): Promise<AuditResult> {
  console.log('[AUDIT v8.2] Starting comprehensive data audit...');
  
  const result: AuditResult = {
    totalRecords: 0,
    sources: {},
    duplicates: [],
    suspiciousRecords: [],
    avgStockfishDepth: 0,
    avgHybridConfidence: 0,
    biases: {
      sourceDistribution: {},
      eloRangeDistribution: {},
      timeControlBias: {},
      resultBias: {},
      concerns: []
    }
  };
  
  try {
    // Fetch all records for analysis
    const { data: records, error } = await supabase
      .from('chess_prediction_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000); // Analyze last 5000 records
    
    if (error) throw error;
    if (!records) return result;
    
    result.totalRecords = records.length;
    console.log(`[AUDIT] Analyzing ${records.length} records`);
    
    const seenGameIds = new Set<string>();
    const duplicateIds: string[] = [];
    let totalDepth = 0;
    let totalConfidence = 0;
    
    // Analyze each record
    for (const record of records) {
      // Source counting
      const source = record.data_source || 'unknown';
      result.sources[source] = (result.sources[source] || 0) + 1;
      
      // Duplicate detection
      const rawId = record.game_id?.replace(/^(li_|cc_|term_|puz_|ccp_)/, '');
      if (rawId) {
        if (seenGameIds.has(rawId)) {
          duplicateIds.push(record.game_id);
        } else {
          seenGameIds.add(rawId);
        }
      }
      
      // Suspicious data checks
      if (record.stockfish_depth < 20) {
        result.suspiciousRecords.push(`Low depth: ${record.game_id} (${record.stockfish_depth})`);
      }
      if (record.hybrid_confidence > 1 || record.hybrid_confidence < 0) {
        result.suspiciousRecords.push(`Invalid confidence: ${record.game_id}`);
      }
      if (!record.data_source) {
        result.suspiciousRecords.push(`Missing source: ${record.game_id}`);
      }
      
      // Aggregate stats
      totalDepth += record.stockfish_depth || 0;
      totalConfidence += record.hybrid_confidence || 0;
      
      // ELO range distribution
      const avgElo = ((record.white_elo || 1500) + (record.black_elo || 1500)) / 2;
      const eloRange = avgElo < 1500 ? '<1500' : avgElo < 2000 ? '1500-2000' : avgElo < 2500 ? '2000-2500' : '2500+';
      result.biases.eloRangeDistribution[eloRange] = (result.biases.eloRangeDistribution[eloRange] || 0) + 1;
      
      // Result bias
      const outcome = record.hybrid_correct ? (record.stockfish_correct ? 'both_correct' : 'hybrid_wins') : (record.stockfish_correct ? 'stockfish_wins' : 'both_wrong');
      result.biases.resultBias[outcome] = (result.biases.resultBias[outcome] || 0) + 1;
    }
    
    result.duplicates = duplicateIds;
    result.avgStockfishDepth = totalDepth / records.length;
    result.avgHybridConfidence = totalConfidence / records.length;
    result.biases.sourceDistribution = result.sources;
    
    // Calculate bias concerns
    const total = records.length;
    
    // Check source bias (>60% from one source)
    for (const [source, count] of Object.entries(result.sources)) {
      const pct = (count / total) * 100;
      if (pct > 60) {
        result.biases.concerns.push(`⚠️ Heavy bias toward ${source}: ${pct.toFixed(1)}% of data`);
      }
    }
    
    // Check ELO bias (all games same range)
    for (const [range, count] of Object.entries(result.biases.eloRangeDistribution)) {
      const pct = (count / total) * 100;
      if (pct > 50) {
        result.biases.concerns.push(`⚠️ ELO concentration in ${range}: ${pct.toFixed(1)}%`);
      }
    }
    
    // Check result bias (EP always winning or losing)
    const hybridWins = result.biases.resultBias['hybrid_wins'] || 0;
    const hybridWinPct = (hybridWins / total) * 100;
    if (hybridWinPct > 40) {
      result.biases.concerns.push(`⚠️ Unusually high EP wins: ${hybridWinPct.toFixed(1)}%`);
    }
    
    console.log('[AUDIT] Complete:', {
      total: result.totalRecords,
      duplicates: result.duplicates.length,
      suspicious: result.suspiciousRecords.length,
      concerns: result.biases.concerns.length
    });
    
    return result;
    
  } catch (error) {
    console.error('[AUDIT] Error:', error);
    throw error;
  }
}

/**
 * React component for displaying audit results
 */
export function DataAuditDashboard() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    runDataAudit()
      .then(result => {
        setAudit(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="p-4">Running data audit...</div>;
  if (error) return <div className="p-4 text-red-500">Audit failed: {error}</div>;
  if (!audit) return null;
  
  const isHealthy = audit.duplicates.length === 0 && audit.suspiciousRecords.length === 0 && audit.biases.concerns.length === 0;
  
  return (
    <div className="space-y-4">
      <Card className={isHealthy ? 'border-green-500/50' : 'border-yellow-500/50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isHealthy ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            Data Authenticity Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{audit.totalRecords.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Records Analyzed</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-green-500">{audit.avgStockfishDepth.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Avg SF Depth</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{(audit.avgHybridConfidence * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Avg EP Confidence</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className={`text-2xl font-bold ${audit.duplicates.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {audit.duplicates.length}
              </p>
              <p className="text-xs text-muted-foreground">Duplicates Found</p>
            </div>
          </div>
          
          {/* Source Distribution */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" /> Source Distribution
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(audit.sources).map(([source, count]) => {
                const pct = ((count / audit.totalRecords) * 100).toFixed(1);
                const isBiased = parseFloat(pct) > 60;
                return (
                  <Badge key={source} variant={isBiased ? 'destructive' : 'secondary'}>
                    {source}: {count} ({pct}%)
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {/* ELO Distribution */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">ELO Range Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(audit.biases.eloRangeDistribution).map(([range, count]) => {
                const pct = ((count / audit.totalRecords) * 100).toFixed(1);
                return (
                  <Badge key={range} variant="outline">{range}: {pct}%</Badge>
                );
              })}
            </div>
          </div>
          
          {/* Concerns */}
          {audit.biases.concerns.length > 0 && (
            <div className="space-y-2 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/50">
              <h4 className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" /> Bias Concerns
              </h4>
              <ul className="space-y-1 text-sm">
                {audit.biases.concerns.map((concern, i) => (
                  <li key={i}>{concern}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Suspicious Records */}
          {audit.suspiciousRecords.length > 0 && (
            <div className="space-y-2 p-4 bg-red-500/10 rounded-lg border border-red-500/50">
              <h4 className="text-sm font-medium flex items-center gap-2 text-red-600">
                <Shield className="h-4 w-4" /> Suspicious Records ({audit.suspiciousRecords.length})
              </h4>
              <ul className="space-y-1 text-xs font-mono max-h-32 overflow-y-auto">
                {audit.suspiciousRecords.slice(0, 10).map((record, i) => (
                  <li key={i}>{record}</li>
                ))}
                {audit.suspiciousRecords.length > 10 && (
                  <li className="text-muted-foreground">...and {audit.suspiciousRecords.length - 10} more</li>
                )}
              </ul>
            </div>
          )}
          
          {/* Duplicates */}
          {audit.duplicates.length > 0 && (
            <div className="space-y-2 p-4 bg-orange-500/10 rounded-lg border border-orange-500/50">
              <h4 className="text-sm font-medium text-orange-600">
                Duplicate Game IDs ({audit.duplicates.length})
              </h4>
              <p className="text-xs text-muted-foreground">
                These games were analyzed multiple times (should not happen with dedup)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
