/**
 * Market Domain Actionable Maps
 * Market signature → specific trading actions
 */

import type { ActionMapEntry } from './types';

export const MARKET_ACTIONABLE_MAP: Record<string, ActionMapEntry> = {
  bullish_momentum: {
    position: 'LONG',
    entry: 'Enter on pullback to 20-day moving average',
    exit: 'Trail stop at 2x ATR below price',
    risk: 'Position size: 2% of portfolio',
    action: 'LONG: Enter on pullback to 20-day moving average',
    expectedOutcome: 'Trail stop at 2x ATR below price',
  },
  bearish_reversal: {
    position: 'SHORT or EXIT LONG',
    entry: 'Short on break below recent support',
    exit: 'Cover at previous major low or -10%',
    risk: 'Reduce position size by 50%',
    action: 'SHORT or EXIT LONG: Short on break below recent support',
    expectedOutcome: 'Cover at previous major low or -10%',
  },
  high_volatility: {
    position: 'REDUCE EXPOSURE',
    entry: 'Wait for VIX to normalize (<20)',
    exit: 'Tight stops, take profits quickly',
    risk: 'Maximum 1% position sizes',
    action: 'REDUCE EXPOSURE: Wait for VIX to normalize (<20)',
    expectedOutcome: 'Tight stops, take profits quickly',
  },
  accumulation: {
    position: 'SCALE IN LONG',
    entry: 'Buy 25% now, 25% on each subsequent dip',
    exit: 'Hold for trend confirmation',
    risk: 'Normal position sizing',
    action: 'SCALE IN LONG: Buy 25% now, 25% on each subsequent dip',
    expectedOutcome: 'Hold for trend confirmation',
  },
  distribution: {
    position: 'SCALE OUT',
    entry: 'Do not add',
    exit: 'Sell 25% on each rally',
    risk: 'Protect gains',
    action: 'SCALE OUT: Do not add',
    expectedOutcome: 'Sell 25% on each rally',
  },
};
