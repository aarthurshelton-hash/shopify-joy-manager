"""
En Pensent — Color-Flow Feature Extractor (Python)
============================================================================

Replicates the key features from the TypeScript enhanced signature extractor
in Python, using python-chess for board manipulation.

Extracts ~50 numeric features from a FEN:
  - 8-quadrant piece dominance (kingside/queenside/center × white/black)
  - Piece-type dominance ratios (bishop, knight, rook, queen, pawn)
  - Temporal flow proxy (from piece development patterns)
  - King safety metrics
  - Pawn structure metrics
  - Capture/material tension
  - Board control metrics
  - Mobility and trajectory proxies

These features augment the existing EP/SF/Maia signals to give the
neural network a richer representation of the position.

============================================================================
"""

import chess
import numpy as np
from typing import Dict, List, Tuple, Optional


# ─────────────────────────────────────────────────────────────
# BOARD QUADRANT MAPPING
# ─────────────────────────────────────────────────────────────

# 8 quadrants of the board:
# Q1: kingside white (e1-h4)    Q2: queenside white (a1-d4)
# Q3: kingside black (e5-h8)    Q4: queenside black (a5-d8)
# Q5: center white (d1-e4)      Q6: center black (d5-e8)
# Q7: extended kingside         Q8: extended queenside

def square_in_quadrant(sq: int) -> int:
    """Map a square (0-63) to quadrant 1-8."""
    file = chess.square_file(sq)  # 0-7 (a-h)
    rank = chess.square_rank(sq)  # 0-7 (1-8)

    is_white_side = rank <= 3  # ranks 1-4
    is_kingside = file >= 4    # files e-h
    is_center = (file >= 3 and file <= 4) and (rank >= 3 and rank <= 4)

    if is_center:
        return 5 if is_white_side else 6
    if is_white_side:
        return 1 if is_kingside else 2
    else:
        return 3 if is_kingside else 4


def piece_type_weight(piece: chess.Piece) -> float:
    """Weight for each piece type in dominance calculation."""
    weights = {
        chess.PAWN: 1.0,
        chess.KNIGHT: 3.0,
        chess.BISHOP: 3.2,
        chess.ROOK: 5.0,
        chess.QUEEN: 9.0,
        chess.KING: 2.0,  # King has positional value, not material
    }
    return weights.get(piece.piece_type, 0.0)


# ─────────────────────────────────────────────────────────────
# FEATURE EXTRACTION
# ─────────────────────────────────────────────────────────────

