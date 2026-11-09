import React, { useId, useMemo } from 'react';
import {
  groupEventsBySquare, squareToCoords,
  type GameEvent, type GameEventType,
} from '@/lib/chess/eventLayer';
import { getPieceColor, type PieceType, type PieceColor } from '@/lib/chess/pieceColors';

const CELL = 100;
const TILE = 34;
const BIG_EVENTS: GameEventType[] = ['checkmate', 'promotion', 'sacrifice'];

/**
 * Texture per event type. The fill is always the moving piece's own palette
 * colour; the pattern is what tells you what happened there.
 */
const TEXTURES: Record<GameEventType, React.ReactElement> = {
  capture: (
    <pattern id="ep-tex-capture" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 3 L6 9 L12 3 M0 9 L6 15 L12 9" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
      <path d="M0 0 L6 6 L12 0" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </pattern>
  ),
  enPassant: (
    <pattern id="ep-tex-enPassant" width="10" height="10" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.8" fill="rgba(0,0,0,0.45)" />
      <circle cx="8" cy="8" r="1.4" fill="rgba(255,255,255,0.4)" />
    </pattern>
  ),
  check: (
    <pattern id="ep-tex-check" width="34" height="34" patternUnits="userSpaceOnUse">
      <rect width="34" height="34" fill="rgba(255,255,255,0.22)" />
      <path d="M-6 22 L22 -6 M0 34 L34 0 M12 40 L40 12" stroke="rgba(255,255,255,0.65)" strokeWidth="5" />
      <path d="M-6 27 L27 -6 M5 39 L39 5" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
    </pattern>
  ),
  checkmate: (
    <pattern id="ep-tex-checkmate" width="34" height="34" patternUnits="userSpaceOnUse">
      <rect width="34" height="34" fill="rgba(251,191,36,0.55)" />
      <path d="M17 6 L20 14 L28 14 L22 19 L24 27 L17 22 L10 27 L12 19 L6 14 L14 14 Z" fill="rgba(255,255,255,0.85)" />
    </pattern>
  ),
  castle: (
    <pattern id="ep-tex-castle" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M0 0 H16 M0 8 H16 M8 0 V8 M0 8 V16 M16 8 V16" stroke="rgba(0,0,0,0.4)" strokeWidth="2" fill="none" />
    </pattern>
  ),
  promotion: (
    <pattern id="ep-tex-promotion" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="4" height="8" fill="rgba(255,255,255,0.45)" />
      <rect x="4" width="1.5" height="8" fill="rgba(0,0,0,0.3)" />
    </pattern>
  ),
  sacrifice: (
    <pattern id="ep-tex-sacrifice" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M0 0 L10 10 M10 0 L0 10" stroke="rgba(0,0,0,0.4)" strokeWidth="1.6" />
      <circle cx="5" cy="5" r="1.6" fill="rgba(255,255,255,0.5)" />
    </pattern>
  ),
  brilliant: (
    <pattern id="ep-tex-brilliant" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M8 1 V15 M1 8 H15" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
      <path d="M3 3 L13 13 M13 3 L3 13" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </pattern>
  ),
  blunder: (
    <pattern id="ep-tex-blunder" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M2 0 L8 8 L4 12 L12 20 M14 0 L12 6 L18 10" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.8" />
    </pattern>
  ),
};

export const EventTextureDefs: React.FC<{ idPrefix: string }> = ({ idPrefix }) => (
  <defs>
    {Object.entries(TEXTURES).map(([type, texture]) =>
      React.cloneElement(texture, { id: `${idPrefix}-${type}`, key: type })
    )}
  </defs>
);

/** Small textured swatch, used in legends and popups so the key matches the board. */
export const EventSwatch: React.FC<{ type: GameEventType; pieceColor?: string; size?: number }> = ({
  type, pieceColor = '#a8a29e', size = 18,
}) => {
  const idPrefix = `ep-swatch-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" className="shrink-0 rounded-sm ring-1 ring-black/30" aria-hidden="true">
      <EventTextureDefs idPrefix={idPrefix} />
      <rect width="34" height="34" fill={pieceColor} />
      <rect width="34" height="34" fill={`url(#${idPrefix}-${type})`} />
    </svg>
  );
};

interface MarksProps {
  events: GameEvent[];
  hidden?: Set<GameEventType>;
}

/** Textured event marks in an 800x800 board space, layered over the classic board. */
export const EventTextureMarks: React.FC<MarksProps> = ({ events, hidden }) => {
  const groups = useMemo(() => groupEventsBySquare(events, hidden), [events, hidden]);
  const idPrefix = `ep-board-${useId().replace(/:/g, '')}`;

  return (
    <g>
      <EventTextureDefs idPrefix={idPrefix} />
      {groups.map(({ square, events: squareEvents }) => {
        const coords = squareToCoords(square);
        if (!coords) return null;
        const x = coords.file * CELL;
        const y = coords.rank * CELL;
        const top = squareEvents[0];

        return (
          <g key={square}>
            <title>{squareEvents.map((e) => e.label).join('\n')}</title>
            {BIG_EVENTS.includes(top.type) && (
              <rect
                x={x + 4} y={y + 4} width={CELL - 8} height={CELL - 8} rx={8}
                fill="none" stroke={getPieceColor(top.piece as PieceType, top.color as PieceColor)} strokeWidth={3} opacity={0.7}
              />
            )}
            {squareEvents.slice(0, 3).map((event, i) => {
              const base = getPieceColor(event.piece as PieceType, event.color as PieceColor);
              const tx = x + CELL - TILE - 6 - i * (TILE + 6);
              const ty = y + 6;
              return (
                <g key={event.id}>
                  <rect x={tx} y={ty} width={TILE} height={TILE} rx={6} fill={base} />
                  <rect x={tx} y={ty} width={TILE} height={TILE} rx={6} fill={`url(#${idPrefix}-${event.type})`} />
                  <rect
                    x={tx} y={ty} width={TILE} height={TILE} rx={6}
                    fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={1.5}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
