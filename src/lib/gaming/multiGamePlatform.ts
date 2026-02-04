/**
 * Multi-Game Platform Adapter
 * Scale beyond chess to any game type
 * 
 * For Alec Arthur Shelton - The Artist
 */

export interface GameState {
  id: string;
  type: string;
  players: string[];
  currentState: unknown;
  moves: unknown[];
  timestamp: number;
}

export interface GameAdapter {
  type: string;
  validateMove: (state: GameState, move: unknown) => boolean;
  applyMove: (state: GameState, move: unknown) => GameState;
  generateVisual: (state: GameState) => string;
  analyzePattern: (moves: unknown[]) => unknown;
}

// Universal game registry
class GamePlatform {
  private adapters = new Map<string, GameAdapter>();
  private activeGames = new Map<string, GameState>();

  registerAdapter(adapter: GameAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  createGame(type: string, players: string[]): string {
    const adapter = this.adapters.get(type);
    if (!adapter) throw new Error(`Unknown game type: ${type}`);

    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const game: GameState = {
      id,
      type,
      players,
      currentState: this.getInitialState(type),
      moves: [],
      timestamp: Date.now()
    };

    this.activeGames.set(id, game);
    return id;
  }

  makeMove(gameId: string, player: string, move: unknown): boolean {
    const game = this.activeGames.get(gameId);
    if (!game) return false;

    const adapter = this.adapters.get(game.type);
    if (!adapter) return false;

    if (!adapter.validateMove(game, move)) return false;

    const newState = adapter.applyMove(game, move);
    newState.moves.push({ player, move, timestamp: Date.now() });
    this.activeGames.set(gameId, newState);

    return true;
  }

  generateVision(gameId: string): string | null {
    const game = this.activeGames.get(gameId);
    if (!game) return null;

    const adapter = this.adapters.get(game.type);
    if (!adapter) return null;

    return adapter.generateVisual(game);
  }

  private getInitialState(type: string): unknown {
    const defaults: Record<string, unknown> = {
      chess: { board: 'initial', turn: 'white' },
      go: { board: Array(19).fill(Array(19).fill(0)), turn: 'black' },
      checkers: { board: 'initial', turn: 'red' },
      backgammon: { board: 'initial', dice: [0, 0] }
    };
    return defaults[type] || {};
  }
}

// Pattern recognition across all game types
export function extractUniversalPatterns(games: GameState[]): unknown[] {
  const patterns: unknown[] = [];

  games.forEach(game => {
    // Patterns extracted from game moves
    patterns.push({
      gameId: game.id,
      type: game.type,
      moveCount: game.moves.length,
      playerCount: game.players.length,
      timestamp: game.timestamp
    });
  });

  return patterns;
}

export const gamePlatform = new GamePlatform();