def extract_color_flow_features(fen: str) -> Dict[str, float]:
    """
    Extract ~50 color-flow features from a FEN position.

    Args:
        fen: FEN string

    Returns:
        Dictionary of feature name → float value
    """
    try:
        board = chess.Board(fen)
    except Exception:
        return {}

    features = {}

    # ── 1. Quadrant piece dominance ──
    quadrant_white_weight = np.zeros(8)
    quadrant_black_weight = np.zeros(8)
    quadrant_white_count = np.zeros(8)
    quadrant_black_count = np.zeros(8)

    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece is None:
            continue
        q = square_in_quadrant(sq) - 1  # 0-indexed
        w = piece_type_weight(piece)
        if piece.color == chess.WHITE:
            quadrant_white_weight[q] += w
            quadrant_white_count[q] += 1
        else:
            quadrant_black_weight[q] += w
            quadrant_black_count[q] += 1

    total_weight = quadrant_white_weight + quadrant_black_weight + 1e-6
    quadrant_dominance = (quadrant_white_weight - quadrant_black_weight) / total_weight

    for i in range(8):
        features[f'q{i+1}_dominance'] = float(quadrant_dominance[i])
        features[f'q{i+1}_white_weight'] = float(quadrant_white_weight[i])
        features[f'q{i+1}_black_weight'] = float(quadrant_black_weight[i])
        features[f'q{i+1}_white_count'] = float(quadrant_white_count[i])
        features[f'q{i+1}_black_count'] = float(quadrant_black_count[i])

    # ── 2. Piece-type dominance ratios ──
    piece_type_white = np.zeros(6)  # P, N, B, R, Q, K
    piece_type_black = np.zeros(6)
    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece is None:
            continue
        idx = piece.piece_type - 1
        if piece.color == chess.WHITE:
            piece_type_white[idx] += 1
        else:
            piece_type_black[idx] += 1

    piece_names = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']
    for i, name in enumerate(piece_names):
        total = piece_type_white[i] + piece_type_black[i] + 1e-6
        features[f'{name}_dominance'] = float((piece_type_white[i] - piece_type_black[i]) / total)
        features[f'{name}_white_count'] = float(piece_type_white[i])
        features[f'{name}_black_count'] = float(piece_type_black[i])

    # ── 3. Material balance ──
    material_values = [1, 3, 3.2, 5, 9, 0]
    white_material = sum(piece_type_white[i] * material_values[i] for i in range(6))
    black_material = sum(piece_type_black[i] * material_values[i] for i in range(6))
    features['material_balance'] = float(white_material - black_material)
    features['material_total'] = float(white_material + black_material)
    features['material_advantage_white'] = float(max(0, white_material - black_material))
    features['material_advantage_black'] = float(max(0, black_material - white_material))

    # ── 4. King safety metrics ──
    white_king_sq = board.king(chess.WHITE)
    black_king_sq = board.king(chess.BLACK)

    if white_king_sq is not None:
        wk_file = chess.square_file(white_king_sq)
        wk_rank = chess.square_rank(white_king_sq)
        features['white_king_file'] = float(wk_file)
        features['white_king_rank'] = float(wk_rank)
        features['white_king_kingside'] = 1.0 if wk_file >= 4 else 0.0
        features['white_king_queenside'] = 1.0 if wk_file < 4 else 0.0
        features['white_king_castled'] = 1.0 if (wk_file in [6, 2] and wk_rank == 0) else 0.0
        # Pawn shield
        pawn_shield = 0
        for df in [-1, 0, 1]:
            for dr in [1, 2]:
                f, r = wk_file + df, wk_rank + dr
                if 0 <= f <= 7 and 0 <= r <= 7:
                    sq = chess.square(f, r)
                    p = board.piece_at(sq)
                    if p and p.piece_type == chess.PAWN and p.color == chess.WHITE:
                        pawn_shield += 1
        features['white_pawn_shield'] = float(pawn_shield)
    else:
        features['white_king_file'] = 4.0
        features['white_king_rank'] = 0.0
        features['white_king_kingside'] = 0.5
        features['white_king_queenside'] = 0.5
        features['white_king_castled'] = 0.0
        features['white_pawn_shield'] = 0.0

    if black_king_sq is not None:
        bk_file = chess.square_file(black_king_sq)
        bk_rank = chess.square_rank(black_king_sq)
        features['black_king_file'] = float(bk_file)
        features['black_king_rank'] = float(bk_rank)
        features['black_king_kingside'] = 1.0 if bk_file >= 4 else 0.0
        features['black_king_queenside'] = 1.0 if bk_file < 4 else 0.0
        features['black_king_castled'] = 1.0 if (bk_file in [6, 2] and bk_rank == 7) else 0.0
        pawn_shield = 0
        for df in [-1, 0, 1]:
            for dr in [-1, -2]:
                f, r = bk_file + df, bk_rank + dr
                if 0 <= f <= 7 and 0 <= r <= 7:
                    sq = chess.square(f, r)
                    p = board.piece_at(sq)
                    if p and p.piece_type == chess.PAWN and p.color == chess.BLACK:
                        pawn_shield += 1
        features['black_pawn_shield'] = float(pawn_shield)
    else:
        features['black_king_file'] = 4.0
        features['black_king_rank'] = 7.0
        features['black_king_kingside'] = 0.5
        features['black_king_queenside'] = 0.5
        features['black_king_castled'] = 0.0
        features['black_pawn_shield'] = 0.0

    features['king_safety_delta'] = features['white_pawn_shield'] - features['black_pawn_shield']
    features['both_castled'] = 1.0 if (features['white_king_castled'] and features['black_king_castled']) else 0.0
    features['opposite_castling'] = 1.0 if (features['white_king_kingside'] != features['black_king_kingside']) else 0.0

    # ── 5. Pawn structure metrics ──
    white_pawn_files = [[] for _ in range(8)]
    black_pawn_files = [[] for _ in range(8)]
    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece and piece.piece_type == chess.PAWN:
            f = chess.square_file(sq)
            r = chess.square_rank(sq)
            if piece.color == chess.WHITE:
                white_pawn_files[f].append(r)
            else:
                black_pawn_files[f].append(r)

    white_doubled = sum(1 for ranks in white_pawn_files if len(ranks) > 1)
    black_doubled = sum(1 for ranks in black_pawn_files if len(ranks) > 1)
    white_islands = sum(1 for f in range(8) if white_pawn_files[f] and
                        (f == 0 or not white_pawn_files[f-1]))
    black_islands = sum(1 for f in range(8) if black_pawn_files[f] and
                        (f == 0 or not black_pawn_files[f-1]))

    # Passed pawns (simplified: no enemy pawn on same or adjacent files ahead)
    white_passed = 0
    black_passed = 0
    for f in range(8):
        for r in white_pawn_files[f]:
            is_passed = True
            for df in [-1, 0, 1]:
                af = f + df
                if 0 <= af <= 7:
                    for br in black_pawn_files[af]:
                        if br > r:
                            is_passed = False
                            break
                    if not is_passed: break
            if is_passed: white_passed += 1
        for r in black_pawn_files[f]:
            is_passed = True
            for df in [-1, 0, 1]:
                af = f + df
                if 0 <= af <= 7:
                    for wr in white_pawn_files[af]:
                        if wr < r:
                            is_passed = False
                            break
                    if not is_passed: break
            if is_passed: black_passed += 1

    features['white_doubled_pawns'] = float(white_doubled)
    features['black_doubled_pawns'] = float(black_doubled)
    features['white_pawn_islands'] = float(white_islands)
    features['black_pawn_islands'] = float(black_islands)
    features['white_passed_pawns'] = float(white_passed)
    features['black_passed_pawns'] = float(black_passed)
    features['pawn_structure_delta'] = float(
        (black_doubled - white_doubled) + (black_islands - white_islands) + (white_passed - black_passed)
    )

    # ── 6. Center control ──
    center_squares = [chess.D4, chess.E4, chess.D5, chess.E5, chess.C4, chess.F4, chess.C5, chess.F5]
    white_center = 0
    black_center = 0
    for sq in center_squares:
        piece = board.piece_at(sq)
        if piece:
            w = piece_type_weight(piece)
            if piece.color == chess.WHITE:
                white_center += w
            else:
                black_center += w
    features['center_control_white'] = float(white_center)
    features['center_control_black'] = float(black_center)
    features['center_control_delta'] = float(white_center - black_center)

    # ── 7. Mobility ──
    # Count legal moves (proxy for activity)
    turn = board.turn
    board.turn = chess.WHITE
    white_mobility = board.legal_moves.count()
    board.turn = chess.BLACK
    black_mobility = board.legal_moves.count()
    board.turn = turn  # restore

    features['white_mobility'] = float(white_mobility)
    features['black_mobility'] = float(black_mobility)
    features['mobility_delta'] = float(white_mobility - black_mobility)
    features['mobility_total'] = float(white_mobility + black_mobility)

    # ── 8. Attack zones (how many pieces attack each zone) ──
    white_attacks_kingside = 0
    white_attacks_queenside = 0
    black_attacks_kingside = 0
    black_attacks_queenside = 0

    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece is None:
            continue
        # Simplified: count pieces in opponent's half
        f = chess.square_file(sq)
        r = chess.square_rank(sq)
        if piece.color == chess.WHITE and r >= 4:  # White piece in black's half
            if f >= 4:
                white_attacks_kingside += 1
            else:
                white_attacks_queenside += 1
        elif piece.color == chess.BLACK and r <= 3:  # Black piece in white's half
            if f >= 4:
                black_attacks_kingside += 1
            else:
                black_attacks_queenside += 1

    features['white_attack_kingside'] = float(white_attacks_kingside)
    features['white_attack_queenside'] = float(white_attacks_queenside)
    features['black_attack_kingside'] = float(black_attacks_kingside)
    features['black_attack_queenside'] = float(black_attacks_queenside)
    features['attack_delta_kingside'] = float(white_attacks_kingside - black_attacks_kingside)
    features['attack_delta_queenside'] = float(white_attacks_queenside - black_attacks_queenside)

    # ── 9. Piece development (how many minor pieces have moved from starting squares) ──
    white_developed = 0
    black_developed = 0
    # Knights and bishops off their starting squares
    white_minor_squares = [chess.B1, chess.G1, chess.C1, chess.F1]
    black_minor_squares = [chess.B8, chess.G8, chess.C8, chess.F8]
    for sq in white_minor_squares:
        p = board.piece_at(sq)
        if p is None or p.color != chess.WHITE or p.piece_type not in [chess.KNIGHT, chess.BISHOP]:
            white_developed += 1
    for sq in black_minor_squares:
        p = board.piece_at(sq)
        if p is None or p.color != chess.BLACK or p.piece_type not in [chess.KNIGHT, chess.BISHOP]:
            black_developed += 1
    features['white_development'] = float(white_developed)
    features['black_development'] = float(black_developed)
    features['development_delta'] = float(white_developed - black_developed)

    # ── 10. Board complexity (entropy of piece distribution) ──
    quadrant_counts = quadrant_white_count + quadrant_black_count
    total_pieces = sum(quadrant_counts)
    if total_pieces > 0:
        probs = quadrant_counts / total_pieces
        probs = probs[probs > 0]
        entropy = -np.sum(probs * np.log2(probs + 1e-10))
    else:
        entropy = 0.0
    features['board_entropy'] = float(entropy)
    features['piece_density'] = float(total_pieces / 8.0)  # avg pieces per quadrant

    # ── 11. Turn (whose move) ──
    features['white_to_move'] = 1.0 if board.turn == chess.WHITE else 0.0

    # ── 12. Check status ──
    features['in_check'] = 1.0 if board.is_check() else 0.0

    # ── 13. FEN move number proxy (from fullmove part of FEN) ──
    try:
        fen_parts = fen.split()
        if len(fen_parts) >= 6:
            features['fen_move_number'] = float(int(fen_parts[5]))
        else:
            features['fen_move_number'] = 20.0
    except:
        features['fen_move_number'] = 20.0

    return features


