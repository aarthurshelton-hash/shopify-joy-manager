#!/usr/bin/env python3
"""
En Pensent — Stacker Retraining Script
============================================================================

Retrains the learned stacker model from the latest DB data and exports
new JSON artifacts. Designed to be run periodically (e.g., daily via cron
or PM2) to keep the stacker up-to-date with recent game outcomes.

Process:
  1. Export fresh data from Supabase (via export_training_set_v2.py)
  2. Train the stacker on temporal holdout (via train_stacker.py)
  3. The new model artifacts in farm/models/stacker/ are picked up
     automatically by the ingest workers on their next calibration cycle

Usage:
  cd benchmark && .venv-bench/bin/python src/retrain_stacker.py

Or via PM2 cron (in ecosystem.config.js):
  script: 'benchmark/.venv-bench/bin/python',
  args: 'benchmark/src/retrain_stacker.py',
  cron_restart: '0 4 * * *'  -- daily at 4am
"""

import os
import sys
import subprocess
from pathlib import Path

BENCH_DIR = Path(__file__).parent.parent
SCRIPT_DIR = BENCH_DIR / "src"
PYTHON = sys.executable

def run(cmd, label):
    """Run a command and stream output."""
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    print(f"  Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(BENCH_DIR))
    if result.returncode != 0:
        print(f"\n  ✗ FAILED (exit code {result.returncode})")
        return False
    print(f"  ✓ OK")
    return True

def main():
    print(f"\n{'='*60}")
    print(f"  En Pensent — Stacker Retraining Pipeline")
    print(f"{'='*60}")
    print(f"  Bench dir: {BENCH_DIR}")
    print(f"  Python:    {PYTHON}")

    # Step 1: Export fresh data
    ok = run([PYTHON, str(SCRIPT_DIR / "export_training_set_v2.py")], "Step 1: Export fresh data from Supabase")
    if not ok:
        print("\n  Export failed — aborting retraining")
        sys.exit(1)

    # Step 2: Train stacker
    ok = run([PYTHON, str(SCRIPT_DIR / "train_stacker.py")], "Step 2: Train stacker on temporal holdout")
    if not ok:
        print("\n  Training failed — keeping existing model")
        sys.exit(1)

    # Step 3: Verify artifacts
    models_dir = BENCH_DIR.parent / "farm" / "models" / "stacker"
    required = ["stacker_model.json", "stacker_calibration.json", "stacker_archetypes.json"]
    print(f"\n{'='*60}")
    print(f"  Step 3: Verify artifacts")
    print(f"{'='*60}")
    for f in required:
        path = models_dir / f
        if path.exists():
            size = path.stat().st_size
            print(f"  ✓ {f} ({size} bytes)")
        else:
            print(f"  ✗ {f} MISSING")
            sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  Retraining complete!")
    print(f"{'='*60}")
    print(f"\n  The new model artifacts are in {models_dir}/")
    print(f"  Ingest workers will pick them up on their next calibration cycle")
    print(f"  (signal-cal worker runs every 45 min — stacker loads on worker restart)")
    print(f"\n  To force immediate reload: pm2 restart chess-db-ingest*")
    print()

if __name__ == "__main__":
    main()
