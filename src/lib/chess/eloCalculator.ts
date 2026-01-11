/**
 * ELO Rating Calculator
 * Uses standard FIDE K-factor logic
 */

// K-factor determines how much ratings can change per game
// Higher K = more volatile ratings (good for new players)
// Lower K = more stable ratings (good for established players)
const getKFactor = (rating: number, gamesPlayed: number): number => {
  // New players get higher K-factor for faster adjustment
  if (gamesPlayed < 30) return 40;
  // Under 2400 rating
  if (rating < 2400) return 20;
  // Master level players
  return 10;
};

/**
 * Calculate expected score based on ratings
 * @param playerRating - The player's current rating
 * @param opponentRating - The opponent's current rating
 * @returns Expected score between 0 and 1
 */
export const getExpectedScore = (playerRating: number, opponentRating: number): number => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

/**
 * Calculate new ELO rating after a game
 * @param playerRating - Current player rating
 * @param opponentRating - Opponent's rating
 * @param actualScore - 1 for win, 0.5 for draw, 0 for loss
 * @param gamesPlayed - Number of games the player has completed (for K-factor)
 * @returns New rating (rounded to nearest integer)
 */
export const calculateNewRating = (
  playerRating: number,
  opponentRating: number,
  actualScore: 0 | 0.5 | 1,
  gamesPlayed: number = 30
): number => {
  const expectedScore = getExpectedScore(playerRating, opponentRating);
  const kFactor = getKFactor(playerRating, gamesPlayed);
  
  const newRating = playerRating + kFactor * (actualScore - expectedScore);
  
  // Ensure rating doesn't go below 100
  return Math.max(100, Math.round(newRating));
};

/**
 * Calculate rating changes for both players after a game
 * @param whiteRating - White player's current rating
 * @param blackRating - Black player's current rating
 * @param result - 'white_wins' | 'black_wins' | 'draw'
 * @param whiteGamesPlayed - White's total games (for K-factor)
 * @param blackGamesPlayed - Black's total games (for K-factor)
 * @returns Object with new ratings and changes for both players
 */
export const calculateGameRatingChanges = (
  whiteRating: number,
  blackRating: number,
  result: 'white_wins' | 'black_wins' | 'draw',
  whiteGamesPlayed: number = 30,
  blackGamesPlayed: number = 30
): {
  white: { newRating: number; change: number };
  black: { newRating: number; change: number };
} => {
  let whiteScore: 0 | 0.5 | 1;
  let blackScore: 0 | 0.5 | 1;
  
  switch (result) {
    case 'white_wins':
      whiteScore = 1;
      blackScore = 0;
      break;
    case 'black_wins':
      whiteScore = 0;
      blackScore = 1;
      break;
    case 'draw':
      whiteScore = 0.5;
      blackScore = 0.5;
      break;
  }
  
  const newWhiteRating = calculateNewRating(whiteRating, blackRating, whiteScore, whiteGamesPlayed);
  const newBlackRating = calculateNewRating(blackRating, whiteRating, blackScore, blackGamesPlayed);
  
  return {
    white: {
      newRating: newWhiteRating,
      change: newWhiteRating - whiteRating,
    },
    black: {
      newRating: newBlackRating,
      change: newBlackRating - blackRating,
    },
  };
};

/**
 * Get rating tier/title based on ELO rating
 */
export const getRatingTier = (rating: number): { name: string; color: string } => {
  if (rating >= 2700) return { name: 'Super GM', color: 'from-yellow-400 to-amber-500' };
  if (rating >= 2500) return { name: 'Grandmaster', color: 'from-purple-500 to-violet-600' };
  if (rating >= 2400) return { name: 'Int. Master', color: 'from-blue-500 to-cyan-500' };
  if (rating >= 2200) return { name: 'FIDE Master', color: 'from-teal-500 to-emerald-500' };
  if (rating >= 2000) return { name: 'Expert', color: 'from-green-500 to-lime-500' };
  if (rating >= 1800) return { name: 'Class A', color: 'from-yellow-600 to-orange-500' };
  if (rating >= 1600) return { name: 'Class B', color: 'from-orange-500 to-red-500' };
  if (rating >= 1400) return { name: 'Class C', color: 'from-rose-500 to-pink-500' };
  if (rating >= 1200) return { name: 'Class D', color: 'from-gray-400 to-slate-500' };
  return { name: 'Beginner', color: 'from-gray-300 to-gray-400' };
};

/**
 * Preview potential ELO changes before accepting a match
 * @param myRating - Your current rating
 * @param opponentRating - Opponent's current rating
 * @param myGamesPlayed - Your total games played (for K-factor)
 * @returns Object with potential changes for win, draw, and loss
 */
export const previewEloChanges = (
  myRating: number,
  opponentRating: number,
  myGamesPlayed: number = 30
): {
  win: number;
  draw: number;
  loss: number;
} => {
  const winChange = calculateNewRating(myRating, opponentRating, 1, myGamesPlayed) - myRating;
  const drawChange = calculateNewRating(myRating, opponentRating, 0.5, myGamesPlayed) - myRating;
  const lossChange = calculateNewRating(myRating, opponentRating, 0, myGamesPlayed) - myRating;
  
  return {
    win: winChange,
    draw: drawChange,
    loss: lossChange,
  };
};