# ─────────────────────────────────────────────────────────────
# BATCH FEATURE EXTRACTION
# ─────────────────────────────────────────────────────────────

def extract_features_batch(fens: List[str], show_progress: bool = True) -> Tuple[np.ndarray, List[str]]:
    """
    Extract color-flow features for a list of FENs.

    Returns:
        X: (n, d) feature matrix
        feature_names: list of feature names
    """
    all_features = []
    feature_names = None

    for i, fen in enumerate(fens):
        feats = extract_color_flow_features(fen)
        if not feats:
            feats = {k: 0.0 for k in (feature_names or [])}
        if feature_names is None and feats:
            feature_names = sorted(feats.keys())
        all_features.append(feats)

        if show_progress and (i + 1) % 5000 == 0:
            print(f"  Extracted features for {i+1}/{len(fens)} positions...")

    # Convert to matrix
    X = np.zeros((len(fens), len(feature_names)))
    for i, feats in enumerate(all_features):
        for j, name in enumerate(feature_names):
            X[i, j] = feats.get(name, 0.0)

    return X, feature_names


# ─────────────────────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Test with a few positions
    test_fens = [
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",  # starting
        "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 4 4",  # Italian
        "r4bk1/1p3b1Q/p1q2p2/3p4/3P4/2P3r1/P1BN1PPP/4R1K1 b - - 0 25",  # middlegame
    ]

    for fen in test_fens:
        print(f"\nFEN: {fen}")
        feats = extract_color_flow_features(fen)
        print(f"  Features: {len(feats)}")
        for k, v in sorted(feats.items()):
            print(f"    {k}: {v:.3f}")
