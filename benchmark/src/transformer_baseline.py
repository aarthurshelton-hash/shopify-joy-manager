#!/usr/bin/env python3
"""
En Pensent — Transformer Baseline Experiment
=============================================

Implements the experiment specified in benchmark/docs/transformer_baseline_spec.md.

Models:
  A: PGN move-token transformer (primary learned baseline)
  B: Board-state tensor transformer (AlphaZero-lite, optional)
  C: SF-eval-only logistic regression (trivial baseline)
  D: EP color-flow fusion (system under test — uses existing predictions)

Usage:
  python benchmark/src/transformer_baseline.py --train data/train_v3.csv --val data/val_v3.csv --test data/test_v3.csv
"""

import argparse
import json
import os
import sys
import time
import random
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss
from collections import Counter
import chess
import chess.pgn
import io

# ─── Reproducibility ──────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# ─── Device ───────────────────────────────────────────────────────────────────
DEVICE = torch.device('mps' if torch.backends.mps.is_available() else
                      'cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {DEVICE}")

# ─── Constants ────────────────────────────────────────────────────────────────
LABEL_MAP = {'white_wins': 0, 'black_wins': 1, 'draw': 2}
LABEL_NAMES = ['white_wins', 'black_wins', 'draw']
MAX_SEQ_LEN = 80
EMBED_DIM = 128
N_HEADS = 4
N_LAYERS = 4
FFN_DIM = 512
BATCH_SIZE = 128
EPOCHS = 30
LR = 1e-4
WEIGHT_DECAY = 0.01
PATIENCE = 7

# ─── PGN Tokenizer ────────────────────────────────────────────────────────────
# Tokenize moves as UCI strings. Vocabulary built from training data.
class PGNVocab:
    def __init__(self):
        self.token2id = {'<PAD>': 0, '<BOS>': 1, '<EOS>': 2, '<UNK>': 3}
        self.id2token = {v: k for k, v in self.token2id.items()}
        self.next_id = 4

    def add_move(self, uci_str):
        if uci_str not in self.token2id:
            self.token2id[uci_str] = self.next_id
            self.id2token[self.next_id] = uci_str
            self.next_id += 1

    def encode(self, uci_moves, max_len=MAX_SEQ_LEN):
        ids = [self.token2id['<BOS>']]
        for m in uci_moves[:max_len - 2]:
            ids.append(self.token2id.get(m, self.token2id['<UNK>']))
        ids.append(self.token2id['<EOS>'])
        # Pad
        while len(ids) < max_len:
            ids.append(self.token2id['<PAD>'])
        return ids[:max_len]

    def __len__(self):
        return self.next_id


def parse_pgn_to_uci(pgn_str, max_moves=MAX_SEQ_LEN):
    """Parse a PGN string and return list of UCI moves up to max_moves.
    Handles Chess960 castling notation by trying both standard and 960 modes."""
    if pd.isna(pgn_str) or not pgn_str:
        return []

    # Suppress python-chess logging during parsing
    import logging
    logging.getLogger('chess.pgn').setLevel(logging.CRITICAL)

    pgn_io = io.StringIO(pgn_str)
    try:
        game = chess.pgn.read_game(pgn_io)
        if game is None:
            return []
    except Exception:
        return []

    # Try standard mode first
    uci_moves = _extract_uci(game, max_moves, chess960=False)
    if len(uci_moves) > 0:
        return uci_moves

    # Fallback: retry with chess960 mode for castling notation
    pgn_io2 = io.StringIO(pgn_str)
    try:
        game2 = chess.pgn.read_game(pgn_io2)
        if game2 is None:
            return []
        return _extract_uci(game2, max_moves, chess960=True)
    except Exception:
        return []


def _extract_uci(game, max_moves, chess960=False):
    """Extract UCI moves from a parsed game."""
    try:
        board = game.board(chess960=chess960)
    except Exception:
        board = game.board()
    uci_moves = []
    for move in game.mainline_moves():
        try:
            board.push(move)
            uci_moves.append(move.uci())
        except Exception:
            break
        if len(uci_moves) >= max_moves:
            break
    return uci_moves


# ─── Datasets ─────────────────────────────────────────────────────────────────
class PGNDataset(Dataset):
    def __init__(self, df, vocab, has_pgn_only=False):
        self.labels = []
        self.sequences = []
        self.sf_evals = []
        self.ep_preds = []
        self.ep_correct = []
        self.sf_correct = []
        self.move_numbers = []
        self.game_types = []
        self.archetypes = []
        self.has_pgn = []

        for _, row in df.iterrows():
            label = LABEL_MAP.get(row['actual_result'], 2)
            pgn = row.get('pgn_truncated', None)
            uci_moves = parse_pgn_to_uci(pgn) if pd.notna(pgn) else []
            ids = vocab.encode(uci_moves)

            self.sequences.append(ids)
            self.labels.append(label)
            self.sf_evals.append(float(row['stockfish_eval']) if pd.notna(row['stockfish_eval']) else 0.0)
            self.ep_preds.append(row['hybrid_prediction'])
            self.ep_correct.append(bool(row['hybrid_correct']) if pd.notna(row['hybrid_correct']) else False)
            self.sf_correct.append(bool(row['stockfish_correct']) if pd.notna(row['stockfish_correct']) else False)
            self.move_numbers.append(int(row['move_number']) if pd.notna(row['move_number']) else 0)
            self.game_types.append(str(row.get('game_type', 'standard')))
            self.archetypes.append(str(row.get('hybrid_archetype', 'unknown')))
            self.has_pgn.append(len(uci_moves) > 0)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            'seq': torch.tensor(self.sequences[idx], dtype=torch.long),
            'label': torch.tensor(self.labels[idx], dtype=torch.long),
            'sf_eval': torch.tensor(self.sf_evals[idx], dtype=torch.float32),
        }


