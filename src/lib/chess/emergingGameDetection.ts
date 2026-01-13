/**
 * Emerging Game Detection System
 * 
 * Detects high-value games as they happen:
 * - World Championship matches
 * - Major tournaments (Candidates, Tata Steel, Norway Chess, etc.)
 * - Games featuring top players (Super GMs)
 * - Historic first occurrences
 * 
 * This enables first-mover advantage for claiming ownership of
 * visualizations of games that will become future classics.
 */

import { supabase } from '@/integrations/supabase/client';

// Top players who make games inherently valuable
export const SUPER_GMS = [
  // Current World Champion and contenders
  'Magnus Carlsen', 'Ding Liren', 'Fabiano Caruana', 'Ian Nepomniachtchi',
  'Hikaru Nakamura', 'Alireza Firouzja', 'Anish Giri', 'Wesley So',
  'Levon Aronian', 'Maxime Vachier-Lagrave', 'Sergey Karjakin', 'Viswanathan Anand',
  'Vladimir Kramnik', 'Veselin Topalov', 'Shakhriyar Mamedyarov', 'Teimour Radjabov',
  'Dommaraju Gukesh', 'R Praggnanandhaa', 'Nodirbek Abdusattorov', 'Vincent Keymer',
  // Legends (games with these players have historical significance)
  'Garry Kasparov', 'Bobby Fischer', 'Mikhail Tal', 'Anatoly Karpov',
  'Jose Raul Capablanca', 'Emanuel Lasker', 'Alexander Alekhine', 'Tigran Petrosian',
  'Boris Spassky', 'Viktor Korchnoi', 'Bent Larsen', 'Mikhail Botvinnik',
  // Top Women Players
  'Judit Polgar', 'Hou Yifan', 'Yifan Hou', 'Ju Wenjun', 'Humpy Koneru',
  'Aleksandra Goryachkina', 'Lei Tingjie', 'Anna Muzychuk', 'Mariya Muzychuk',
];

// Major events that make games inherently valuable
export const MAJOR_EVENTS = [
  // World Championship Cycle
  'World Championship', 'World Chess Championship', 'FIDE World Championship',
  'Candidates Tournament', 'Candidates', 'World Cup',
  // Super Tournaments
  'Tata Steel', 'Wijk aan Zee', 'Norway Chess', 'Sinquefield Cup',
  'London Chess Classic', 'Grand Chess Tour', 'Altibox Norway Chess',
  'Superbet Chess Classic', 'Champions Chess Tour', 'Chess.com Global Championship',
  // Historic Tournaments
  'Zurich', 'Linares', 'Amber', 'Dortmund', 'Corus', 'Hoogovens',
  'AVRO', 'Hastings', 'San Sebastian', 'Bled', 'Curacao',
  // Olympiad
  'Chess Olympiad', 'Olympiad',
  // AI/Historic matches
  'Man vs Machine', 'IBM', 'Deep Blue',
];

// Event patterns that indicate championship-level importance
export const CHAMPIONSHIP_PATTERNS = [
  /world\s*champion/i,
  /candidates/i,
  /olympiad/i,
  /grand\s*prix/i,
  /world\s*cup/i,
  /super\s*tournament/i,
  /classical\s*world/i,
  /rapid\s*world/i,
  /blitz\s*world/i,
];

export interface EmergingGameSignificance {
  isEmergingClassic: boolean;
  significanceScore: number; // 0-100, higher = more valuable
  reasons: string[];
  playerTier: 'super-gm' | 'elite' | 'titled' | 'unknown';
  eventTier: 'world-championship' | 'super-tournament' | 'major' | 'regular' | 'casual';
  projectedRarity: 'legendary' | 'rare' | 'uncommon' | 'common';
  firstClaimBonus: boolean; // True if this is the first time this game is being claimed
}

/**
 * Extract player names from PGN headers
 */
