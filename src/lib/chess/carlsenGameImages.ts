// Magnus Carlsen Game Images - AI-generated artwork for each legendary game
// These images blend Magnus Carlsen's essence with various artistic styles

// Import all Carlsen game artwork
import carlsenCrowning from '@/assets/games/carlsen/carlsen-crowning.jpg';
import carlsenProdigy from '@/assets/games/carlsen/carlsen-prodigy.jpg';
import carlsenAnandShowdown from '@/assets/games/carlsen/carlsen-anand-showdown.jpg';
import carlsenTiebreak from '@/assets/games/carlsen/carlsen-tiebreak.jpg';
import carlsenEpicMarathon from '@/assets/games/carlsen/carlsen-epic-marathon.jpg';
import carlsenKasparovLegend from '@/assets/games/carlsen/carlsen-kasparov-legend.jpg';
import carlsenBreakthrough from '@/assets/games/carlsen/carlsen-breakthrough.jpg';
import carlsenEndgameMaster from '@/assets/games/carlsen/carlsen-endgame-master.jpg';
import carlsenSicilianFire from '@/assets/games/carlsen/carlsen-sicilian-fire.jpg';
import carlsenCrushingVictory from '@/assets/games/carlsen/carlsen-crushing-victory.jpg';
import carlsenRookLift from '@/assets/games/carlsen/carlsen-rook-lift.jpg';
import carlsenBerlinMaster from '@/assets/games/carlsen/carlsen-berlin-master.jpg';
import carlsenSpanishAttack from '@/assets/games/carlsen/carlsen-spanish-attack.jpg';
import carlsenQueenSacrifice from '@/assets/games/carlsen/carlsen-queen-sacrifice.jpg';
import carlsenTacticalBrilliancy from '@/assets/games/carlsen/carlsen-tactical-brilliancy.jpg';
import carlsenPositionalSqueeze from '@/assets/games/carlsen/carlsen-positional-squeeze.jpg';
import carlsenNordicWarrior from '@/assets/games/carlsen/carlsen-nordic-warrior.jpg';
import carlsenKnightOutpost from '@/assets/games/carlsen/carlsen-knight-outpost.jpg';
import carlsenPromotion from '@/assets/games/carlsen/carlsen-promotion.jpg';
import carlsenBlitzSpeed from '@/assets/games/carlsen/carlsen-blitz-speed.jpg';
import carlsenExchangeSac from '@/assets/games/carlsen/carlsen-exchange-sac.jpg';
import carlsenZugzwang from '@/assets/games/carlsen/carlsen-zugzwang.jpg';
import carlsenKramnikBattle from '@/assets/games/carlsen/carlsen-kramnik-battle.jpg';
import carlsenGrunfeldCounter from '@/assets/games/carlsen/carlsen-grunfeld-counter.jpg';
import carlsenTechnique from '@/assets/games/carlsen/carlsen-technique.jpg';

// Mapping of Carlsen game IDs to their artwork
// Each game gets a unique, thematically appropriate image
export const carlsenGameImages: Record<string, string> = {
  // World Championship Games (1-10)
  'carlsen-anand-2013-g5': carlsenCrowning,           // The Crowning - becoming World Champion
  'carlsen-anand-2014-g6': carlsenBerlinMaster,       // The Berlin Grind - technical endgame
  'carlsen-karjakin-2016-g10': carlsenBreakthrough,   // Breaking the Wall
  'carlsen-caruana-2018-tb': carlsenTiebreak,         // Tiebreak Triumph
  'carlsen-nepo-2021-g6': carlsenEpicMarathon,        // 136-Move Epic
  'carlsen-nepo-2021-g8': carlsenCrushingVictory,     // The Crushing Blow
  'carlsen-anand-2013-g9': carlsenEndgameMaster,      // Berlin Endgame mastery
  'karjakin-carlsen-2016-tb4': carlsenTacticalBrilliancy, // Tiebreak Domination
  'carlsen-caruana-2018-g10': carlsenPositionalSqueeze, // The Missed Win - tension
  'carlsen-nepo-2021-g11': carlsenCrushingVictory,    // The Final Nail
  
  // Legendary Prodigy & Early Career (11-25)
  'carlsen-ernst-2004': carlsenProdigy,               // The Prodigy Arrives - young prodigy
  'carlsen-kasparov-2004': carlsenKasparovLegend,     // Master and Prodigy meeting
  'carlsen-topalov-2008': carlsenSicilianFire,        // Pearl of Wijk aan Zee
  'aronian-carlsen-2008': carlsenGrunfeldCounter,     // Sicilian Masterwork
  'carlsen-radjabov-2008': carlsenRookLift,           // Immortal Rook Lift
  'carlsen-ivanchuk-2009': carlsenTacticalBrilliancy, // Tal Memorial Brilliancy
  'carlsen-shirov-2009': carlsenQueenSacrifice,       // Spanish Sacrifice
  'carlsen-kramnik-2010': carlsenKramnikBattle,       // Dethroning the Legend
  'wang-carlsen-2010': carlsenSpanishAttack,          // King's Hunt
  'carlsen-nakamura-2011': carlsenBlitzSpeed,         // Blitz dominance
  
  // Additional games with thematic artwork
  'carlsen-aronian-2012': carlsenNordicWarrior,       // Nordic spirit games
  'carlsen-giri-2015': carlsenTechnique,              // Technical precision
  'carlsen-so-2017': carlsenExchangeSac,              // Exchange sacrifice theme
  'carlsen-anand-2014-g2': carlsenZugzwang,           // Zugzwang mastery
  'carlsen-ding-2019': carlsenKnightOutpost,          // Knight outpost games
  'carlsen-firouzja-2022': carlsenPromotion,          // New generation battle
};

// Get the appropriate artwork for a Carlsen game
// Falls back to crowning image if specific game not found
export const getCarlsenGameImage = (gameId: string): string => {
  return carlsenGameImages[gameId] || carlsenCrowning;
};

// Array of all available Carlsen artwork for random selection
export const allCarlsenArtwork = [
  carlsenCrowning,
  carlsenProdigy,
  carlsenAnandShowdown,
  carlsenTiebreak,
  carlsenEpicMarathon,
  carlsenKasparovLegend,
  carlsenBreakthrough,
  carlsenEndgameMaster,
  carlsenSicilianFire,
  carlsenCrushingVictory,
  carlsenRookLift,
  carlsenBerlinMaster,
  carlsenSpanishAttack,
  carlsenQueenSacrifice,
  carlsenTacticalBrilliancy,
  carlsenPositionalSqueeze,
  carlsenNordicWarrior,
  carlsenKnightOutpost,
  carlsenPromotion,
  carlsenBlitzSpeed,
  carlsenExchangeSac,
  carlsenZugzwang,
  carlsenKramnikBattle,
  carlsenGrunfeldCounter,
  carlsenTechnique,
];

// Get a random Carlsen artwork for display
export const getRandomCarlsenArtwork = (): string => {
  return allCarlsenArtwork[Math.floor(Math.random() * allCarlsenArtwork.length)];
};