# ─── Model A: PGN Transformer ─────────────────────────────────────────────────
class PGNTransformer(nn.Module):
    def __init__(self, vocab_size, embed_dim=EMBED_DIM, n_heads=N_HEADS,
                 n_layers=N_LAYERS, ffn_dim=FFN_DIM, n_classes=3, max_len=MAX_SEQ_LEN):
        super().__init__()
        self.token_embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.pos_embed = nn.Embedding(max_len, embed_dim)
        # Custom transformer layers (avoid MPS nested tensor issue)
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, n_heads, ffn_dim, dropout=0.1)
            for _ in range(n_layers)
        ])
        self.norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(0.1)
        self.head = nn.Linear(embed_dim, n_classes)

    def forward(self, seq):
        B, L = seq.shape
        positions = torch.arange(L, device=seq.device).unsqueeze(0).expand(B, L)
        x = self.token_embed(seq) + self.pos_embed(positions)
        # Build attention mask: True = attend, False = mask (padding)
        pad_mask = (seq != 0)  # B, L — True for real tokens
        # Create 2D attention mask: B, L, L
        attn_mask = pad_mask.unsqueeze(1) & pad_mask.unsqueeze(2)  # B, L, L

        for layer in self.layers:
            x = layer(x, attn_mask)
        x = self.norm(x)

        # Mean-pool over non-pad positions
        mask = pad_mask.float().unsqueeze(-1)  # B, L, 1
        pooled = (x * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1)
        pooled = self.dropout(pooled)
        return self.head(pooled)


class TransformerEncoderLayer(nn.Module):
    """Custom transformer encoder layer that works on MPS (no nested tensor)."""
    def __init__(self, d_model, n_heads, ffn_dim, dropout=0.1):
        super().__init__()
        self.self_attn = nn.MultiheadAttention(d_model, n_heads, dropout=dropout, batch_first=True)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, ffn_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ffn_dim, d_model),
            nn.Dropout(dropout),
        )

    def forward(self, x, attn_mask):
        # x: B, L, D; attn_mask: B, L, L (True = attend)
        # MultiheadAttention expects: True = mask (ignore), so invert
        key_padding_mask = ~attn_mask[:, 0, :]  # B, L — True = padding (ignore)
        residual = x
        x_norm = self.norm1(x)
        attn_out, _ = self.self_attn(x_norm, x_norm, x_norm, key_padding_mask=key_padding_mask)
        x = residual + attn_out
        x = x + self.ffn(self.norm2(x))
        return x


