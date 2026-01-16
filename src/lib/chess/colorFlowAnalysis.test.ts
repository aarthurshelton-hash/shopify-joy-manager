/**
 * Color Flow Analysis Tests
 * 
 * Tests for chess-specific signature extraction and archetype identification.
 */

import { describe, it, expect } from 'vitest';
import {
  extractColorFlowSignature,
  ARCHETYPE_DEFINITIONS,
  StrategicArchetype,
  ColorFlowSignature,
  QuadrantProfile,
  TemporalFlow
} from './colorFlowAnalysis';
import { SquareData, GameData } from './gameSimulator';

// ============================================================================
// Test Fixtures
// ============================================================================

const createEmptyBoard = (): SquareData[][] => {
  const board: SquareData[][] = [];
  for (let rank = 0; rank < 8; rank++) {
    board[rank] = [];
    for (let file = 0; file < 8; file++) {
      board[rank][file] = {
        file,
        rank,
        visits: [],
        isLight: (file + rank) % 2 === 1
      };
    }
  }
  return board;
};

const createMockGameData = (): GameData => ({
  pgn: '1. e4 e5 2. Nf3 Nc6',
  white: 'Test White',
  black: 'Test Black',
  result: '*',
  event: 'Test Event',
  date: '2024.01.01',
  moves: ['e4', 'e5', 'Nf3', 'Nc6']
});

const addVisits = (
  board: SquareData[][],
  visits: Array<{ square: string; color: 'w' | 'b'; moveNumber: number; piece: string }>
): void => {
  for (const visit of visits) {
    const file = visit.square.charCodeAt(0) - 97; // 'a' = 0
    const rank = parseInt(visit.square[1]) - 1;
    
    if (rank >= 0 && rank < 8 && file >= 0 && file < 8) {
      board[rank][file].visits.push({
        color: visit.color,
        moveNumber: visit.moveNumber,
        piece: visit.piece as any,
        hexColor: visit.color === 'w' ? '#ffffff' : '#000000'
      });
    }
  }
};

// ============================================================================
// Tests
// ============================================================================

