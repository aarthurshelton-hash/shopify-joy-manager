import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { describeEvent, squareToCoords, type GameEvent } from '@/lib/chess/eventLayer';
import { getPieceColor, type PieceType, type PieceColor } from '@/lib/chess/pieceColors';
import { EventSwatch } from './EventTextureMarks';

interface EventMomentPopupProps {
  events: GameEvent[];
  size: number;
}

/** Detail card that floats beside the tile a key moment happened on. */
export const EventMomentPopup: React.FC<EventMomentPopupProps> = ({ events, size }) => {
  const event = events[0];
  const coords = event ? squareToCoords(event.square) : null;
  const description = event ? describeEvent(event) : null;
  const preferredTop = coords
    ? coords.rank >= 4 ? (coords.rank / 8) * size - 128 : ((coords.rank + 1) / 8) * size + 10
    : 0;

  return (
    <AnimatePresence mode="wait">
      {event && coords && (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none absolute z-30 w-56 rounded-lg border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: Math.min(Math.max((coords.file / 8) * size - 40, 4), Math.max(size - 228, 4)),
            top: Math.min(Math.max(preferredTop, 4), Math.max(size - 140, 4)),
          }}
        >
          <div className="flex items-start gap-2.5">
            <EventSwatch
              type={event.type}
              pieceColor={getPieceColor(event.piece as PieceType, event.color as PieceColor)}
              size={26}
            />
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold leading-tight">{description!.title}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {description!.when}
              </p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {description!.detail}
              </p>
              {events.length > 1 && (
                <p className="text-[10px] text-muted-foreground">
                  Also here: {events.slice(1).map((e) => e.label).join(' · ')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
