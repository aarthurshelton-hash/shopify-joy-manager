import React, { useMemo } from 'react';
import {
  EVENT_STYLE, groupEventsBySquare, squareToCoords,
  type GameEvent, type GameEventType,
} from '@/lib/chess/eventLayer';

const CELL = 100;
const BIG_EVENTS: GameEventType[] = ['checkmate', 'promotion', 'sacrifice'];

interface MarksProps {
  events: GameEvent[];
  variant: 'standalone' | 'overlay';
  hidden?: Set<GameEventType>;
}

/** Event marks in an 800x800 board space; usable inside any board SVG. */
export const EventMarks: React.FC<MarksProps> = ({ events, variant, hidden }) => {
  const groups = useMemo(() => groupEventsBySquare(events, hidden), [events, hidden]);
  const castles = useMemo(
    () => events.filter((e) => e.type === 'castle' && e.linkedSquare && !hidden?.has('castle')),
    [events, hidden],
  );

  return (
    <g>
      {variant === 'standalone' && castles.map((castle) => {
        const from = squareToCoords(castle.square);
        const to = squareToCoords(castle.linkedSquare!);
        if (!from || !to) return null;
        return (
          <line
            key={`link-${castle.id}`}
            x1={from.file * CELL + CELL / 2}
            y1={from.rank * CELL + CELL / 2}
            x2={to.file * CELL + CELL / 2}
            y2={to.rank * CELL + CELL / 2}
            stroke={EVENT_STYLE.castle.color}
            strokeWidth={4}
            strokeDasharray="10 8"
            opacity={0.55}
          />
        );
      })}

      {groups.map(({ square, events: squareEvents }) => {
        const coords = squareToCoords(square);
        if (!coords) return null;
        const x = coords.file * CELL;
        const y = coords.rank * CELL;
        const top = squareEvents[0];

        if (variant === 'overlay') {
          return (
            <g key={square}>
              <title>{squareEvents.map((e) => e.label).join('\n')}</title>
              {BIG_EVENTS.includes(top.type) && (
                <rect
                  x={x + 5} y={y + 5} width={CELL - 10} height={CELL - 10} rx={8}
                  fill="none" stroke={EVENT_STYLE[top.type].color} strokeWidth={4} opacity={0.85}
                />
              )}
              {squareEvents.slice(0, 4).map((event, i) => (
                <circle
                  key={event.id}
                  cx={x + CELL - 18 - i * 20}
                  cy={y + 18}
                  r={9}
                  fill={EVENT_STYLE[event.type].color}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        }

        return (
          <g key={square}>
            <title>{squareEvents.map((e) => e.label).join('\n')}</title>
            <circle
              cx={x + CELL / 2} cy={y + CELL / 2} r={30}
              fill={EVENT_STYLE[top.type].color} opacity={0.9}
            />
            {squareEvents.slice(1, 4).map((event, i) => (
              <circle
                key={event.id}
                cx={x + CELL / 2} cy={y + CELL / 2} r={38 + i * 9}
                fill="none" stroke={EVENT_STYLE[event.type].color} strokeWidth={5} opacity={0.8}
              />
            ))}
            {squareEvents.length > 1 && (
              <text
                x={x + CELL / 2} y={y + CELL / 2 + 7}
                textAnchor="middle" fontSize={24} fontWeight={700}
                fill="#0A0A0A" fontFamily="'Inter', system-ui, sans-serif"
              >
                {squareEvents.length}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

interface EventBoardProps {
  events: GameEvent[];
  size: number;
  hidden?: Set<GameEventType>;
  darkMode?: boolean;
}

/** Standalone event board: quiet squares, only the game's turning points painted. */
export const EventBoard: React.FC<EventBoardProps> = ({ events, size, hidden, darkMode = false }) => {
  const light = darkMode ? '#292524' : '#EBE7E0';
  const dark = darkMode ? '#1C1917' : '#D8D2C8';

  return (
    <svg width={size} height={size} viewBox="0 0 800 800" style={{ display: 'block' }}>
      {Array.from({ length: 64 }, (_, i) => {
        const file = i % 8;
        const rank = Math.floor(i / 8);
        return (
          <rect
            key={i} x={file * CELL} y={rank * CELL} width={CELL} height={CELL}
            fill={(file + rank) % 2 === 0 ? light : dark}
          />
        );
      })}
      <EventMarks events={events} variant="standalone" hidden={hidden} />
      <rect x={1} y={1} width={798} height={798} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={2} />
    </svg>
  );
};
