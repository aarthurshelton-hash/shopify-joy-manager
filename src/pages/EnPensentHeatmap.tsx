/**
 * En Pensent Live Market Heatmap
 * CEO-only — treemap by sector, color-coded by direction + confidence.
 * BLACK = BUY (bullish), WHITE = SELL (bearish) — chess-market invariant.
 * Refreshes every 30 seconds. Source: market_prediction_attempts (latest unresolved per symbol).
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

// ── SECTOR CONFIG — matches market-prediction-worker.mjs ──────────────────────
const SECTOR_MAP: Record<string, string> = {
  AMD: 'Tech', NVDA: 'Tech', MSFT: 'Tech', GOOGL: 'Tech',
  META: 'Tech', AMZN: 'Tech', AAPL: 'Tech', TSLA: 'Tech',
  SPY: 'Indices', QQQ: 'Indices',
  'GC=F': 'Metals', 'SI=F': 'Metals', 'HG=F': 'Metals',
  'PL=F': 'Metals', 'PA=F': 'Metals', SLV: 'Metals',
  'CL=F': 'Energy', 'NG=F': 'Energy', USO: 'Energy',
};

const SECTOR_ORDER = ['Tech', 'Metals', 'Energy', 'Indices', 'Other'];

const SECTOR_COLORS: Record<string, string> = {
  Tech:    '#1e3a5f',
  Metals:  '#3d2b1f',
  Energy:  '#1f3d2b',
  Indices: '#2b1f3d',
  Other:   '#2a2a2a',
};

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Signal {
  id: string;
  symbol: string;
  predicted_direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  archetype: string;
  time_horizon: string;
  created_at: string;
  resolved_at: string | null;
  ep_correct: boolean | null;
}

interface CellData {
  symbol: string;
  sector: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  archetype: string;
  timeHorizon: string;
  ageMinutes: number;
  resolved: boolean;
  correct: boolean | null;
}

// ── COLOR LOGIC ────────────────────────────────────────────────────────────────
// Bullish (black=BUY) → green scale. Bearish (white=SELL) → red scale.
function getSignalColor(direction: string, confidence: number, resolved: boolean, correct: boolean | null): string {
  if (resolved) {
    if (correct === true)  return 'rgba(16, 185, 129, 0.35)';  // resolved correct = dim green
    if (correct === false) return 'rgba(239, 68, 68, 0.35)';   // resolved wrong   = dim red
    return 'rgba(100, 100, 100, 0.4)';                          // neutral
  }
  const intensity = 0.3 + (confidence / 100) * 0.7;
  if (direction === 'bullish') {
    const g = Math.round(120 + (confidence / 100) * 135);
    const r = Math.round(20 + (confidence / 100) * 30);
    return `rgba(${r}, ${g}, 60, ${intensity})`;
  }
  if (direction === 'bearish') {
    const r = Math.round(160 + (confidence / 100) * 95);
    const g = Math.round(20 + (100 - confidence) / 100 * 50);
    return `rgba(${r}, ${g}, 40, ${intensity})`;
  }
  return 'rgba(80, 80, 80, 0.5)';
}

function getBorderColor(direction: string, confidence: number): string {
  if (direction === 'bullish') return confidence >= 85 ? '#4ade80' : confidence >= 70 ? '#22c55e' : '#16a34a';
  if (direction === 'bearish') return confidence >= 85 ? '#f87171' : confidence >= 70 ? '#ef4444' : '#dc2626';
  return '#555';
}

// ── QUERY ─────────────────────────────────────────────────────────────────────
const REFRESH_MS = 30_000;
const LOOKBACK_H = 4; // look at last 4 hours of predictions

async function fetchLatestSignals(): Promise<CellData[]> {
  const since = new Date(Date.now() - LOOKBACK_H * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('market_prediction_attempts')
    .select('id, symbol, predicted_direction, confidence, archetype, time_horizon, created_at, resolved_at, ep_correct')
    .gte('created_at', since)
    .not('predicted_direction', 'eq', 'neutral')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Keep highest-confidence unresolved signal per symbol, fallback to any latest
  const bySymbol = new Map<string, Signal>();
  for (const row of data as Signal[]) {
    const existing = bySymbol.get(row.symbol);
    if (!existing) {
      bySymbol.set(row.symbol, row);
    } else {
      const existingUnresolved = !existing.resolved_at;
      const newUnresolved = !row.resolved_at;
      // Prefer unresolved; among same resolved-state prefer higher confidence
      if (newUnresolved && !existingUnresolved) {
        bySymbol.set(row.symbol, row);
      } else if (newUnresolved === existingUnresolved && row.confidence > existing.confidence) {
        bySymbol.set(row.symbol, row);
      }
    }
  }

  const now = Date.now();
  return Array.from(bySymbol.values()).map(s => ({
    symbol: s.symbol,
    sector: SECTOR_MAP[s.symbol] || 'Other',
    direction: s.predicted_direction,
    confidence: s.confidence,
    archetype: s.archetype || '—',
    timeHorizon: s.time_horizon,
    ageMinutes: Math.round((now - new Date(s.created_at).getTime()) / 60000),
    resolved: !!s.resolved_at,
    correct: s.ep_correct,
  }));
}

// ── CELL COMPONENT ────────────────────────────────────────────────────────────
function HeatCell({ cell, size }: { cell: CellData; size: 'lg' | 'md' | 'sm' }) {
  const bg    = getSignalColor(cell.direction, cell.confidence, cell.resolved, cell.correct);
  const border = getBorderColor(cell.direction, cell.confidence);
  const isBull = cell.direction === 'bullish';
  const isBear = cell.direction === 'bearish';

  const confBand =
    cell.confidence >= 85 ? 'font-bold' :
    cell.confidence >= 70 ? 'font-semibold' : 'font-normal';

  return (
    <div
      className="relative flex flex-col items-center justify-center rounded overflow-hidden transition-all duration-300 hover:scale-105 hover:z-10 cursor-default select-none group"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: cell.confidence >= 85
          ? `0 0 12px ${border}55, inset 0 0 8px ${border}22`
          : `0 0 4px ${border}33`,
      }}
    >
      {/* Confidence bar at bottom */}
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
        style={{
          width: `${cell.confidence}%`,
          background: isBull ? '#4ade80' : isBear ? '#f87171' : '#888',
          opacity: 0.8,
        }}
      />

      {size === 'lg' && (
        <div className="p-2 text-center w-full">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            {isBull && <TrendingUp size={12} className="text-green-400" />}
            {isBear && <TrendingDown size={12} className="text-red-400" />}
            <span className={`text-xs text-gray-300 ${confBand}`}>
              {cell.symbol}
            </span>
          </div>
          <div className={`text-lg ${confBand} ${isBull ? 'text-green-300' : isBear ? 'text-red-300' : 'text-gray-400'}`}>
            {cell.confidence}%
          </div>
          <div className="text-[10px] text-gray-500 truncate max-w-full px-1 leading-tight">
            {cell.archetype.replace(/_/g, ' ')}
          </div>
          <div className="text-[10px] text-gray-600">{cell.timeHorizon} · {cell.ageMinutes}m</div>
        </div>
      )}

      {size === 'md' && (
        <div className="p-1.5 text-center">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            {isBull && <TrendingUp size={10} className="text-green-400" />}
            {isBear && <TrendingDown size={10} className="text-red-400" />}
            <span className="text-[11px] text-gray-300 font-medium">{cell.symbol}</span>
          </div>
          <div className={`text-base ${confBand} ${isBull ? 'text-green-300' : isBear ? 'text-red-300' : 'text-gray-400'}`}>
            {cell.confidence}%
          </div>
          <div className="text-[9px] text-gray-500">{cell.timeHorizon}</div>
        </div>
      )}

      {size === 'sm' && (
        <div className="p-1 text-center">
          <div className="text-[10px] text-gray-400 font-medium leading-tight">{cell.symbol}</div>
          <div className={`text-sm font-bold ${isBull ? 'text-green-300' : isBear ? 'text-red-300' : 'text-gray-400'}`}>
            {cell.confidence}%
          </div>
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-[11px] text-white whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
        <div className="font-bold">{cell.symbol} · {cell.timeHorizon}</div>
        <div className={isBull ? 'text-green-400' : isBear ? 'text-red-400' : 'text-gray-400'}>
          {cell.direction} {cell.confidence}%
        </div>
        <div className="text-gray-400">{cell.archetype.replace(/_/g, ' ')}</div>
        <div className="text-gray-500">{cell.ageMinutes}m ago · {cell.resolved ? (cell.correct === true ? '✅ correct' : cell.correct === false ? '❌ wrong' : '⏳ neutral') : '⏳ open'}</div>
      </div>
    </div>
  );
}

