#!/usr/bin/env python3
"""
Extract the MIT-Stanford (MATR) 124-cell battery dataset from .mat (HDF5) files.
Source: Severson et al., Nature Energy 2019
Data: https://data.matr.io/1/

Files downloaded from data.matr.io and placed in farm/data/battery/matr-raw/:
  - batch1.mat (2017-05-12 batch, ~46 cells)
  - batch2.mat (2017-06-30 batch, ~48 cells)
  - batch3.mat (2018-04-12 batch, ~46 cells)

Run: python3 farm/scripts/download-matr-battery.py

Outputs: farm/data/battery/battery-cycles-extracted.json (replaces NASA 4-cell data)
         farm/data/battery/matr-124-cells.json (MATR-specific backup)
"""

import os
import sys
import json
import math
import h5py
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data', 'battery')
RAW_DIR = os.path.join(DATA_DIR, 'matr-raw')

BATCH_FILES = {
    'batch1': os.path.join(RAW_DIR, 'batch1.mat'),
    'batch2': os.path.join(RAW_DIR, 'batch2.mat'),
    'batch3': os.path.join(RAW_DIR, 'batch3.mat'),
}


def safe_float(val):
    """Convert to float, handling NaN/Inf."""
    v = float(val)
    if math.isnan(v) or math.isinf(v):
        return None
    return v


def extract_batch(filepath, batch_name):
    """Extract per-cycle summary data from a .mat HDF5 batch file."""
    cycles = []
    cell_count = 0

    f = h5py.File(filepath, 'r')
    batch = f['batch']
    n_cells = batch['cycle_life'].shape[0]

    print(f"  {batch_name}: {n_cells} cells detected")

    for cell_idx in range(n_cells):
        # Cycle life
        cl_ref = batch['cycle_life'][cell_idx, 0]
        cl_val = f[cl_ref][()].flatten()[0]
        cycle_life = int(cl_val) if not (math.isnan(cl_val) or math.isinf(cl_val)) else 0

        # Battery ID
        battery_id = f"MATR_{batch_name}_cell{cell_idx:03d}"

        # Summary data (per-cycle aggregates)
        sum_ref = batch['summary'][cell_idx, 0]
        summary = f[sum_ref]

        # Extract arrays from summary
        def get_array(key):
            if key in summary:
                return summary[key][()].flatten()
            return np.array([])

        q_discharge = get_array('QDischarge')
        q_charge = get_array('QCharge')
        ir = get_array('IR')
        t_max = get_array('Tmax')
        t_avg = get_array('Tavg')
        t_min = get_array('Tmin')
        charge_time = get_array('chargetime')
        cycle_nums = get_array('cycle')

        n_cycles = len(q_discharge)
        if n_cycles < 10:
            print(f"    Skipping {battery_id}: only {n_cycles} cycles")
            continue

        cell_count += 1
        initial_cap = q_discharge[0] if len(q_discharge) > 0 and q_discharge[0] > 0 else 1.1

        for i in range(n_cycles):
            # Build cycle record matching our benchmark format
            cycle = {
                'battery_id': battery_id,
                'cycle_number': int(cycle_nums[i]) if i < len(cycle_nums) else i + 1,
                'dataset': 'MATR',
                'batch': batch_name,
                'cycle_life': cycle_life,
            }

            # Discharge capacity → voltage_mean proxy (normalized to ~3.5V nominal)
            # QDischarge degrades over cycle life just like voltage_mean in NASA data
            if i < len(q_discharge):
                cap = safe_float(q_discharge[i])
                if cap is not None and cap > 0:
                    cycle['discharge_capacity'] = cap
                    cycle['voltage_mean'] = cap / initial_cap * 3.5
                    cycle['voltage_end'] = cap / initial_cap * 3.3
                else:
                    continue  # skip invalid cycles

            # Charge capacity
            if i < len(q_charge):
                cycle['charge_capacity'] = safe_float(q_charge[i])

            # Internal resistance
            if i < len(ir):
                cycle['internal_resistance'] = safe_float(ir[i])

            # Temperature
            if i < len(t_max):
                cycle['temp_max'] = safe_float(t_max[i])
            if i < len(t_avg):
                cycle['temp_mean'] = safe_float(t_avg[i])
            if i < len(t_min):
                tmin = safe_float(t_min[i])
                tmax = cycle.get('temp_max')
                if tmin is not None and tmax is not None:
                    cycle['temp_rise'] = tmax - tmin
                else:
                    cycle['temp_rise'] = 0

            # Charge time (minutes → seconds)
            if i < len(charge_time):
                ct = safe_float(charge_time[i])
                if ct is not None and ct > 0:
                    cycle['duration_s'] = ct * 60
                    # Approximate mean current from charge capacity / charge time
                    qc = cycle.get('charge_capacity')
                    if qc is not None and qc > 0:
                        cycle['current_mean'] = -(qc / (ct / 60))  # Ah / hours = A (negative for discharge convention)

            # Only keep valid cycles
            if cycle.get('voltage_mean') is not None:
                cycles.append(cycle)

        if cell_count % 10 == 0:
            print(f"    Processed {cell_count} cells so far ({len(cycles)} total cycles)...")

    f.close()
    print(f"    → {cell_count} valid cells, {len(cycles)} total cycles")
    return cycles, cell_count


