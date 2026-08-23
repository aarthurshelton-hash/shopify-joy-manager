/**
 * LiveSignals — Free public market signals page
 *
 * Shows live En Pensent prediction cards for all tracked symbols.
 * Each card displays:
 * - Direction (CALL/PUT) with calibrated conviction
 * - 8×8 Universal Grid (market flow as chess board)
 * - Archetype story + parable
 * - Signal drivers (VIX, chess consensus, short volume, overnight sentiment)
 *
 * Also includes:
 * - Market regime banner (VIX term structure)
 * - Overnight sentiment summary
 * - Per-symbol accuracy stats
 * - Sector grouping
 *
 * FREE FOR NOW — no auth required.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SignalCard from '@/components/market/SignalCard';

// ── Symbol Universe ───────────────────────────────────────────────────────────

const SYMBOLS = [
  // Indices
  { sym: 'SPY',  name: 'S&P 500',       sector: 'Indices',       emoji: '📊', group: 'indices' },
  { sym: 'QQQ',  name: 'NASDAQ 100',    sector: 'Indices',       emoji: '💻', group: 'indices' },
  { sym: 'IWM',  name: 'Russell 2000',  sector: 'Indices',       emoji: '🏭', group: 'indices' },
  // Tech
  { sym: 'AMD',  name: 'AMD',           sector: 'Technology',    emoji: '🔴', group: 'tech' },
  { sym: 'NVDA', name: 'NVIDIA',        sector: 'Technology',    emoji: '🟢', group: 'tech' },
  { sym: 'MSFT', name: 'Microsoft',     sector: 'Technology',    emoji: '🪟', group: 'tech' },
  { sym: 'META', name: 'Meta',          sector: 'Technology',    emoji: '👁', group: 'tech' },
  { sym: 'GOOGL',name: 'Google',        sector: 'Technology',    emoji: '🔵', group: 'tech' },
  { sym: 'AMZN', name: 'Amazon',        sector: 'Technology',    emoji: '📦', group: 'tech' },
  // Commodities
  { sym: 'GC=F', name: 'Gold',          sector: 'Commodities',   emoji: '🥇', group: 'commodities' },
  { sym: 'SI=F', name: 'Silver',        sector: 'Commodities',   emoji: '🥈', group: 'commodities' },
  { sym: 'CL=F', name: 'Crude Oil',     sector: 'Energy',        emoji: '🛢', group: 'commodities' },
  { sym: 'GLD',  name: 'Gold ETF',      sector: 'Commodities',   emoji: '💰', group: 'commodities' },
  { sym: 'USO',  name: 'Oil ETF',       sector: 'Energy',        emoji: '⛽', group: 'commodities' },
  // Sector ETFs
  { sym: 'XLK',  name: 'Tech Sector',   sector: 'Sector ETF',    emoji: '🔧', group: 'sectors' },
  { sym: 'XLF',  name: 'Financials',    sector: 'Sector ETF',    emoji: '🏦', group: 'sectors' },
  { sym: 'XLE',  name: 'Energy Sector', sector: 'Sector ETF',    emoji: '⚡', group: 'sectors' },
  { sym: 'XLV',  name: 'Healthcare',    sector: 'Sector ETF',    emoji: '⚕️', group: 'sectors' },
  // International ADRs
  { sym: 'TSM',  name: 'TSMC ADR',      sector: 'International', emoji: '🇹🇼', group: 'intl' },
  { sym: 'ASML', name: 'ASML ADR',      sector: 'International', emoji: '🇳🇱', group: 'intl' },
  { sym: 'BABA', name: 'Alibaba ADR',   sector: 'International', emoji: '🇨🇳', group: 'intl' },
];

const GROUP_LABELS: Record<string, string> = {
  indices: 'Indices',
  tech: 'Technology',
  commodities: 'Commodities & Energy',
  sectors: 'Sector ETFs',
  intl: 'International (ADRs)',
};

const GROUP_ORDER = ['indices', 'tech', 'commodities', 'sectors', 'intl'];

// ── Market Regime Banner ──────────────────────────────────────────────────────

interface RegimeData {
  vix: number;
  regime: string;
  vixLevel: string;
  slope: number;
}

const RegimeBanner: React.FC = () => {
  const [regime, setRegime] = useState<RegimeData | null>(null);

  useEffect(() => {
    // VIX term structure is stored in prediction metadata — extract from latest SPY prediction
    const fetchRegime = async () => {
      const { data } = await supabase
        .from('market_signals_public')
        .select('prediction_metadata')
        .eq('symbol', 'SPY')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data?.[0]?.prediction_metadata?.vix_term_structure) {
        const v = data[0].prediction_metadata.vix_term_structure;
        setRegime({
          vix: v.vix_spot,
          regime: v.regime,
          vixLevel: v.vix_level,
          slope: v.slope,
        });
      }
    };
    fetchRegime();
    const interval = setInterval(fetchRegime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!regime) return null;

  const regimeColor: Record<string, string> = {
    contango_steep: 'text-emerald-400',
    contango: 'text-emerald-400',
    flat: 'text-amber-400',
    backwardation: 'text-rose-400',
    backwardation_steep: 'text-rose-500',
  };

  const regimeLabel: Record<string, string> = {
    contango_steep: 'CALM — STEEP CONTANGO',
    contango: 'CALM — CONTANGO',
    flat: 'TRANSITIONAL',
    backwardation: 'STRESS — BACKWARDATION',
    backwardation_steep: 'CRISIS — STEEP BACKWARDATION',
  };

  return (
    <div className="flex items-center justify-center gap-4 py-3 px-4 rounded-lg bg-card/40 border border-border/30">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">VIX {regime.vix.toFixed(1)}</span>
      </div>
      <div className="w-px h-4 bg-border/40" />
      <div className={`text-sm font-bold ${regimeColor[regime.regime] || 'text-muted-foreground'}`}>
        {regimeLabel[regime.regime] || regime.regime.toUpperCase()}
      </div>
      <div className="w-px h-4 bg-border/40" />
      <div className="text-xs text-muted-foreground">
        Slope: {(regime.slope * 100).toFixed(1)}%
      </div>
    </div>
  );
};

// ── Overnight Sentiment Banner ────────────────────────────────────────────────

interface SentimentData {
  score: number;
  direction: string;
  markets: { name: string; change: number; archetype: string }[];
}

const SentimentBanner: React.FC = () => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      const { data } = await supabase
        .from('market_signals_public')
        .select('prediction_metadata')
        .eq('symbol', 'SPY')
        .order('created_at', { ascending: false })
        .limit(1);

      const s = data?.[0]?.prediction_metadata?.overnight_sentiment;
      if (s) {
        setSentiment({
          score: s.combined_score,
          direction: s.us_direction,
          markets: s.markets?.map((m: any) => ({
            name: m.name,
            change: m.change_1d,
            archetype: m.archetype,
          })) || [],
        });
      }
    };
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!sentiment || sentiment.markets.length === 0) return null;

  return (
    <div className="flex items-center gap-3 py-2 px-4 rounded-lg bg-card/30 border border-border/20 flex-wrap">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Overnight</span>
      </div>
      {sentiment.markets.map((m, i) => (
        <div key={i} className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">{m.name}</span>
          <span className={m.change > 0 ? 'text-emerald-400' : m.change < 0 ? 'text-rose-400' : 'text-muted-foreground'}>
            {m.change > 0 ? '+' : ''}{m.change.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Accuracy Stats ────────────────────────────────────────────────────────────

interface SymbolStat {
  symbol: string;
  accuracy_pct: number;
  total_predictions: number;
}

const AccuracySummary: React.FC = () => {
  const [stats, setStats] = useState<SymbolStat[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('market_signal_stats')
        .select('symbol, accuracy_pct, total_predictions')
        .order('total_predictions', { ascending: false });

      if (data) setStats(data as SymbolStat[]);
    };
    fetchStats();
  }, []);

  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {stats.map((s) => (
        <div key={s.symbol} className="text-xs px-2 py-1 rounded-md bg-card/40 border border-border/20">
          <span className="font-semibold">{s.symbol}</span>
          <span className="text-muted-foreground">: </span>
          <span className={s.accuracy_pct >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
            {s.accuracy_pct.toFixed(0)}%
          </span>
          <span className="text-muted-foreground"> (n={s.total_predictions})</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const LiveSignals: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    setLastRefresh(new Date());
    const interval = setInterval(() => setLastRefresh(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="text-primary">En Pensent</span>{' '}
              <span className="text-muted-foreground">Live Signals</span>
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Real-time market predictions powered by the Universal 8×8 Grid.
            Chess-market bridge architecture with calibrated confidence.
            <span className="text-primary/80 font-semibold"> Free during beta.</span>
          </p>
        </motion.div>

        {/* Regime + Sentiment Banners */}
        <div className="flex flex-col gap-2 mb-4 max-w-3xl mx-auto">
          <RegimeBanner />
          <SentimentBanner />
        </div>

        {/* Accuracy Summary */}
        <div className="mb-6">
          <AccuracySummary />
        </div>

        {/* Last Refresh */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
          <RefreshCw className="w-3 h-3 animate-spin-slow" />
          {lastRefresh ? `Last refresh: ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
        </div>
      </div>

      {/* Signal Cards by Group */}
      <div className="container mx-auto px-4 pb-12">
        {GROUP_ORDER.map((group) => {
          const groupSymbols = SYMBOLS.filter(s => s.group === group);
          if (groupSymbols.length === 0) return null;

          return (
            <div key={group} className="mb-8">
              <h2 className="text-lg font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" />
                {GROUP_LABELS[group]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupSymbols.map((s) => (
                  <SignalCard
                    key={s.sym}
                    symbol={s.sym}
                    name={s.name}
                    sector={s.sector}
                    emoji={s.emoji}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 pb-8 text-center">
        <div className="text-xs text-muted-foreground max-w-2xl mx-auto">
          <p className="mb-2">
            <span className="text-primary font-semibold">BLACK = BUY</span> (bullish) ·{' '}
            <span className="text-rose-400 font-semibold">WHITE = SELL</span> (bearish)
          </p>
          <p>
            Predictions are generated by the En Pensent Universal Grid — the same 8×8 color-flow
            system that predicts chess outcomes. Confidence is calibrated via isotonic regression
            to reflect actual outcome probability. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveSignals;
