/**
 * Data Integrity Validator for Terminal Workers
 * Ensures all benchmark data meets quality standards before database insertion
 */

import { Chess } from 'chess.js';

export class DataIntegrityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a complete prediction attempt record
   */
  validatePredictionAttempt(attempt) {
    this.errors = [];
    this.warnings = [];

    // Required fields
    this.validateRequiredFields(attempt);
    
    // Game ID format
    this.validateGameId(attempt.gameId);
    
    // FEN format
    this.validateFen(attempt.fen);
    
    // Prediction values
    this.validatePredictionValues(attempt);
    
    // Confidence ranges
    this.validateConfidenceRanges(attempt);
    
    // Data quality tier
    this.validateDataQualityTier(attempt.dataQualityTier);
    
    // Position hash
    this.validatePositionHash(attempt.positionHash);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  validateRequiredFields(attempt) {
    const required = ['gameId', 'actualResult', 'hybridPrediction', 'stockfishPrediction'];
    
    for (const field of required) {
      if (!attempt[field]) {
        this.errors.push(`Missing required field: ${field}`);
      }
    }
  }

  validateGameId(gameId) {
    if (!gameId) return;
    
    // Must be at least 8 characters
    if (gameId.length < 8) {
      this.errors.push(`Game ID too short: ${gameId} (min 8 chars)`);
    }
    
    // Must be alphanumeric with optional underscores/hyphens
    if (!/^[a-zA-Z0-9_-]+$/.test(gameId)) {
      this.errors.push(`Invalid game ID format: ${gameId}`);
    }
    
    // Check for common placeholder patterns
    if (gameId.includes('test') || gameId.includes('mock') || gameId.includes('placeholder')) {
      this.warnings.push(`Suspicious game ID pattern: ${gameId}`);
    }
  }

  validateFen(fen) {
    if (!fen) {
      this.errors.push('FEN is required');
      return;
    }
    
    // Basic FEN structure: 6 space-separated parts
    const parts = fen.split(' ');
    if (parts.length !== 6) {
      this.errors.push(`Invalid FEN format: expected 6 parts, got ${parts.length}`);
      return;
    }
    
    const [board, turn, castling, enPassant, halfmove, fullmove] = parts;
    
    // Validate board part (ranks separated by /)
    const ranks = board.split('/');
    if (ranks.length !== 8) {
      this.errors.push(`Invalid FEN board: expected 8 ranks, got ${ranks.length}`);
    }
    
    // Validate turn
    if (!/^[wb]$/.test(turn)) {
      this.errors.push(`Invalid FEN turn: ${turn}`);
    }
    
    // Validate castling
    if (!/^[KQkq-]+$/.test(castling)) {
      this.errors.push(`Invalid FEN castling: ${castling}`);
    }
    
    // Validate en passant
    if (!/^[a-h36-]$/.test(enPassant)) {
      this.errors.push(`Invalid FEN en passant: ${enPassant}`);
    }
    
    // Check for starting position (common placeholder)
    if (fen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      this.warnings.push('FEN is starting position - verify this is intentional');
    }
    
    // Try to validate with chess.js if available
    try {
      const chess = new Chess();
      if (!chess.load(fen)) {
        this.errors.push('FEN rejected by chess.js parser');
      }
    } catch (e) {
      // chess.js not available or validation failed
    }
  }

  validatePredictionValues(attempt) {
    const validOutcomes = ['white_wins', 'black_wins', 'draw'];
    
    if (!validOutcomes.includes(attempt.hybridPrediction)) {
      this.errors.push(`Invalid hybrid prediction: ${attempt.hybridPrediction}`);
    }
    
    if (!validOutcomes.includes(attempt.stockfishPrediction)) {
      this.errors.push(`Invalid stockfish prediction: ${attempt.stockfishPrediction}`);
    }
    
    if (!validOutcomes.includes(attempt.actualResult)) {
      this.errors.push(`Invalid actual result: ${attempt.actualResult}`);
    }
  }

  validateConfidenceRanges(attempt) {
    const hybridConf = attempt.hybridConfidence;
    const stockfishConf = attempt.stockfishConfidence;
    
    if (hybridConf !== undefined && hybridConf !== null) {
      if (hybridConf < 0 || hybridConf > 100) {
        this.errors.push(`Hybrid confidence out of range: ${hybridConf}`);
      }
      if (hybridConf === 0) {
        this.warnings.push('Hybrid confidence is 0');
      }
    }
    
    if (stockfishConf !== undefined && stockfishConf !== null) {
      if (stockfishConf < 0 || stockfishConf > 100) {
        this.errors.push(`Stockfish confidence out of range: ${stockfishConf}`);
      }
      if (stockfishConf === 0) {
        this.warnings.push('Stockfish confidence is 0');
      }
    }
  }

  validateDataQualityTier(tier) {
    const validTiers = [
      'high_confidence',
      'medium_confidence',
      'low_confidence',
      'terminal_live',
      'legacy',
      'farm_generated',
      'puzzle_source'
    ];
    
    if (tier && !validTiers.includes(tier)) {
      this.errors.push(`Invalid data quality tier: ${tier}`);
    }
    
    // For terminal workers, should be 'terminal_live' for real data
    if (tier === 'farm_generated') {
      this.warnings.push('Using farm_generated tier - ensure data is not simulated');
    }
  }

  validatePositionHash(hash) {
    if (!hash) {
      this.warnings.push('Position hash is missing');
      return;
    }
    
    // Should be 16 hex characters
    if (!/^[a-f0-9]{16}$/i.test(hash)) {
      this.errors.push(`Invalid position hash format: ${hash}`);
    }
  }

  /**
   * Sanitize a prediction attempt to ensure it's safe for database insertion
   */
  sanitizeAttempt(attempt) {
    return {
      ...attempt,
      // Ensure gameId is trimmed
      gameId: attempt.gameId?.trim(),
      // Ensure FEN is normalized
      fen: attempt.fen?.trim(),
      // Ensure predictions are lowercase
      hybridPrediction: attempt.hybridPrediction?.toLowerCase(),
      stockfishPrediction: attempt.stockfishPrediction?.toLowerCase(),
      actualResult: attempt.actualResult?.toLowerCase(),
      // Set default data quality tier if missing
      dataQualityTier: attempt.dataQualityTier || 'terminal_live'
    };
  }

  /**
   * Generate a consistent position hash from FEN
   */
  static generatePositionHash(fen) {
    if (!fen) return null;
    
    // Use first 4 parts of FEN (position, turn, castling, en passant)
    const positionPart = fen.split(' ').slice(0, 4).join(' ');
    
    // Simple hash: DJB2 variant
    let hash1 = 5381;
    let hash2 = 52711;
    
    for (let i = 0; i < positionPart.length; i++) {
      const char = positionPart.charCodeAt(i);
      hash1 = ((hash1 << 5) + hash1) ^ char;
      hash2 = ((hash2 << 5) + hash2) ^ char;
      hash1 = hash1 >>> 0;
      hash2 = hash2 >>> 0;
    }
    
    return hash1.toString(16).padStart(8, '0') + hash2.toString(16).padStart(8, '0');
  }
}

// Export singleton instance for convenience
export const validator = new DataIntegrityValidator();

// Helper function for quick validation
export function validateAndSanitize(attempt) {
  const validator = new DataIntegrityValidator();
  const validation = validator.validatePredictionAttempt(attempt);
  
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  return validator.sanitizeAttempt(attempt);
}

export default DataIntegrityValidator;