function extractPlayers(pgn: string): { white: string; black: string } {
  const whiteMatch = pgn.match(/\[White\s+"([^"]+)"\]/i);
  const blackMatch = pgn.match(/\[Black\s+"([^"]+)"\]/i);
  
  return {
    white: whiteMatch?.[1] || '',
    black: blackMatch?.[1] || '',
  };
}

/**
 * Extract event name from PGN headers
 */
function extractEvent(pgn: string): string {
  const eventMatch = pgn.match(/\[Event\s+"([^"]+)"\]/i);
  return eventMatch?.[1] || '';
}

/**
 * Extract date/year from PGN headers
 */
function extractDate(pgn: string): { year: number; isRecent: boolean } {
  const dateMatch = pgn.match(/\[Date\s+"(\d{4})\.?/i);
  const year = dateMatch ? parseInt(dateMatch[1], 10) : 0;
  const currentYear = new Date().getFullYear();
  const isRecent = year >= currentYear - 1; // Within last year
  
  return { year, isRecent };
}

/**
 * Extract round information (higher rounds = more critical games)
 */
function extractRound(pgn: string): { round: number; isCritical: boolean } {
  const roundMatch = pgn.match(/\[Round\s+"(\d+)/i);
  const round = roundMatch ? parseInt(roundMatch[1], 10) : 0;
  // Finals, semifinals, decisive games are usually higher rounds
  const isCritical = round >= 10 || /final|decisive|tiebreak/i.test(pgn);
  
  return { round, isCritical };
}

/**
 * Check if a player is a Super GM
 */
function isSuperGM(playerName: string): boolean {
  const normalized = playerName.toLowerCase().trim();
  return SUPER_GMS.some(gm => {
    const gmNormalized = gm.toLowerCase();
    // Check exact match or partial (handles "Carlsen, Magnus" vs "Magnus Carlsen")
    return normalized.includes(gmNormalized) || 
           gmNormalized.includes(normalized) ||
           // Handle "Last, First" format
           normalized.split(',').map(p => p.trim()).reverse().join(' ').includes(gmNormalized);
  });
}

/**
 * Check if event is a major tournament
 */
function isMajorEvent(eventName: string): { isMajor: boolean; tier: EmergingGameSignificance['eventTier'] } {
  const normalized = eventName.toLowerCase();
  
  // World Championship tier
  if (/world\s*champion/i.test(eventName) || /candidates/i.test(eventName)) {
    return { isMajor: true, tier: 'world-championship' };
  }
  
  // Super tournament tier
  if (MAJOR_EVENTS.some(e => normalized.includes(e.toLowerCase()))) {
    return { isMajor: true, tier: 'super-tournament' };
  }
  
  // Check patterns
  for (const pattern of CHAMPIONSHIP_PATTERNS) {
    if (pattern.test(eventName)) {
      return { isMajor: true, tier: 'major' };
    }
  }
  
  // Regular rated events
  if (/tournament|championship|open|cup|match/i.test(eventName)) {
    return { isMajor: false, tier: 'regular' };
  }
  
  return { isMajor: false, tier: 'casual' };
}

/**
 * Calculate how many times this specific game has been saved (for first-mover detection)
 */
async function getGameClaimCount(pgn: string): Promise<number> {
  try {
    // Normalize PGN for comparison (extract just the moves)
    const movesOnly = pgn
      .replace(/\[.*?\]/g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\d+\.\s*/g, ' ')
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
      .trim()
      .toLowerCase()
      .slice(0, 200); // First 200 chars of moves for matching
    
    if (!movesOnly) return 0;
    
    const { count, error } = await supabase
      .from('saved_visualizations')
      .select('*', { count: 'exact', head: true })
      .ilike('pgn', `%${movesOnly.slice(0, 50)}%`);
    
    if (error) {
      console.error('Error checking game claim count:', error);
      return 0;
    }
    
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Detect if a game is an emerging classic worthy of premium ownership
 */
export async function detectEmergingGame(pgn: string): Promise<EmergingGameSignificance> {
  const reasons: string[] = [];
  let score = 0;
  
  // Extract metadata
  const players = extractPlayers(pgn);
  const event = extractEvent(pgn);
  const { year, isRecent } = extractDate(pgn);
  const { round, isCritical } = extractRound(pgn);
  
  // Check players
  const whiteIsSuperGM = isSuperGM(players.white);
  const blackIsSuperGM = isSuperGM(players.black);
  const bothSuperGMs = whiteIsSuperGM && blackIsSuperGM;
  
  let playerTier: EmergingGameSignificance['playerTier'] = 'unknown';
  
  if (bothSuperGMs) {
    playerTier = 'super-gm';
    score += 40;
    reasons.push(`Super GM clash: ${players.white} vs ${players.black}`);
  } else if (whiteIsSuperGM || blackIsSuperGM) {
    playerTier = 'elite';
    score += 25;
    const superGM = whiteIsSuperGM ? players.white : players.black;
    reasons.push(`Features Super GM: ${superGM}`);
  } else if (players.white || players.black) {
    playerTier = 'titled';
    score += 5;
  }
  
  // Check event
  const { isMajor, tier: eventTier } = isMajorEvent(event);
  
  if (eventTier === 'world-championship') {
    score += 35;
    reasons.push(`World Championship level: ${event}`);
  } else if (eventTier === 'super-tournament') {
    score += 25;
    reasons.push(`Super Tournament: ${event}`);
  } else if (eventTier === 'major') {
    score += 15;
    reasons.push(`Major Event: ${event}`);
  } else if (eventTier === 'regular') {
    score += 5;
  }
  
  // Recent games get bonus (potential future classics)
  if (isRecent) {
    score += 15;
    reasons.push(`Recent game (${year}) - potential future classic`);
  }
  
  // Critical rounds (finals, etc.)
  if (isCritical) {
    score += 10;
    reasons.push(`Critical round (Round ${round || 'Final'})`);
  }
  
  // Check first-mover advantage
  const claimCount = await getGameClaimCount(pgn);
  const firstClaimBonus = claimCount === 0;
  
  if (firstClaimBonus) {
    score += 10;
    reasons.push('🏆 First to claim this game!');
  }
  
  // Determine projected rarity
  let projectedRarity: EmergingGameSignificance['projectedRarity'];
  if (score >= 70) {
    projectedRarity = 'legendary';
  } else if (score >= 50) {
    projectedRarity = 'rare';
  } else if (score >= 30) {
    projectedRarity = 'uncommon';
  } else {
    projectedRarity = 'common';
  }
  
  // Is this an emerging classic?
  const isEmergingClassic = score >= 40 || (bothSuperGMs && isRecent) || eventTier === 'world-championship';
  
  return {
    isEmergingClassic,
    significanceScore: Math.min(score, 100),
    reasons,
    playerTier,
    eventTier,
    projectedRarity,
    firstClaimBonus,
  };
}

/**
 * Get a human-readable significance label
 */
export function getSignificanceLabel(result: EmergingGameSignificance): string {
  if (result.projectedRarity === 'legendary') {
    return '🏆 Legendary Potential';
  } else if (result.projectedRarity === 'rare') {
    return '⭐ Rare Find';
  } else if (result.projectedRarity === 'uncommon') {
    return '✨ Noteworthy Game';
  }
  return '';
}

/**
 * Format significance for display
 */
export function formatSignificanceDisplay(result: EmergingGameSignificance): {
  badge: string;
  color: string;
  description: string;
} {
  switch (result.projectedRarity) {
    case 'legendary':
      return {
        badge: '🏆 LEGENDARY',
        color: 'text-amber-400',
        description: 'This game has exceptional historical significance',
      };
    case 'rare':
      return {
        badge: '⭐ RARE',
        color: 'text-purple-400',
        description: 'Features elite players or major tournament',
      };
    case 'uncommon':
      return {
        badge: '✨ NOTABLE',
        color: 'text-blue-400',
        description: 'A noteworthy game worth collecting',
      };
    default:
      return {
        badge: '',
        color: '',
        description: '',
      };
  }
}