def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    print("═══════════════════════════════════════════════════")
    print("  MIT-Stanford (MATR) Battery Dataset Extraction")
    print("  Severson et al., Nature Energy 2019")
    print("  124 cells × 500-2300 cycles each")
    print("═══════════════════════════════════════════════════")

    # Check which batch files exist
    available = {}
    for name, path in BATCH_FILES.items():
        if os.path.exists(path):
            size_gb = os.path.getsize(path) / 1e9
            print(f"  ✓ {name}: {size_gb:.1f} GB")
            available[name] = path
        else:
            print(f"  ✗ {name}: NOT FOUND at {path}")

    if not available:
        print("\nERROR: No .mat files found in farm/data/battery/matr-raw/")
        print("Place batch1.mat, batch2.mat, batch3.mat there and re-run.")
        sys.exit(1)

    # Extract cycles from each batch
    print(f"\nExtracting from {len(available)} batches...")
    all_cycles = []
    total_cells = 0

    for name, path in sorted(available.items()):
        print(f"\nProcessing {name} ({os.path.getsize(path)/1e9:.1f} GB)...")
        try:
            cycles, n_cells = extract_batch(path, name)
            all_cycles.extend(cycles)
            total_cells += n_cells
        except Exception as e:
            print(f"  ERROR processing {name}: {e}")
            import traceback
            traceback.print_exc()

    if not all_cycles:
        print("\nERROR: No cycles extracted!")
        sys.exit(1)

    # Stats
    battery_ids = set(c['battery_id'] for c in all_cycles)
    cycle_lives = {}
    for c in all_cycles:
        if c['battery_id'] not in cycle_lives:
            cycle_lives[c['battery_id']] = c.get('cycle_life', 0)

    lives = list(cycle_lives.values())
    print(f"\n═══════════════════════════════════════════════════")
    print(f"  EXTRACTION COMPLETE")
    print(f"═══════════════════════════════════════════════════")
    print(f"  Batteries:   {len(battery_ids)}")
    print(f"  Total cycles: {len(all_cycles)}")
    print(f"  Cycle life range: {min(lives)}-{max(lives)} cycles")
    print(f"  Mean cycle life:  {sum(lives)/len(lives):.0f} cycles")

    # Save as primary benchmark data (replaces NASA 4-cell)
    primary_path = os.path.join(DATA_DIR, 'battery-cycles-extracted.json')
    with open(primary_path, 'w') as fp:
        json.dump(all_cycles, fp)
    print(f"\n  ✓ Primary: {primary_path} ({os.path.getsize(primary_path)/1e6:.1f} MB)")

    # Also save MATR-specific backup
    backup_path = os.path.join(DATA_DIR, 'matr-124-cells.json')
    with open(backup_path, 'w') as fp:
        json.dump(all_cycles, fp)
    print(f"  ✓ Backup:  {backup_path} ({os.path.getsize(backup_path)/1e6:.1f} MB)")

    # Print sample for verification
    sample = all_cycles[len(all_cycles)//2]
    print(f"\n  Sample cycle (mid-dataset):")
    for k, v in sample.items():
        if isinstance(v, float):
            print(f"    {k}: {v:.4f}")
        else:
            print(f"    {k}: {v}")


if __name__ == '__main__':
    main()
