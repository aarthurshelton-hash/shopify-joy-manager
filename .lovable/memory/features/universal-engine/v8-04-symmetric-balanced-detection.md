# Memory: features/universal-engine/v8-04-symmetric-balanced-detection
Updated: now

## v8.04-SYMMETRIC: Truly Balanced Detection

### Problem Identified
After v8.03's aggressive black-favoring adjustments, the bias oscillated in the opposite direction:
- Our wins became white-only
- Stockfish wins became black/draws
- The system was ping-ponging between biases instead of achieving true balance

### Root Cause
Attempting to "fix" color bias by artificially favoring one color over another creates oscillation. Each "fix" overcorrects, leading to the opposite problem.

### Solution: Pure Symmetric Detection

**signatureExtractor.ts (determineDominantSide):**
- `FIRST_MOVE_OFFSET`: Reduced to **15** (minimal, not aggressive)
- Detection based on actual attacking territory:
  - White attacking black's territory = white aggression
  - Black attacking white's territory = black aggression
- `DOMINANCE_THRESHOLD`: **20** (identical for both colors)
- Combines three signals with equal weight: attacking territory, center control, overall balance

**equilibriumPredictor.ts (calculateControlSignal):**
- `contested` outcomes are truly neutral: `{ white: 33, black: 33, draw: 34 }`
- No artificial skewing in either direction
- Let Stockfish evaluation be the tiebreaker for edge cases

### Philosophy
Instead of trying to predict which color "should" win more, detect who is actually attacking and let the board speak for itself. The system should achieve high accuracy across ALL outcomes by being genuinely unbiased.

### Expected Behavior
- Balanced prediction distribution that reflects actual game patterns
- High accuracy on white wins, black wins, AND draws
- No oscillation between color biases
