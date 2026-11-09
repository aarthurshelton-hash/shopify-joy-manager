import React, { useMemo } from 'react';
import { EVENT_STYLE, type GameEvent, type GameEventType } from '@/lib/chess/eventLayer';

interface EventLegendProps {
  events: GameEvent[];
  hidden: Set<GameEventType>;
  onToggle: (type: GameEventType) => void;
}

/** Clickable event legend: clicking a type hides or shows its marks on the board. */
export const EventLegend: React.FC<EventLegendProps> = ({ events, hidden, onToggle }) => {
  const counts = useMemo(() => {
    const map = new Map<GameEventType, number>();
    for (const event of events) map.set(event.type, (map.get(event.type) || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  if (counts.length === 0) {
    return <p className="text-xs text-muted-foreground">No notable events in this game yet.</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Click an event to hide it</p>
      <div className="flex flex-wrap gap-1.5">
        {counts.map(([type, count]) => {
          const isHidden = hidden.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggle(type)}
              aria-pressed={!isHidden}
              title={`${isHidden ? 'Show' : 'Hide'} ${EVENT_STYLE[type].name}`}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-opacity ${
                isHidden ? 'border-border/40 opacity-40' : 'border-border/70'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: EVENT_STYLE[type].color }}
              />
              {EVENT_STYLE[type].name}
              <span className="text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
