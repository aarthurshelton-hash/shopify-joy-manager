import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Target,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
} from 'lucide-react';
import { SimulationResult } from '@/lib/chess/gameSimulator';
import {
  classifyGameArchetype,
  generateArchetypePoetry,
  GameArchetypeClassification,
} from '@/lib/chess/archetypeTemplates';
import { ARCHETYPE_DEFINITIONS } from '@/lib/chess/colorFlowAnalysis/archetypeDefinitions';
import { predictFromColorFlow, getLastEquilibriumScores } from '@/lib/chess/colorFlowAnalysis/predictionEngine';

interface GameInsightsPanelProps {
  simulation: SimulationResult;
  pgn: string;
  className?: string;
}

const WINNER_LABELS: Record<string, string> = {
  white: 'White Favored',
  black: 'Black Favored',
  draw: 'Balanced',
};

const WINNER_COLORS: Record<string, string> = {
  white: 'text-amber-400',
  black: 'text-slate-300',
  draw: 'text-primary',
};

export const GameInsightsPanel: React.FC<GameInsightsPanelProps> = ({
  simulation,
  pgn,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  const insights = useMemo(() => {
    if (!simulation?.board || (simulation.totalMoves ?? 0) < 6) return null;

    try {
      const classification = classifyGameArchetype(simulation);
      if (!classification) return null;

      const poetry = generateArchetypePoetry(classification, pgn);
      const def = ARCHETYPE_DEFINITIONS[classification.template.family] || ARCHETYPE_DEFINITIONS.unknown;

      // Run prediction engine
      let prediction = null;
      let equilibrium = null;
      try {
        prediction = predictFromColorFlow(
          classification.signature,
          simulation.totalMoves,
          0,
          18,
          null,
          undefined,
        );
        equilibrium = getLastEquilibriumScores();
      } catch (e) {
        console.warn('[GameInsightsPanel] Prediction failed:', e);
      }

      return {
        classification,
        poetry,
        definition: def,
        prediction,
        equilibrium,
      };
    } catch (e) {
      console.warn('[GameInsightsPanel] Analysis failed:', e);
      return null;
    }
  }, [simulation, pgn]);

  if (!insights) return null;

  const { classification, poetry, definition, prediction } = insights;
  const winRatePct = Math.round((definition.historicalWinRate || 0.5) * 100);
  const intensityPct = Math.round(classification.intensity || 0);
  const confidencePct = prediction ? Math.round(prediction.confidence) : null;
  const winner = prediction?.predictedWinner || definition.predictedOutcome.replace('_favored', '') as 'white' | 'black' | 'draw';
  const criticalMoments = classification.signature.criticalMoments || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border border-primary/20 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-display font-bold uppercase tracking-wider text-foreground">
                {classification.archetypeName}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-primary/80 font-medium px-2 py-0.5 rounded-full bg-primary/10">
                {poetry.mood}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-serif italic">
              {definition.description}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        )}
      </button>

      {/* Quick stats row — always visible */}
      <div className="flex items-center gap-4 px-4 pb-3 flex-wrap">
        {/* Prediction */}
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs text-muted-foreground">Prediction:</span>
          <span className={`text-xs font-bold ${WINNER_COLORS[winner] || 'text-primary'}`}>
            {WINNER_LABELS[winner] || 'Balanced'}
          </span>
          {confidencePct !== null && (
            <span className="text-[10px] text-muted-foreground/70">({confidencePct}% conf.)</span>
          )}
        </div>

        {/* Win rate */}
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs text-muted-foreground">Pattern win rate:</span>
          <span className="text-xs font-bold text-foreground">{winRatePct}%</span>
        </div>

        {/* Intensity */}
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs text-muted-foreground">Intensity:</span>
          <span className="text-xs font-bold text-foreground">{intensityPct}</span>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="p-4 space-y-4">
              {/* Poetry */}
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display font-bold mb-1">
                    {poetry.style}
                  </p>
                  <p className="text-sm font-serif italic text-foreground/90 leading-relaxed whitespace-pre-line">
                    {poetry.poem}
                  </p>
                </div>
              </div>

              {/* Strategic Guidance */}
              {prediction?.strategicGuidance && prediction.strategicGuidance.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <Zap className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display font-bold mb-1">
                      Strategic Reading
                    </p>
                    <ul className="space-y-1">
                      {prediction.strategicGuidance.slice(0, 3).map((guidance, i) => (
                        <li key={i} className="text-xs text-foreground/80 font-serif leading-relaxed">
                          {guidance}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Critical Moments */}
              {criticalMoments.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <Eye className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display font-bold mb-1">
                      Critical Moments
                    </p>
                    <div className="space-y-1.5">
                      {criticalMoments.slice(0, 4).map((moment, i) => (
                        <div key={i} className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-primary tabular-nums">
                            M{moment.moveNumber}
                          </span>
                          <span className="text-xs text-foreground/70 font-serif">
                            {moment.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quadrant Profile */}
              {classification.signature.quadrantProfile && (
                <div className="flex items-start gap-2.5">
                  <Target className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display font-bold mb-1">
                      Territorial Balance
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[
                        ['Kingside White', classification.signature.quadrantProfile.kingsideWhite],
                        ['Kingside Black', classification.signature.quadrantProfile.kingsideBlack],
                        ['Queenside White', classification.signature.quadrantProfile.queensideWhite],
                        ['Queenside Black', classification.signature.quadrantProfile.queensideBlack],
                        ['Center', classification.signature.quadrantProfile.center],
                      ].map(([label, value]) => {
                        const v = value as number;
                        const display = v > 0 ? `+${v.toFixed(0)}` : v.toFixed(0);
                        const color = v > 20 ? 'text-amber-400' : v < -20 ? 'text-slate-300' : 'text-muted-foreground';
                        return (
                          <div key={label as string} className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">{label}</span>
                            <span className={`text-[11px] font-mono font-bold ${color}`}>{display}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Fingerprint */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono">
                  Fingerprint: {classification.fingerprint.slice(0, 16)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GameInsightsPanel;
