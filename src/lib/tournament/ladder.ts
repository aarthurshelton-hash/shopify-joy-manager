/**
 * Tournament ladder — one event every `cadenceDays`, rotating rating band and
 * time control so every level of player has a recognisable slot.
 * Rules live in ladder.json (also read by scripts/tournaments/schedule.mjs).
 *
 * Rotation: band = i % bands, time control alternates each lap so a band sees
 * blitz and rapid on different laps. Start slot alternates between regions.
 */
import ladder from './ladder.json';

export interface LadderBand {
  id: string;
  label: string;
  minRating?: number;
  maxRating?: number;
}

export interface LadderTimeControl {
  id: string;
  label: string;
  clock: string;
  perf: string;
  minRatedGames: number;
  minAccountDays: number;
  reviewTop: number;
}

export interface LadderEvent {
  index: number;
  startsAt: Date;
  band: LadderBand;
  timeControl: LadderTimeControl;
  name: string;
}

const DAY_MS = 86_400_000;
const bands = ladder.bands as LadderBand[];
const timeControls = ladder.timeControls as LadderTimeControl[];

export const LADDER = { ...ladder, bands, timeControls };

export function ladderEvent(index: number): LadderEvent {
  const band = bands[index % bands.length];
  const lap = Math.floor(index / bands.length);
  const timeControl = timeControls[(index + lap) % timeControls.length];
  const cycle = Math.floor(index / (bands.length * timeControls.length));
  const [hh, mm] = ladder.slotsUtc[(index + cycle) % ladder.slotsUtc.length].split(':').map(Number);
  const day = Date.parse(`${ladder.epoch}T00:00:00Z`) + index * ladder.cadenceDays * DAY_MS;
  const startsAt = new Date(day + (hh * 60 + mm) * 60_000);
  const label = startsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return { index, startsAt, band, timeControl, name: `EP ${band.label} ${timeControl.label} · ${label}` };
}

export function upcomingLadderEvents(from: Date, count: number): LadderEvent[] {
  const epoch = Date.parse(`${ladder.epoch}T00:00:00Z`);
  let i = Math.max(0, Math.floor((from.getTime() - epoch) / (ladder.cadenceDays * DAY_MS)) - 1);
  const out: LadderEvent[] = [];
  while (out.length < count) {
    const ev = ladderEvent(i++);
    if (ev.startsAt.getTime() >= from.getTime()) out.push(ev);
  }
  return out;
}

export function bandRatingText(band: LadderBand): string {
  if (band.minRating && band.maxRating) return `${band.minRating}–${band.maxRating}`;
  if (band.maxRating) return `up to ${band.maxRating}`;
  if (band.minRating) return `${band.minRating}+`;
  return 'all ratings';
}
