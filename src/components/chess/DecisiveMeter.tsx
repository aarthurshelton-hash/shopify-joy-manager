import { Badge } from '@/components/ui/badge';
import { Scale, Swords } from 'lucide-react';
import type { DrawOutlook } from '@/lib/chess/drawishness/drawOutlook';

interface Props {
  outlook: DrawOutlook;
}

/**
 * "Will this position resolve decisively?" — visual verdict for the
 * ambiguous-eval zone where engines say "equal" but the pattern knows better.
 */
export const DecisiveMeter = ({ outlook }: Props) => {
  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
  const decisivePct = outlook.decisiveRate * 100;
  const isHigh = decisivePct >= 75;
  const isLow = decisivePct <= 45;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isHigh ? (
            <Swords className="h-4 w-4 text-red-500" />
          ) : (
            <Scale className="h-4 w-4 text-blue-500" />
          )}
          <span className="font-medium text-sm">
            {isHigh
              ? 'This resolves — someone wins'
              : isLow
                ? 'Expect a drawish grind'
                : 'Coin flip — could go either way'}
          </span>
        </div>
        {outlook.source !== 'baseline' && outlook.sampleSize > 0 && (
          <span className="text-xs text-muted-foreground">
            n={outlook.sampleSize.toLocaleString()}
            {outlook.evalZone === '0-50cp' && ' · equal-eval zone'}
          </span>
        )}
      </div>

      {/* Stacked outcome bar */}
      <div className="h-4 w-full rounded-full overflow-hidden flex">
        <div
          className="bg-zinc-100 dark:bg-zinc-300 transition-all"
          style={{ width: `${outlook.whiteWinRate * 100}%` }}
          title={`White wins ${pct(outlook.whiteWinRate)}`}
        />
        <div
          className="bg-zinc-500/60 transition-all"
          style={{ width: `${outlook.drawRate * 100}%` }}
          title={`Draw ${pct(outlook.drawRate)}`}
        />
        <div
          className="bg-zinc-900 dark:bg-zinc-700 transition-all"
          style={{ width: `${outlook.blackWinRate * 100}%` }}
          title={`Black wins ${pct(outlook.blackWinRate)}`}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>White {pct(outlook.whiteWinRate)}</span>
        <span className="font-medium text-foreground">
          Decisive {pct(outlook.decisiveRate)} · Draw {pct(outlook.drawRate)}
        </span>
        <span>Black {pct(outlook.blackWinRate)}</span>
      </div>

      {outlook.source === 'baseline' && (
        <Badge variant="outline" className="text-[10px]">
          Baseline rates — corpus unavailable
        </Badge>
      )}
    </div>
  );
};
