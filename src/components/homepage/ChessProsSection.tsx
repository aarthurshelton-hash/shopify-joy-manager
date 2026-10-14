import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, TrendingUp, Frame, ChevronRight, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveChessStats } from '@/hooks/useLiveChessStats';

const Feature: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm">
    <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
      {icon}
    </div>
    <h3 className="font-display text-base uppercase tracking-wide">{title}</h3>
    <p className="text-sm text-muted-foreground font-serif leading-relaxed">{children}</p>
  </div>
);

/**
 * Homepage band aimed at chess professionals — leans on the scientific rigor
 * (live prediction edge over Stockfish) to convert the serious audience.
 * The prediction stat is live and data-integrity-safe (blank when calibrating).
 */
export const ChessProsSection: React.FC = () => {
  const { data } = useLiveChessStats();
  const hasLiveEdge = data && data.totalPredictions > 0 && data.epEdge !== 0;

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-display uppercase tracking-widest">
              <FlaskConical className="h-3.5 w-3.5" />
              Built for Chess Professionals
            </div>
            <h2 className="font-royal text-3xl md:text-4xl font-bold uppercase tracking-wide">
              Analysis Meets <span className="text-gold-gradient">Art</span>
            </h2>
            <p className="text-muted-foreground font-serif max-w-2xl mx-auto">
              Every visualization is powered by En Pensent — a path-based prediction engine that matches
              Stockfish 18 on outcome prediction{hasLiveEdge ? (
                <> (<span className="text-foreground font-medium">{data.epEdge >= 0 ? '+' : ''}{data.epEdge.toFixed(2)}pp</span> across {data.totalPredictions.toLocaleString()} resolved predictions)</>
              ) : null}, with its modest gains in balanced, hard-to-evaluate positions.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <Feature icon={<Brain className="h-5 w-5" />} title="Read the Middlegame">
              See where a game truly turned — the balanced, hard-to-evaluate positions where the outcome is least certain.
            </Feature>
            <Feature icon={<TrendingUp className="h-5 w-5" />} title="Measured, Not Claimed">
              Benchmarked continuously against Stockfish 18 and published in full, including where we trail.
            </Feature>
            <Feature icon={<Frame className="h-5 w-5" />} title="Own Your Games">
              Turn your best games into museum-quality art you can hang, share, and collect.
            </Feature>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#make-your-own">
              <Button size="lg" className="group inline-flex items-center gap-2 px-8 rounded-xl font-display uppercase tracking-wider text-sm">
                Analyze Your Game
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </a>
            <Link to="/benchmark">
              <Button variant="outline" size="lg" className="inline-flex items-center gap-2 px-8 rounded-xl font-display uppercase tracking-wider text-sm">
                <TrendingUp className="h-4 w-4" />
                See the Live Benchmark
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChessProsSection;
