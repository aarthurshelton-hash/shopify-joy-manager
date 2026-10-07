/**
 * En Pensent x Matcherino tournament configuration.
 * Single source of truth — update event details here as the
 * partnership with Matcherino (Grant Farwell) firms up.
 * Games are played on lichess (open API, built-in anti-cheat).
 */

export type TournamentStatus =
  | 'planning'      // partnership in discussion, no public dates
  | 'announced'     // public page live, registration not open
  | 'registration'  // Matcherino event open for signups
  | 'live'          // event in progress
  | 'completed';    // wrapped, results posted

export interface TournamentConfig {
  name: string;
  tagline: string;
  status: TournamentStatus;
  /** ISO dates — null until announced */
  startDate: string | null;
  registrationOpens: string | null;
  format: {
    mode: 'arena' | 'swiss';
    timeControl: string;       // e.g. '3+2 blitz'
    platform: 'lichess';
    durationMinutes: number | null; // arena duration, null for swiss
    rounds: number | null;          // swiss rounds, null for arena
  };
  entryFee: 'free' | 'paid';
  prize: {
    /** Pool is crowdfunded + Matcherino escrowed; text only, no fake $ claims */
    poolDescription: string;
    /** Non-cash prizes offered by En Pensent */
    bonusPrizes: string[];
  };
  urls: {
    /** Matcherino event page — fill when the event goes live */
    matcherinoEvent: string | null;
    /** Lichess tournament/team link */
    lichess: string | null;
  };
  rules: string[];
}

export const TOURNAMENT: TournamentConfig = {
  name: 'The En Pensent Open',
  tagline: 'Every game tells a story. Now yours can win.',
  status: 'announced',
  startDate: null,
  registrationOpens: null,
  format: {
    mode: 'arena',
    timeControl: '5+0 blitz',
    platform: 'lichess',
    durationMinutes: 90,
    rounds: null,
  },
  entryFee: 'free',
  prize: {
    poolDescription:
      'Community-funded prize pool held in escrow and paid out globally by Matcherino.',
    bonusPrizes: [
      'Champion: your winning game rendered as a one-of-a-kind En Pensent vision',
      'Top finishers: free Visionary premium memberships',
      'Every participant: permanent vision of your best tournament game',
    ],
  },
  urls: {
    matcherinoEvent: null,
    lichess: null,
  },
  rules: [
    'Games are played on lichess.org — a free lichess account is required.',
    'Free entry. The prize pool grows via crowdfunding on Matcherino.',
    'Lichess fair-play detection applies; flagged accounts are ineligible for prizes.',
    'Prize pool recipients must register on Matcherino to receive payouts.',
    'Payouts are designated within 30 days of the event ending.',
  ],
};

export const tournamentHasRegistrationLink = () =>
  !!TOURNAMENT.urls.matcherinoEvent;