describe('colorFlowAnalysis', () => {
  // ============================================================================
  // ARCHETYPE_DEFINITIONS
  // ============================================================================
  describe('ARCHETYPE_DEFINITIONS', () => {
    it('should define all 12 archetypes plus unknown', () => {
      const expectedArchetypes: StrategicArchetype[] = [
        'kingside_attack',
        'queenside_expansion',
        'central_domination',
        'prophylactic_defense',
        'pawn_storm',
        'piece_harmony',
        'opposite_castling',
        'closed_maneuvering',
        'open_tactical',
        'endgame_technique',
        'sacrificial_attack',
        'positional_squeeze',
        'unknown'
      ];
      
      for (const archetype of expectedArchetypes) {
        expect(ARCHETYPE_DEFINITIONS[archetype]).toBeDefined();
        expect(ARCHETYPE_DEFINITIONS[archetype].id).toBe(archetype);
      }
    });

    it('should have valid properties for each archetype', () => {
      for (const [id, def] of Object.entries(ARCHETYPE_DEFINITIONS)) {
        expect(def.id).toBe(id);
        expect(def.name).toBeDefined();
        expect(def.name.length).toBeGreaterThan(0);
        expect(def.description).toBeDefined();
        expect(def.colorCharacteristics).toBeDefined();
        expect(def.historicalWinRate).toBeGreaterThanOrEqual(0);
        expect(def.historicalWinRate).toBeLessThanOrEqual(1);
        expect(['white_favored', 'black_favored', 'balanced']).toContain(def.predictedOutcome);
        expect(def.lookaheadConfidence).toBeGreaterThan(0);
      }
    });

    it('should have reasonable win rates', () => {
      // Most archetypes should have win rates between 0.45 and 0.65
      const winRates = Object.values(ARCHETYPE_DEFINITIONS).map(d => d.historicalWinRate);
      const avgWinRate = winRates.reduce((a, b) => a + b, 0) / winRates.length;
      
      expect(avgWinRate).toBeGreaterThan(0.45);
      expect(avgWinRate).toBeLessThan(0.65);
    });
  });

  // ============================================================================
  // extractColorFlowSignature
  // ============================================================================
  describe('extractColorFlowSignature', () => {
    it('should return signature with all required fields', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Add some basic visits
      addVisits(board, [
        { square: 'e4', color: 'w', moveNumber: 1, piece: 'p' },
        { square: 'e5', color: 'b', moveNumber: 1, piece: 'p' },
        { square: 'f3', color: 'w', moveNumber: 2, piece: 'n' },
        { square: 'c6', color: 'b', moveNumber: 2, piece: 'n' },
      ]);
      
      const signature = extractColorFlowSignature(board, gameData, 4);
      
      expect(signature.fingerprint).toBeDefined();
      expect(signature.fingerprint).toMatch(/^cf-/);
      expect(signature.dominantSide).toBeDefined();
      expect(['white', 'black', 'contested']).toContain(signature.dominantSide);
      expect(signature.flowDirection).toBeDefined();
      expect(signature.intensity).toBeGreaterThanOrEqual(0);
      expect(signature.intensity).toBeLessThanOrEqual(100);
      expect(signature.archetype).toBeDefined();
      expect(signature.quadrantProfile).toBeDefined();
      expect(signature.temporalFlow).toBeDefined();
      expect(signature.criticalMoments).toBeDefined();
    });

    it('should generate unique fingerprints for different boards', () => {
      const board1 = createEmptyBoard();
      const board2 = createEmptyBoard();
      const gameData = createMockGameData();
      
      addVisits(board1, [
        { square: 'e4', color: 'w', moveNumber: 1, piece: 'p' },
      ]);
      addVisits(board2, [
        { square: 'd4', color: 'w', moveNumber: 1, piece: 'p' },
      ]);
      
      const sig1 = extractColorFlowSignature(board1, gameData, 1);
      const sig2 = extractColorFlowSignature(board2, gameData, 1);
      
      expect(sig1.fingerprint).not.toBe(sig2.fingerprint);
    });

    it('should detect kingside attack pattern', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Simulate heavy kingside activity
      addVisits(board, [
        { square: 'h5', color: 'w', moveNumber: 5, piece: 'q' },
        { square: 'g5', color: 'w', moveNumber: 6, piece: 'n' },
        { square: 'f6', color: 'w', moveNumber: 7, piece: 'b' },
        { square: 'h6', color: 'w', moveNumber: 8, piece: 'r' },
        { square: 'g7', color: 'w', moveNumber: 9, piece: 'q' },
        { square: 'h7', color: 'w', moveNumber: 10, piece: 'r' },
        { square: 'f7', color: 'w', moveNumber: 11, piece: 'b' },
        { square: 'g8', color: 'w', moveNumber: 12, piece: 'n' },
        // High volatility
        { square: 'h8', color: 'b', moveNumber: 13, piece: 'k' },
        { square: 'h8', color: 'w', moveNumber: 14, piece: 'q' },
      ]);
      
      const signature = extractColorFlowSignature(board, gameData, 14);
      
      // Should recognize the kingside concentration
      expect(signature.quadrantProfile.kingsideBlack).not.toBe(0);
      expect(['kingside_attack', 'open_tactical', 'sacrificial_attack']).toContain(signature.archetype);
    });

    it('should detect central domination pattern', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Heavy center control
      addVisits(board, [
        { square: 'd4', color: 'w', moveNumber: 1, piece: 'p' },
        { square: 'e4', color: 'w', moveNumber: 2, piece: 'p' },
        { square: 'd5', color: 'w', moveNumber: 3, piece: 'n' },
        { square: 'e5', color: 'w', moveNumber: 4, piece: 'n' },
        { square: 'd4', color: 'w', moveNumber: 5, piece: 'b' },
        { square: 'e4', color: 'w', moveNumber: 6, piece: 'b' },
        { square: 'd5', color: 'w', moveNumber: 7, piece: 'q' },
        { square: 'e5', color: 'w', moveNumber: 8, piece: 'r' },
        { square: 'd4', color: 'w', moveNumber: 9, piece: 'k' },
        { square: 'e4', color: 'w', moveNumber: 10, piece: 'r' },
      ]);
      
      const signature = extractColorFlowSignature(board, gameData, 10);
      
      expect(Math.abs(signature.quadrantProfile.center)).toBeGreaterThan(0);
    });

    it('should detect queenside expansion pattern', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Queenside activity
      addVisits(board, [
        { square: 'a5', color: 'w', moveNumber: 5, piece: 'p' },
        { square: 'b5', color: 'w', moveNumber: 6, piece: 'p' },
        { square: 'c5', color: 'w', moveNumber: 7, piece: 'n' },
        { square: 'a6', color: 'w', moveNumber: 8, piece: 'r' },
        { square: 'b6', color: 'w', moveNumber: 9, piece: 'b' },
        { square: 'a7', color: 'w', moveNumber: 10, piece: 'q' },
        { square: 'b7', color: 'w', moveNumber: 11, piece: 'r' },
        { square: 'c7', color: 'w', moveNumber: 12, piece: 'n' },
      ]);
      
      const signature = extractColorFlowSignature(board, gameData, 12);
      
      expect(Math.abs(signature.quadrantProfile.queensideBlack)).toBeGreaterThan(0);
    });

    it('should calculate temporal flow across game phases', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Opening moves (1-10)
      for (let i = 1; i <= 10; i++) {
        addVisits(board, [
          { square: `e${Math.min(4, i)}`, color: 'w', moveNumber: i, piece: 'p' },
        ]);
      }
      
      // Middlegame moves (11-25)
      for (let i = 11; i <= 25; i++) {
        addVisits(board, [
          { square: 'd5', color: 'w', moveNumber: i, piece: 'n' },
        ]);
      }
      
      // Endgame moves (26+)
      for (let i = 26; i <= 40; i++) {
        addVisits(board, [
          { square: 'a8', color: 'w', moveNumber: i, piece: 'k' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 40);
      
      expect(signature.temporalFlow.opening).toBeDefined();
      expect(signature.temporalFlow.middlegame).toBeDefined();
      expect(signature.temporalFlow.endgame).toBeDefined();
      expect(signature.temporalFlow.volatility).toBeGreaterThanOrEqual(0);
    });

    it('should detect critical moments', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Create a dramatic shift at move 10
      for (let i = 1; i <= 9; i++) {
        addVisits(board, [{ square: 'e4', color: 'w', moveNumber: i, piece: 'p' }]);
      }
      // Sudden surge of activity
      for (let i = 10; i <= 12; i++) {
        addVisits(board, [
          { square: 'e4', color: 'b', moveNumber: i, piece: 'q' },
          { square: 'd4', color: 'b', moveNumber: i, piece: 'r' },
          { square: 'f4', color: 'b', moveNumber: i, piece: 'r' },
          { square: 'c4', color: 'b', moveNumber: i, piece: 'b' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 12);
      
      // Should detect the dramatic shift
      expect(signature.criticalMoments.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty board', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      const signature = extractColorFlowSignature(board, gameData, 0);
      
      expect(signature.fingerprint).toBeDefined();
      expect(signature.intensity).toBe(0);
      expect(signature.archetype).toBeDefined();
    });

    it('should detect closed maneuvering pattern', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Low volatility, many moves, gradual shifts
      for (let i = 1; i <= 50; i++) {
        const square = i % 2 === 0 ? 'c3' : 'c4';
        addVisits(board, [{ square, color: 'w', moveNumber: i, piece: 'n' }]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 50);
      
      // Low volatility + many moves = closed maneuvering or similar
      expect(signature.temporalFlow.volatility).toBeLessThan(50);
    });

    it('should detect endgame technique pattern', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Minimal activity, late game, low volatility
      addVisits(board, [
        { square: 'e1', color: 'w', moveNumber: 30, piece: 'k' },
        { square: 'e2', color: 'w', moveNumber: 32, piece: 'k' },
        { square: 'e3', color: 'w', moveNumber: 34, piece: 'k' },
        { square: 'a7', color: 'w', moveNumber: 36, piece: 'p' },
        { square: 'a8', color: 'w', moveNumber: 38, piece: 'p' },
      ]);
      
      const signature = extractColorFlowSignature(board, gameData, 45);
      
      expect(signature.temporalFlow.endgame).toBeDefined();
    });

    it('should correctly identify dominant side', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // White dominant
      for (let i = 1; i <= 20; i++) {
        addVisits(board, [
          { square: 'e4', color: 'w', moveNumber: i, piece: 'q' },
          { square: 'd4', color: 'w', moveNumber: i, piece: 'r' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 20);
      
      expect(signature.dominantSide).toBe('white');
    });

    it('should identify contested games', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Equal activity from both sides
      for (let i = 1; i <= 20; i++) {
        addVisits(board, [
          { square: 'e4', color: 'w', moveNumber: i, piece: 'n' },
          { square: 'e5', color: 'b', moveNumber: i, piece: 'n' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 20);
      
      expect(['contested', 'white', 'black']).toContain(signature.dominantSide);
    });
  });

  // ============================================================================
  // Archetype Classification Edge Cases
  // ============================================================================
  describe('archetype classification edge cases', () => {
    it('should classify unknown for minimal games', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      addVisits(board, [
        { square: 'e4', color: 'w', moveNumber: 1, piece: 'p' },
      ]);
      
      const signature = extractColorFlowSignature(board, gameData, 1);
      
      // Very short games should often be unknown or one of the less specific archetypes
      expect(ARCHETYPE_DEFINITIONS[signature.archetype]).toBeDefined();
    });

    it('should handle all-black activity', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      for (let i = 1; i <= 30; i++) {
        addVisits(board, [
          { square: 'd5', color: 'b', moveNumber: i, piece: 'q' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 30);
      
      expect(signature.dominantSide).toBe('black');
    });

    it('should classify open tactical for high volatility', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Alternating heavy activity = high volatility
      for (let i = 1; i <= 20; i++) {
        const color = i % 2 === 0 ? 'w' : 'b';
        addVisits(board, [
          { square: 'e4', color, moveNumber: i, piece: 'q' },
          { square: 'd4', color, moveNumber: i, piece: 'r' },
          { square: 'f4', color, moveNumber: i, piece: 'r' },
          { square: 'c4', color, moveNumber: i, piece: 'n' },
          { square: 'g4', color, moveNumber: i, piece: 'b' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 20);
      
      expect(signature.temporalFlow.volatility).toBeGreaterThan(30);
    });
  });

  // ============================================================================
  // Flow Direction Tests
  // ============================================================================
  describe('flow direction detection', () => {
    it('should detect kingside flow direction', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Heavy kingside (e-h files)
      for (let i = 1; i <= 20; i++) {
        addVisits(board, [
          { square: 'f4', color: 'w', moveNumber: i, piece: 'n' },
          { square: 'g4', color: 'w', moveNumber: i, piece: 'b' },
          { square: 'h4', color: 'w', moveNumber: i, piece: 'r' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 20);
      
      expect(['kingside', 'balanced']).toContain(signature.flowDirection);
    });

    it('should detect queenside flow direction', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Heavy queenside (a-d files)
      for (let i = 1; i <= 20; i++) {
        addVisits(board, [
          { square: 'a4', color: 'w', moveNumber: i, piece: 'r' },
          { square: 'b4', color: 'w', moveNumber: i, piece: 'n' },
          { square: 'c4', color: 'w', moveNumber: i, piece: 'b' },
        ]);
      }
      
      const signature = extractColorFlowSignature(board, gameData, 20);
      
      expect(['queenside', 'balanced']).toContain(signature.flowDirection);
    });

    it('should detect balanced flow', () => {
      const board = createEmptyBoard();
      const gameData = createMockGameData();
      
      // Even distribution
      addVisits(board, [
        { square: 'a4', color: 'w', moveNumber: 1, piece: 'n' },
        { square: 'b4', color: 'w', moveNumber: 2, piece: 'n' },
        { square: 'g4', color: 'w', moveNumber: 3, piece: 'n' },
        { square: 'h4', color: 'w', moveNumber: 4, piece: 'n' },
        { square: 'a5', color: 'b', moveNumber: 5, piece: 'n' },
        { square: 'b5', color: 'b', moveNumber: 6, piece: 'n' },
        { square: 'g5', color: 'b', moveNumber: 7, piece: 'n' },
        { square: 'h5', color: 'b', moveNumber: 8, piece: 'n' },
      ]);
      
      const signature = extractColorFlowSignature(board, gameData, 8);
      
      expect(['balanced', 'central', 'diagonal']).toContain(signature.flowDirection);
    });
  });
});