# ─── Training ─────────────────────────────────────────────────────────────────
def train_model_a(train_ds, val_ds, vocab, epochs=EPOCHS):
    """Train Model A (PGN transformer)."""
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    model = PGNTransformer(vocab_size=len(vocab)).to(DEVICE)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)

    # Class weights (draws are underrepresented)
    label_counts = Counter(train_ds.labels)
    total = sum(label_counts.values())
    weights = torch.tensor([total / (3 * label_counts.get(i, 1)) for i in range(3)],
                           dtype=torch.float32).to(DEVICE)
    criterion = nn.CrossEntropyLoss(weight=weights)

    best_val_loss = float('inf')
    best_state = None
    patience_counter = 0

    print(f"\n{'='*70}")
    print(f"  Model A: PGN Transformer ({sum(p.numel() for p in model.parameters()):,} params)")
    print(f"{'='*70}")
    print(f"  Train: {len(train_ds)} samples, Val: {len(val_ds)} samples")
    print(f"  Vocab: {len(vocab)} tokens")
    print(f"  Epochs: {epochs}, Batch: {BATCH_SIZE}, LR: {LR}")
    print()

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        t0 = time.time()

        for batch in train_loader:
            seq = batch['seq'].to(DEVICE)
            labels = batch['label'].to(DEVICE)

            optimizer.zero_grad()
            logits = model(seq)
            loss = criterion(logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            train_loss += loss.item() * len(labels)
            preds = logits.argmax(dim=-1)
            train_correct += (preds == labels).sum().item()
            train_total += len(labels)

        # Validation
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for batch in val_loader:
                seq = batch['seq'].to(DEVICE)
                labels = batch['label'].to(DEVICE)
                logits = model(seq)
                loss = criterion(logits, labels)
                val_loss += loss.item() * len(labels)
                preds = logits.argmax(dim=-1)
                val_correct += (preds == labels).sum().item()
                val_total += len(labels)

        train_acc = train_correct / train_total * 100
        val_acc = val_correct / val_total * 100
        val_loss_avg = val_loss / val_total
        elapsed = time.time() - t0

        print(f"  Epoch {epoch:3d}/{epochs} | train_loss={train_loss/train_total:.4f} "
              f"train_acc={train_acc:.2f}% | val_loss={val_loss_avg:.4f} "
              f"val_acc={val_acc:.2f}% | {elapsed:.1f}s")

        if val_loss_avg < best_val_loss:
            best_val_loss = val_loss_avg
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(f"  Early stopping at epoch {epoch} (patience={PATIENCE})")
                break

    if best_state:
        model.load_state_dict(best_state)
    return model


def evaluate_model_a(model, dataset, name="Test"):
    """Evaluate Model A on a dataset, return predictions and metrics."""
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    model.eval()
    all_preds = []
    all_probs = []
    all_labels = []

    with torch.no_grad():
        for batch in loader:
            seq = batch['seq'].to(DEVICE)
            labels = batch['label'].to(DEVICE)
            logits = model(seq)
            probs = F.softmax(logits, dim=-1)
            preds = logits.argmax(dim=-1)
            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    all_labels = np.array(all_labels)

    acc = accuracy_score(all_labels, all_preds)
    ll = log_loss(all_labels, all_probs, labels=[0, 1, 2])
    brier = np.mean(np.sum((all_probs - np.eye(3)[all_labels]) ** 2, axis=1))

    print(f"\n  Model A ({name}): accuracy={acc*100:.2f}%, log_loss={ll:.4f}, brier={brier:.4f}")
    return all_preds, all_probs, {'accuracy': acc, 'log_loss': ll, 'brier': brier}


# ─── Model C: SF-eval Logistic Regression ─────────────────────────────────────
def train_model_c(train_ds, val_ds):
    """Train Model C (SF-eval logistic regression)."""
    X_train = np.array(train_ds.sf_evals).reshape(-1, 1)
    y_train = np.array(train_ds.labels)
    X_val = np.array(val_ds.sf_evals).reshape(-1, 1)
    y_val = np.array(val_ds.labels)

    # Clip extreme evals
    X_train = np.clip(X_train, -2000, 2000)
    X_val = np.clip(X_val, -2000, 2000)

    clf = LogisticRegression(max_iter=1000, C=1.0)
    clf.fit(X_train, y_train)

    val_preds = clf.predict(X_val)
    val_probs = clf.predict_proba(X_val)
    val_acc = accuracy_score(y_val, val_preds)
    val_ll = log_loss(y_val, val_probs, labels=[0, 1, 2])

    print(f"\n{'='*70}")
    print(f"  Model C: SF-eval Logistic Regression")
    print(f"{'='*70}")
    print(f"  Val accuracy: {val_acc*100:.2f}%, log_loss: {val_ll:.4f}")

    return clf


def evaluate_model_c(clf, dataset, name="Test"):
    X = np.array(dataset.sf_evals).reshape(-1, 1)
    y = np.array(dataset.labels)
    X = np.clip(X, -2000, 2000)
    preds = clf.predict(X)
    probs = clf.predict_proba(X)
    acc = accuracy_score(y, preds)
    ll = log_loss(y, probs, labels=[0, 1, 2])
    brier = np.mean(np.sum((probs - np.eye(3)[y]) ** 2, axis=1))
    print(f"  Model C ({name}): accuracy={acc*100:.2f}%, log_loss={ll:.4f}, brier={brier:.4f}")
    return preds, probs, {'accuracy': acc, 'log_loss': ll, 'brier': brier}


# ─── Model D: EP predictions (no training) ────────────────────────────────────
def evaluate_model_d(dataset, name="Test"):
    """Evaluate Model D (EP's existing predictions)."""
    labels = np.array(dataset.labels)
    pred_map = {v: k for k, v in LABEL_MAP.items()}
    id_map = {v: k for k, v in LABEL_MAP.items()}

    preds = np.array([LABEL_MAP.get(p, 2) for p in dataset.ep_preds])
    correct = np.array(dataset.ep_correct)

    acc = correct.mean() * 100
    # Approximate probabilities from confidence
    conf = np.array([0.5] * len(dataset))  # placeholder — EP doesn't output calibrated probs
    print(f"  Model D ({name}): accuracy={acc:.2f}% (using existing EP predictions)")
    return preds, None, {'accuracy': acc / 100, 'log_loss': None, 'brier': None}


# ─── Stratified Evaluation ────────────────────────────────────────────────────
def stratified_eval(preds_a, preds_c, preds_d, labels, ds, name="Test"):
    """Evaluate all models by stratification."""
    labels = np.array(labels)
    preds_a = np.array(preds_a)
    preds_c = np.array(preds_c)
    preds_d = np.array(preds_d)

    # By eval zone
    sf_evals = np.array(ds.sf_evals)
    zones = [
        ('0-25cp', (np.abs(sf_evals) <= 25)),
        ('25-50cp', (np.abs(sf_evals) > 25) & (np.abs(sf_evals) <= 50)),
        ('50-100cp', (np.abs(sf_evals) > 50) & (np.abs(sf_evals) <= 100)),
        ('100-200cp', (np.abs(sf_evals) > 100) & (np.abs(sf_evals) <= 200)),
        ('200+cp', (np.abs(sf_evals) > 200)),
    ]

    print(f"\n  --- By Eval Zone ({name}) ---")
    print(f"  {'Zone':<12} {'N':>6} {'A%':>7} {'C%':>7} {'D(EP)%':>7} {'SF%':>7}")
    for zone_name, mask in zones:
        if mask.sum() == 0:
            continue
        a_acc = (preds_a[mask] == labels[mask]).mean() * 100
        c_acc = (preds_c[mask] == labels[mask]).mean() * 100
        d_acc = (np.array(ds.ep_correct)[mask]).mean() * 100
        sf_acc = (np.array(ds.sf_correct)[mask]).mean() * 100
        print(f"  {zone_name:<12} {mask.sum():>6} {a_acc:>6.1f}% {c_acc:>6.1f}% {d_acc:>6.1f}% {sf_acc:>6.1f}%")

    # By phase zone
    move_nums = np.array(ds.move_numbers)
    phases = [
        ('12-19', (move_nums >= 12) & (move_nums < 20)),
        ('20-27', (move_nums >= 20) & (move_nums < 28)),
        ('28-45', (move_nums >= 28) & (move_nums <= 45)),
        ('46+', (move_nums > 45)),
    ]

    print(f"\n  --- By Phase Zone ({name}) ---")
    print(f"  {'Phase':<12} {'N':>6} {'A%':>7} {'C%':>7} {'D(EP)%':>7} {'SF%':>7}")
    for phase_name, mask in phases:
        if mask.sum() == 0:
            continue
        a_acc = (preds_a[mask] == labels[mask]).mean() * 100
        c_acc = (preds_c[mask] == labels[mask]).mean() * 100
        d_acc = (np.array(ds.ep_correct)[mask]).mean() * 100
        sf_acc = (np.array(ds.sf_correct)[mask]).mean() * 100
        print(f"  {phase_name:<12} {mask.sum():>6} {a_acc:>6.1f}% {c_acc:>6.1f}% {d_acc:>6.1f}% {sf_acc:>6.1f}%")

    # By game type
    game_types = np.array(ds.game_types)
    print(f"\n  --- By Game Type ({name}) ---")
    print(f"  {'Type':<12} {'N':>6} {'A%':>7} {'C%':>7} {'D(EP)%':>7} {'SF%':>7}")
    for gt in ['standard', 'chess960']:
        mask = game_types == gt
        if mask.sum() == 0:
            continue
        a_acc = (preds_a[mask] == labels[mask]).mean() * 100
        c_acc = (preds_c[mask] == labels[mask]).mean() * 100
        d_acc = (np.array(ds.ep_correct)[mask]).mean() * 100
        sf_acc = (np.array(ds.sf_correct)[mask]).mean() * 100
        print(f"  {gt:<12} {mask.sum():>6} {a_acc:>6.1f}% {c_acc:>6.1f}% {d_acc:>6.1f}% {sf_acc:>6.1f}%")


# ─── McNemar's Test ───────────────────────────────────────────────────────────
def mcnemar_test(preds_a, preds_d, labels, ds, name="EP vs Transformer"):
    """McNemar's test: is the difference between two models significant?"""
    labels = np.array(labels)
    preds_a = np.array(preds_a)
    ep_correct = np.array(ds.ep_correct)

    a_correct = (preds_a == labels)
    d_correct = ep_correct

    # b = A right, D wrong; c = A wrong, D right
    b = ((a_correct) & (~d_correct)).sum()
    c = ((~a_correct) & (d_correct)).sum()

    if b + c == 0:
        print(f"  McNemar ({name}): no disagreements (b={b}, c={c})")
        return

    # Use exact binomial test for small samples, chi-square for large
    from scipy.stats import binomtest
    n = b + c
    if n < 25:
        result = binomtest(min(b, c), n, 0.5)
        p_value = result.pvalue
    else:
        # Chi-square with continuity correction
        chi2 = (abs(b - c) - 1) ** 2 / (b + c)
        from scipy.stats import chi2 as chi2_dist
        p_value = 1 - chi2_dist.cdf(chi2, df=1)

    print(f"  McNemar ({name}): b={b} (A right, D wrong), c={c} (A wrong, D right), p={p_value:.4f}")


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    global BATCH_SIZE, EPOCHS

    parser = argparse.ArgumentParser(description='Transformer Baseline Experiment')
    parser.add_argument('--train', required=True, help='Path to train CSV')
    parser.add_argument('--val', required=True, help='Path to val CSV')
    parser.add_argument('--test', required=True, help='Path to test CSV')
    parser.add_argument('--epochs', type=int, default=EPOCHS)
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE)
    parser.add_argument('--output', default='benchmark/results/transformer_baseline_results.json',
                        help='Output JSON path')
    args = parser.parse_args()

    BATCH_SIZE = args.batch_size
    EPOCHS = args.epochs

    print(f"\n{'='*70}")
    print(f"  En Pensent — Transformer Baseline Experiment")
    print(f"{'='*70}")

    # Load data
    print(f"\nLoading data...")
    train_df = pd.read_csv(args.train)
    val_df = pd.read_csv(args.val)
    test_df = pd.read_csv(args.test)
    print(f"  Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

    # Build vocabulary from training data
    print(f"\nBuilding PGN vocabulary from training data...")
    vocab = PGNVocab()
    move_count = 0
    for _, row in train_df.iterrows():
        pgn = row.get('pgn_truncated', None)
        if pd.notna(pgn):
            uci_moves = parse_pgn_to_uci(pgn)
            for m in uci_moves:
                vocab.add_move(m)
                move_count += 1
    print(f"  Vocabulary: {len(vocab)} tokens from {move_count} moves")

    # Create datasets
    print(f"\nCreating datasets (parsing PGNs)...")
    t0 = time.time()
    train_ds = PGNDataset(train_df, vocab)
    val_ds = PGNDataset(val_df, vocab)
    test_ds = PGNDataset(test_df, vocab)
    print(f"  Datasets created in {time.time()-t0:.1f}s")
    print(f"  Train PGN coverage: {sum(train_ds.has_pgn)}/{len(train_ds)} ({sum(train_ds.has_pgn)/len(train_ds)*100:.1f}%)")
    print(f"  Test PGN coverage: {sum(test_ds.has_pgn)}/{len(test_ds)} ({sum(test_ds.has_pgn)/len(test_ds)*100:.1f}%)")

    # ─── Model C: SF-eval logistic regression (fast, train first) ───────────
    print(f"\n{'='*70}")
    print(f"  Training Model C: SF-eval Logistic Regression")
    print(f"{'='*70}")
    clf_c = train_model_c(train_ds, val_ds)

    # ─── Model A: PGN Transformer ──────────────────────────────────────────
    model_a = train_model_a(train_ds, val_ds, vocab, epochs=args.epochs)

    # ─── Evaluation on Test Set ────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  TEST SET EVALUATION")
    print(f"{'='*70}")

    # Model A
    preds_a, probs_a, metrics_a = evaluate_model_a(model_a, test_ds, "Test")

    # Model C
    preds_c, probs_c, metrics_c = evaluate_model_c(clf_c, test_ds, "Test")

    # Model D (EP)
    preds_d, _, metrics_d = evaluate_model_d(test_ds, "Test")

    # SF baseline
    sf_acc = np.mean(test_ds.sf_correct) * 100
    print(f"  Stockfish 18 (Test): accuracy={sf_acc:.2f}%")

    # ─── Stratified Evaluation ─────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  STRATIFIED EVALUATION (Test Set)")
    print(f"{'='*70}")
    stratified_eval(preds_a, preds_c, preds_d, test_ds.labels, test_ds, "Test")

    # ─── McNemar's Test ────────────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  McNEMAR'S TEST")
    print(f"{'='*70}")
    mcnemar_test(preds_a, preds_d, test_ds.labels, test_ds, "Transformer vs EP")

    # ─── Summary ───────────────────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  SUMMARY")
    print(f"{'='*70}")
    print(f"  {'Model':<30} {'Accuracy':>10} {'Log-loss':>10} {'Brier':>10}")
    print(f"  {'-'*60}")
    print(f"  {'A: PGN Transformer':<30} {metrics_a['accuracy']*100:>9.2f}% {metrics_a['log_loss']:>10.4f} {metrics_a['brier']:>10.4f}")
    print(f"  {'C: SF-eval Logistic':<30} {metrics_c['accuracy']*100:>9.2f}% {metrics_c['log_loss']:>10.4f} {metrics_c['brier']:>10.4f}")
    print(f"  {'D: EP color-flow':<30} {metrics_d['accuracy']*100:>9.2f}% {'N/A':>10} {'N/A':>10}")
    print(f"  {'Stockfish 18 (raw)':<30} {sf_acc:>9.2f}% {'N/A':>10} {'N/A':>10}")

    # ─── Save Results ──────────────────────────────────────────────────────
    results = {
        'experiment': 'transformer_baseline',
        'date': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'seed': SEED,
        'device': str(DEVICE),
        'data': {
            'train_size': len(train_df),
            'val_size': len(val_df),
            'test_size': len(test_df),
            'train_pgn_coverage': sum(train_ds.has_pgn) / len(train_ds),
            'test_pgn_coverage': sum(test_ds.has_pgn) / len(test_ds),
        },
        'model_a': {
            'name': 'PGN Transformer',
            'params': sum(p.numel() for p in model_a.parameters()),
            'vocab_size': len(vocab),
            'embed_dim': EMBED_DIM,
            'n_layers': N_LAYERS,
            'n_heads': N_HEADS,
            **metrics_a,
        },
        'model_c': {
            'name': 'SF-eval Logistic Regression',
            **metrics_c,
        },
        'model_d': {
            'name': 'EP color-flow fusion',
            **metrics_d,
        },
        'stockfish_18': {
            'accuracy': sf_acc / 100,
        },
    }

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n  Results saved to {args.output}")


if __name__ == '__main__':
    main()
