# Memory: features/chess-analysis/hybrid-prediction-system-v1

The platform now features a revolutionary **Hybrid Prediction System** that fuses Stockfish 17 NNUE tactical analysis with Color Flow strategic trajectory prediction.

## Core Components

1. **useHybridPrediction Hook** (`src/hooks/useHybridPrediction.ts`): Orchestrates the full analysis pipeline with progress tracking
2. **HybridPredictionPanel** (`src/components/chess/HybridPredictionPanel.tsx`): Visual display of fused predictions in Analytics tab
3. **TrajectoryTimelineOverlay** (`src/components/chess/TrajectoryTimelineOverlay.tsx`): Live milestone visualization on game sliders
4. **colorFlowAnalysis.ts**: Extracts Color Flow Signatures with 12 strategic archetypes
5. **patternLearning.ts**: In-memory pattern matching with similarity scoring
6. **patternPersistence.ts**: Supabase persistence to `color_flow_patterns` table for cross-user learning
7. **hybridPrediction.ts**: Core fusion engine combining tactical + strategic insights

## Strategic Archetypes (12 Types)
- kingside_attack, queenside_attack, central_domination
- piece_activity, pawn_structure, endgame_technique
- prophylaxis, space_advantage, material_advantage
- dynamic_play, positional_squeeze, tactical_chaos

## Integration Points
- UnifiedVisionExperience: Auto-analyzes PGN on load, passes predictions to timeline components
- VerticalTimelineSlider: Shows trajectory milestones on vertical slider
- TimelineControls: Shows trajectory milestones on horizontal progress bar
- Analytics Tab: Displays full HybridPredictionPanel with confidence scores

## Database
- `color_flow_patterns` table stores fingerprints, archetypes, outcomes, and game metadata
- RLS policies allow public read, authenticated insert, user-owned delete
- Enables cross-user pattern learning and 80-move trajectory prediction
