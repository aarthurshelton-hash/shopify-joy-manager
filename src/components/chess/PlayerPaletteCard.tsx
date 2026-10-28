import { colorPalettes, type ColorPalette, type PaletteId, type PieceType } from '@/lib/chess/pieceColors';
import type { GameTraits } from '@/lib/chess/gamePalette';
import { paletteThumbs } from '@/lib/palettes/paletteBackgrounds';

const PIECES: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

export interface JourneyStep {
  label: string;
  paletteId: PaletteId;
}

interface PlayerPaletteCardProps {
  name: string;
  side?: 'White' | 'Black';
  paletteId: PaletteId;
  style?: GameTraits;
  games?: number;
  why?: string;
  journey?: JourneyStep[];
  signature?: ColorPalette;
}

const BARS: { key: keyof GameTraits; label: string; low: string; high: string }[] = [
  { key: 'energy', label: 'Energy', low: 'calm', high: 'aggressive' },
  { key: 'texture', label: 'Texture', low: 'pieces', high: 'pawns' },
  { key: 'length', label: 'Length', low: 'quick', high: 'marathon' },
];

/** Who a player is in colour, and why: palette, style bars, explanation and palette journey. */
export function PlayerPaletteCard({ name, side, paletteId, style, games, why, journey, signature }: PlayerPaletteCardProps) {
  const palette = colorPalettes.find((p) => p.id === paletteId);
  const swatches = signature ?? palette;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/70">
      <div className="relative h-20">
        {paletteThumbs[paletteId] && <img src={paletteThumbs[paletteId]} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2 text-white">
          <div>
            {side && <p className="font-display text-[10px] uppercase tracking-[0.2em] text-white/70">{side}</p>}
            <p className="font-display text-sm leading-tight">{name}</p>
          </div>
          <p className="text-right font-mono text-[11px] text-white/80">
            {signature ? signature.name : palette?.name ?? paletteId}
            {games !== undefined && <span className="block text-white/60">{games} game{games === 1 ? '' : 's'}</span>}
          </p>
        </div>
      </div>
      <div className="space-y-3 p-3">
        {swatches && (
          <div className="flex gap-1" aria-label="Palette colours">
            {PIECES.map((p) => (
              <span key={`w${p}`} className="h-4 flex-1 rounded-sm" style={{ background: swatches.white[p] }} />
            ))}
            <span className="w-1" />
            {PIECES.map((p) => (
              <span key={`b${p}`} className="h-4 flex-1 rounded-sm" style={{ background: swatches.black[p] }} />
            ))}
          </div>
        )}
        {style && (
          <div className="space-y-1.5">
            {BARS.map((b) => (
              <div key={b.key} className="text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <span className="uppercase tracking-wider">{b.label}</span>
                  <span>{b.low} / {b.high}</span>
                </div>
                <div className="relative mt-0.5 h-1.5 rounded-full bg-muted">
                  <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
                  <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${Math.round(style[b.key] * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {why && <p className="text-[11px] leading-snug text-muted-foreground">{why}</p>}
        {journey && journey.length > 1 && (
          <div>
            <p className="mb-1 font-display text-[10px] uppercase tracking-wider text-muted-foreground">Palette journey</p>
            <div className="flex flex-wrap items-center gap-1 text-[10px]">
              {journey.slice(-8).map((j, i) => (
                <span key={`${j.label}-${i}`} className="inline-flex items-center gap-1">
                  {i > 0 && <span className="text-muted-foreground/60">→</span>}
                  <span className="rounded-full border border-border/60 px-1.5 py-0.5">
                    {j.label} · {colorPalettes.find((p) => p.id === j.paletteId)?.name ?? j.paletteId}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerPaletteCard;
