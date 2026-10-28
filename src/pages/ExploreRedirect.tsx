import { Navigate } from 'react-router-dom';
import { famousGames } from '@/lib/chess/famousGames';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { DEFAULT_REVIEW_GAME_ID } from '@/components/chess/MoreGamesBrowser';

const ExploreRedirect = () => {
  const game = famousGames.find((g) => g.id === DEFAULT_REVIEW_GAME_ID) ?? famousGames[0];
  return <Navigate to={`/g/${generateGameHash(game.pgn)}?src=famous#more-games`} replace />;
};

export default ExploreRedirect;