// ── SECTOR BLOCK ──────────────────────────────────────────────────────────────
function SectorBlock({ sector, cells }: { sector: string; cells: CellData[] }) {
  const bullCount = cells.filter(c => c.direction === 'bullish').length;
  const bearCount = cells.filter(c => c.direction === 'bearish').length;
  const avgConf   = Math.round(cells.reduce((a, c) => a + c.confidence, 0) / cells.length);
  const bias = bullCount > bearCount ? 'bullish' : bearCount > bullCount ? 'bearish' : 'neutral';

  // Determine cell size based on count
  const cellSize: 'lg' | 'md' | 'sm' =
    cells.length <= 2 ? 'lg' : cells.length <= 5 ? 'md' : 'sm';

  const sortedCells = [...cells].sort((a, b) => b.confidence - a.confidence);

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{ background: SECTOR_COLORS[sector] || SECTOR_COLORS.Other }}
    >
      {/* Sector header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{sector}</span>
          <span className="text-[10px] text-gray-500">n={cells.length}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {bullCount > 0 && <span className="text-green-400">▲{bullCount}</span>}
          {bearCount > 0 && <span className="text-red-400">▼{bearCount}</span>}
          <span className={`font-medium ${bias === 'bullish' ? 'text-green-300' : bias === 'bearish' ? 'text-red-300' : 'text-gray-400'}`}>
            avg {avgConf}%
          </span>
        </div>
      </div>

      {/* Cells grid */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: cells.length <= 2
            ? `repeat(${cells.length}, 1fr)`
            : cells.length <= 4
              ? 'repeat(2, 1fr)'
              : 'repeat(3, 1fr)',
        }}
      >
        {sortedCells.map(cell => (
          <div
            key={cell.symbol}
            style={{ aspectRatio: cellSize === 'sm' ? '1' : '1.2 / 1' }}
          >
            <HeatCell cell={cell} size={cellSize} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── STATS BAR ─────────────────────────────────────────────────────────────────
function StatsBar({ cells, lastUpdated, refreshing, onRefresh }: {
  cells: CellData[];
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const total   = cells.length;
  const bullish = cells.filter(c => c.direction === 'bullish').length;
  const bearish = cells.filter(c => c.direction === 'bearish').length;
  const highConf = cells.filter(c => c.confidence >= 85).length;
  const open    = cells.filter(c => !c.resolved).length;

  return (
    <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 mb-4">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="text-emerald-400" />
          <span className="text-gray-400">Live:</span>
          <span className="text-white font-semibold">{total} signals</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={13} className="text-green-400" />
          <span className="text-green-400 font-semibold">{bullish}</span>
          <span className="text-gray-600 mx-1">·</span>
          <TrendingDown size={13} className="text-red-400" />
          <span className="text-red-400 font-semibold">{bearish}</span>
        </div>
        <div className="text-gray-400 text-xs">
          <span className="text-yellow-400 font-medium">{highConf}</span> high-conf
          <span className="mx-1.5 text-gray-700">·</span>
          <span className="text-gray-400">{open} open</span>
        </div>
        <div className="hidden md:block text-[11px] text-gray-600">
          lookback {LOOKBACK_H}h · refresh {REFRESH_MS / 1000}s
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Clock size={11} />
            {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded transition-colors"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Updating…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

// ── LEGEND ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex items-center gap-6 text-[11px] text-gray-500 mb-4 px-1">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded" style={{ background: 'rgba(30, 185, 90, 0.8)', border: '1px solid #4ade80' }} />
        <span>Bullish ♟ (black = BUY)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded" style={{ background: 'rgba(220, 40, 40, 0.8)', border: '1px solid #f87171' }} />
        <span>Bearish ♙ (white = SELL)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-12 h-1.5 rounded" style={{ background: 'linear-gradient(to right, rgba(30,185,90,0.3), rgba(30,185,90,0.9))' }} />
        <span>Confidence →</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded opacity-40" style={{ background: 'rgba(16, 185, 129, 0.35)', border: '1px solid #10b981' }} />
        <span>Resolved</span>
      </div>
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-600">
      {loading ? (
        <>
          <Activity size={32} className="animate-pulse mb-3 text-gray-700" />
          <p className="text-sm">Loading signals…</p>
        </>
      ) : (
        <>
          <Activity size={32} className="mb-3 text-gray-700" />
          <p className="text-sm">No signals in the last {LOOKBACK_H} hours</p>
          <p className="text-xs mt-1">Market may be closed. Commodities trade 24/5.</p>
        </>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
function HeatmapContent() {
  const [cells, setCells]         = useState<CellData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const data = await fetchLatestSignals();
      setCells(data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => load(), REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  // Group by sector, respect SECTOR_ORDER
  const bySector = new Map<string, CellData[]>();
  for (const cell of cells) {
    if (!bySector.has(cell.sector)) bySector.set(cell.sector, []);
    bySector.get(cell.sector)!.push(cell);
  }

  const sectors = SECTOR_ORDER.filter(s => bySector.has(s));

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-4 md:p-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl font-black tracking-tight text-white">
            En Pensent
          </span>
          <span className="text-sm font-light text-gray-500 tracking-widest uppercase">
            Live Signal Heatmap
          </span>
          {!loading && cells.length > 0 && (
            <span className="flex items-center gap-1 text-xs bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600">
          Multi-timeframe EN PENSENT predictions · color = direction + confidence · size = recent activity
        </p>
      </div>

      <StatsBar cells={cells} lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={() => load(true)} />
      <Legend />

      {loading && cells.length === 0 ? (
        <EmptyState loading={true} />
      ) : cells.length === 0 ? (
        <EmptyState loading={false} />
      ) : (
        <div className="grid gap-4" style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}>
          {sectors.map(sector => (
            <SectorBlock
              key={sector}
              sector={sector}
              cells={bySector.get(sector)!}
            />
          ))}
        </div>
      )}

      {/* Time horizon breakdown */}
      {cells.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {['1h', '2h', '8h', '1d'].map(h => {
            const hCells = cells.filter(c => c.timeHorizon === h);
            if (!hCells.length) return null;
            const bull = hCells.filter(c => c.direction === 'bullish').length;
            const bear = hCells.filter(c => c.direction === 'bearish').length;
            const avg  = Math.round(hCells.reduce((a, c) => a + c.confidence, 0) / hCells.length);
            const bias = bull > bear ? 'bull' : bear > bull ? 'bear' : 'neutral';
            return (
              <div key={h} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs">
                <div className="font-bold text-gray-300 mb-1.5">{h} horizon</div>
                <div className="flex justify-between text-gray-500">
                  <span>n={hCells.length}</span>
                  <span className={bias === 'bull' ? 'text-green-400' : bias === 'bear' ? 'text-red-400' : 'text-gray-400'}>
                    ▲{bull} ▼{bear}
                  </span>
                  <span className="text-gray-400">avg {avg}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EnPensentHeatmapPage() {
  return (
    <AdminRoute featureName="Market Heatmap">
      <HeatmapContent />
    </AdminRoute>
  );
}
