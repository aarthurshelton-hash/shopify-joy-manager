// Game images mapping - maps game IDs to their artwork
export const gameImages: Record<string, string> = {
  'kasparov-topalov-1999': '/src/assets/games/kasparov-immortal.jpg',
  'byrne-fischer-1956': '/src/assets/games/game-of-century.jpg',
  'anderssen-kieseritzky-1851': '/src/assets/games/immortal-game.jpg',
  'deep-blue-kasparov-1997': '/src/assets/games/deep-blue.jpg',
  'spassky-fischer-1972': '/src/assets/games/fischer-spassky.jpg',
  'lasker-thomas-1912': '/src/assets/games/king-hunt.jpg',
  'morphy-opera-1858': '/src/assets/games/opera-game.jpg',
  'oldest-recorded-1475': '/src/assets/games/oldest-game.jpg',
  'carlsen-anand-2013': '/src/assets/games/carlsen-champion.jpg',
  'botvinnik-capablanca-1938': '/src/assets/games/botvinnik-brilliance.jpg',
};

// Import images for ES6 module usage
import kasparovImmortal from '@/assets/games/kasparov-immortal.jpg';
import gameOfCentury from '@/assets/games/game-of-century.jpg';
import immortalGame from '@/assets/games/immortal-game.jpg';
import deepBlue from '@/assets/games/deep-blue.jpg';
import fischerSpassky from '@/assets/games/fischer-spassky.jpg';
import kingHunt from '@/assets/games/king-hunt.jpg';
import operaGame from '@/assets/games/opera-game.jpg';
import oldestGame from '@/assets/games/oldest-game.jpg';
import carlsenChampion from '@/assets/games/carlsen-champion.jpg';
import botvinnikBrilliance from '@/assets/games/botvinnik-brilliance.jpg';

export const gameImageImports: Record<string, string> = {
  'kasparov-topalov-1999': kasparovImmortal,
  'byrne-fischer-1956': gameOfCentury,
  'anderssen-kieseritzky-1851': immortalGame,
  'deep-blue-kasparov-1997': deepBlue,
  'spassky-fischer-1972': fischerSpassky,
  'lasker-thomas-1912': kingHunt,
  'morphy-opera-1858': operaGame,
  'oldest-recorded-1475': oldestGame,
  'carlsen-anand-2013': carlsenChampion,
  'botvinnik-capablanca-1938': botvinnikBrilliance,
};
