# En Pensent — Complete System Guide

**Founded by Alec Arthur Shelton | Canadian Corporation**
**Domain: enpensent.com | Deployed via Vercel**

---

## Table of Contents

1. [What Is En Pensent](#1-what-is-en-pensent)
2. [Core Philosophy](#2-core-philosophy)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [The Universal Grid Portal](#5-the-universal-grid-portal)
6. [Domain Adapters & Benchmarks](#6-domain-adapters--benchmarks)
7. [The Color Flow Analysis Engine](#7-the-color-flow-analysis-engine)
8. [The Pensent Core SDK](#8-the-pensent-core-sdk)
9. [55 Universal Adapters](#9-55-universal-adapters)
10. [Photonic Computing Architecture](#10-photonic-computing-architecture)
11. [The Synaptic Truth Network](#11-the-synaptic-truth-network)
12. [24/7 Compute Farm](#12-247-compute-farm)
13. [Self-Learning & Auto-Evolution](#13-self-learning--auto-evolution)
14. [Market Prediction System](#14-market-prediction-system)
15. [Web Application](#15-web-application)
16. [Database Layer (Supabase)](#16-database-layer-supabase)
17. [Supabase Edge Functions](#17-supabase-edge-functions)
18. [Data Integrity Rules](#18-data-integrity-rules)
19. [Deployment & Infrastructure](#19-deployment--infrastructure)
20. [Grants & Funding Pipeline](#20-grants--funding-pipeline)
21. [Key Commands Reference](#21-key-commands-reference)

---

## 1. What Is En Pensent

En Pensent is a **Universal Temporal Pattern Recognition Engine**. It extracts visual signatures from sequential events across any domain — chess, markets, batteries, chemical processes, energy grids, music — and uses those signatures to classify archetypes and predict trajectories.

The breakthrough insight: **all data across all domains are wavelengths of a single universal temporal signal.** Chess games, stock markets, battery degradation cycles, chemical process faults, energy grid fluctuations, and musical phrases all follow the same underlying temporal grammar when viewed through the right lens.

The system has been validated across **6 domains** using the same universal algorithm:

| Domain | Accuracy | Dataset | Metric |
|--------|----------|---------|--------|
| Chess | 59.7% | 24,473 games | 3-way classification, +19.4pp over Stockfish 17 |
| Battery | 56.5% | 140 batteries, 114K cycles | 3-way (stable/accelerating/critical) |
| TEP Chemical | 93.3% F1 | 2,200 records | Fault detection, +20.6pp over baseline |
| Energy Grid | 66.6% | 10,805 hourly records | 3-way classification, matches persistence |
| Music | 34.4% | 1,276 performances, 5.6M notes | 3-way melodic direction |
| Market | 35.5% (post-fix) | Ongoing live predictions | Directional prediction |

---

## 2. Core Philosophy

The philosophical foundation is encoded in `src/lib/pensent-core/MANIFESTO.ts` and `src/lib/pensent-core/domains/universal/COMPLETE_SCOPE.ts`:

- **Constraint creates measurement.** Chess has ~10^120 positions from just 64 squares + piece rules. The grid size IS the constraint that makes infinity computable.
- **Color IS the classification.** The color encoding is not a step before classification — it IS what makes something exist out of light. Each domain gets natural palettes (voltage = cool blue, temperature = warm red, etc.).
- **All engines MUST pass through the Universal Visualization Grid.** No shortcuts. The grid is THE portal.
- **Data integrity is sacred.** Zero fake data in production. When real data is unavailable, the system shows "OFFLINE" rather than fabricated values.
- **Self-learning, not pre-programming.** The system discovers its own optimal thresholds, weights, and parameters from training data. More volume → better understanding.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5 (SWC compiler)
- **Styling:** TailwindCSS 3 + shadcn/ui (Radix primitives)
- **State Management:** Zustand (9 stores), TanStack React Query
- **Routing:** React Router DOM 7
- **Charts:** Recharts
- **Animation:** Framer Motion
- **Chess Engine:** chess.js + Stockfish 17 (WASM)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Edge Functions:** 48 Deno-based Supabase Edge Functions
- **Payments:** Stripe

### Compute Farm
- **Runtime:** Node.js 18+ (ESM modules)
- **Process Manager:** PM2 (8 workers)
- **Data Sources:** Lichess API, Chess.com API, Yahoo Finance, EIA API
- **Local Engine:** Stockfish 17

### Deployment
- **Production:** Vercel (`npx vercel --prod`)
- **Domain:** enpensent.com
- **CI/CD:** GitHub Actions

---

## 4. Repository Structure

```
shopify-joy-manager/
├── src/                          # React web application (844 items)
│   ├── App.tsx                   # Route definitions + providers
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles
│   ├── pages/                    # 60 page components
│   ├── components/               # 298 UI components
│   │   ├── chess/                # Chess visualization (66 items)
│   │   ├── marketplace/          # Commerce (21 items)
│   │   ├── scalping/             # Trading terminals (15 items)
│   │   ├── admin/                # CEO-only admin panels (27 items)
│   │   ├── ui/                   # shadcn/ui primitives (50 items)
│   │   ├── pensent-code/         # Code analysis (17 items)
│   │   ├── pensent-ui/           # En Pensent branded UI (7 items)
│   │   └── ...                   # auth, shop, proof, vision, etc.
│   ├── hooks/                    # 67 custom React hooks
│   ├── lib/                      # Core logic libraries
│   │   ├── pensent-core/         # THE SDK (232 items)
│   │   │   ├── index.ts          # SDK entry point (v1.2.0)
│   │   │   ├── MANIFESTO.ts      # Philosophical foundation
│   │   │   ├── ADAPTER_MATRIX.ts # 55 adapter capability matrix
│   │   │   ├── photonic-architecture.ts  # Chip design spec
│   │   │   ├── domains/
│   │   │   │   ├── universal/    # 115 items — adapters + modules
│   │   │   │   ├── finance/      # Market prediction (34 items)
│   │   │   │   ├── chess/        # Chess domain (11 items)
│   │   │   │   └── options/      # Options trading (6 items)
│   │   │   ├── archetype/        # Archetype resolution
│   │   │   ├── signature/        # Signature extraction
│   │   │   ├── trajectory/       # Trajectory prediction
│   │   │   ├── cache/            # Caching layer
│   │   │   ├── batch/            # Batch processing
│   │   │   └── types/            # Type definitions
│   │   ├── chess/                # Chess analysis engine (93 items)
│   │   │   ├── colorFlowAnalysis/  # Patent-pending color flow signatures
│   │   │   ├── hybridPrediction/   # Hybrid EP+SF prediction fusion
│   │   │   ├── patternLearning/    # Pattern learning pipeline
│   │   │   ├── gameImport/         # Game import from Lichess/Chess.com
│   │   │   └── ...                 # Stockfish, analysis, ELO, etc.
│   │   ├── trading/              # Trading infrastructure (9 items)
│   │   └── ...                   # analytics, security, marketplace, etc.
│   ├── stores/                   # Zustand state stores (9 stores)
│   ├── providers/                # React context providers (3)
│   ├── contexts/                 # Additional contexts (2)
│   └── integrations/supabase/    # Supabase client + types
│
├── farm/                         # 24/7 Compute Farm
│   ├── workers/                  # Worker processes (31 files)
│   │   ├── ep-enhanced-worker.mjs       # Chess benchmark (primary, 59KB)
│   │   ├── market-prediction-worker.mjs # Market predictions (71KB)
│   │   ├── server-auto-evolution.mjs    # Self-learning engine
│   │   ├── high-frequency-paper-trader.mjs  # Paper trading
│   │   ├── battery-benchmark-worker.mjs # Battery domain benchmark
│   │   ├── tep-benchmark-worker.mjs     # Chemical domain benchmark
│   │   ├── energy-benchmark-worker.mjs  # Energy domain benchmark
│   │   ├── music-benchmark-worker.mjs   # Music domain benchmark
│   │   ├── puzzleArchetypeCalibrator.mjs # Puzzle calibration
│   │   └── domain-adapters/             # Universal grid adapters
│   │       ├── universal-grid.mjs       # THE PORTAL (15KB)
│   │       ├── market-adapter.mjs       # Market adapter (56KB)
│   │       ├── battery-adapter.mjs      # Battery adapter (25KB)
│   │       ├── energy-adapter.mjs       # Energy adapter (23KB)
│   │       ├── music-adapter.mjs        # Music adapter (23KB)
│   │       ├── tep-adapter.mjs          # Chemical adapter (15KB)
│   │       └── interference-core.mjs    # Shared interference math
│   ├── lib/                      # Shared farm utilities
│   │   ├── liveArchetypeWeights.mjs  # Live accuracy weights from DB
│   │   ├── simpleStorage.mjs         # Local JSON storage
│   │   └── dataIntegrityValidator.mjs # Integrity checks
│   ├── scripts/                  # 30 management & audit scripts
│   ├── monitor/
│   │   └── system-monitor.mjs    # Health & alerting
│   ├── farm.sh                   # Farm start/stop/monitor script
│   └── README.md                 # Farm documentation
│
├── public/                       # Static assets
│   ├── documents/                # Grant briefs & documentation
│   │   └── grants/               # 13+ grant application briefs
│   ├── ib-gateway-bridge/        # IB Gateway bridge server
│   ├── ib-headless-trader/       # Headless IBKR trader
│   └── ...                       # Favicons, manifest, WASM, etc.
│
├── supabase/
│   ├── functions/                # 48 Edge Functions (Deno)
│   ├── migrations/               # Database migrations
│   └── config.toml               # Supabase local config
│
├── ecosystem.config.json         # PM2 worker definitions (8 workers)
├── vercel.json                   # Vercel deployment config
├── vite.config.ts                # Vite build config (terser, SWC)
├── tailwind.config.ts            # Tailwind theme + animations
├── tsconfig.json                 # TypeScript config (path aliases)
└── package.json                  # Dependencies (50+ packages)
```

---

## 5. The Universal Grid Portal

**The single most important file:** `farm/workers/domain-adapters/universal-grid.mjs`

Every domain — chess, battery, chemical, market, energy, music — passes through this exact same structure. The grid is the **universal intermediate representation**.

### How It Works

```
Domain Data → Domain Adapter → Universal Grid → Fingerprint → Quadrant Profile → Archetype → Prediction
```

### Core Data Structure

```javascript
grid[row][col] = { visits: [{ color, channel, step, value }] }
```

- **row/col:** Spatial dimensions (chess: rank/file, battery: sensor group/time bucket)
- **visits:** Stacked readings with unique per-channel color codes
- **color:** Unique character per channel (chess: piece type, battery: sensor type)
- **step:** Temporal position (move number, cycle number, timestep)
- **value:** Normalized reading (-1 to +1)

### Key Functions

| Function | Purpose |
|----------|---------|
| `createGrid(rows, cols)` | Create empty grid (NOT `createUniversalGrid`) |
| `recordVisit(grid, row, col, color, channel, step, value)` | Record a data point on the grid |
| `generateFingerprint(grid, prefix)` | Generate temporal QR code hash |
| `calculateQuadrantProfile(grid)` | Extract 8-quadrant activity profile |
| `classifyArchetype(profile, archetypes)` | Map profile → archetype |
| `extractUniversalSignature(grid, totalSteps)` | Full signature extraction (`totalSteps` required!) |

### 8-Quadrant System

The grid is divided into 8 quadrants (upgraded from original 4), each representing a spatial-strategic zone:

- **Q1–Q4:** Traditional quadrants (top-left, top-right, bottom-left, bottom-right)
- **Q5–Q8:** Extended quadrants (center-left, center-right, edge-top, edge-bottom)

The 8-quadrant system outperforms 4-quadrant because it differentiates pawn advancement via gradated colors and captures boundary/center dynamics.

---

## 6. Domain Adapters & Benchmarks

Each domain has a **domain adapter** that translates raw data into universal grid visits, and a **benchmark worker** that evaluates accuracy.

### Chess (Reference Domain)
- **Adapter:** Color flow analysis engine (`src/lib/chess/colorFlowAnalysis/`)
- **Worker:** `farm/workers/ep-enhanced-worker.mjs` (3 instances, partitioned by player + time)
- **Data Sources:** Lichess API + Chess.com API (real games only)
- **Grid:** 8×8 (chess board), 12-color palette + gradated pawns
- **Archetypes:** `kingside_attack`, `queenside_expansion`, `central_domination`, `positional_squeeze`, `material_imbalance`, `endgame_conversion`, `dynamic_equilibrium`
- **Result:** 59.7% accuracy on 24,473 games (+19.4pp over Stockfish 17)

### Battery Degradation
- **Adapter:** `farm/workers/domain-adapters/battery-adapter.mjs`
- **Worker:** `farm/workers/battery-benchmark-worker.mjs`
- **Dataset:** MIT-Stanford MATR (140 batteries, 114K cycles)
- **Grid:** 8×8, 24 channels, palette: voltage=blue, temp=red, current=amber
- **Archetypes:** `cycle_aging`, `calendar_aging`, `sudden_knee`, `thermal_abuse`
- **Result:** 56.5% accuracy, 89% critical detection

### TEP Chemical Process
- **Adapter:** `farm/workers/domain-adapters/tep-adapter.mjs`
- **Worker:** `farm/workers/tep-benchmark-worker.mjs`
- **Dataset:** Tennessee Eastman Process (2,200 records)
- **Grid:** 8×8, palette: flow=blue, pressure=red, temp=orange, composition=green
- **Result:** F1 93.3% (+20.6pp over baseline)

### Energy Grid
- **Adapter:** `farm/workers/domain-adapters/energy-adapter.mjs`
- **Worker:** `farm/workers/energy-benchmark-worker.mjs`
- **Dataset:** EIA API hourly data (10,805 records, 5 US regions)
- **Grid:** 8×8, 24 channels, palette: demand=red, supply=blue, fossil=brown, nuclear=yellow, solar=orange
- **Result:** 66.6% accuracy (matches persistence baseline)

### Music
- **Adapter:** `farm/workers/domain-adapters/music-adapter.mjs`
- **Worker:** `farm/workers/music-benchmark-worker.mjs`
- **Dataset:** MAESTRO v3.0.0 (1,276 concert piano performances, 5.6M notes)
- **Grid:** 8×8, 24 channels, palette: pitch=rainbow, rhythm=pulse, dynamics=brightness
- **Result:** 34.4% (+1.1pp over random, +0.5pp over persistence)

### Market
- **Adapter:** `farm/workers/domain-adapters/market-adapter.mjs`
- **Worker:** `farm/workers/market-prediction-worker.mjs`
- **Data Source:** Yahoo Finance (live, via Supabase edge function)
- **Grid:** 8×8, 24 channels, multi-timeframe (scalp/short/medium/swing/daily)
- **5 Tactical Detectors:** Trap (queen sacrifice), En Passant (fleeting window), Promotion (compression breakout), Castling (repositioning), Blunder (capitulation)
- **Result:** 35.5% post-fix (47.1% on tactical patterns)

---

## 7. The Color Flow Analysis Engine

**Location:** `src/lib/chess/colorFlowAnalysis/`
**Status:** Patent-Pending Technology

This is the chess-specific implementation of the universal grid concept. It compresses 64 squares × N moves into a visual fingerprint that matches historical patterns across thousands of games.

### Key Files

| File | Purpose |
|------|---------|
| `signatureExtractor.ts` | Extracts color flow signatures from chess positions |
| `enhancedSignatureExtractor.ts` | 8-quadrant, 12-color enhanced extraction |
| `enhancedPieceColors.ts` | Piece-specific color codes + gradated pawns |
| `equilibriumPredictor.ts` | Calculates equilibrium scores for prediction |
| `predictionEngine.ts` | Combines signatures into predictions |
| `archetypeDefinitions.ts` | Chess archetype definitions |
| `archetypeCalibration.ts` | Live weight calibration from DB accuracy |
| `abTestingFramework.ts` | A/B testing (4-quad vs 8-quad) |
| `prophylacticVariations.ts` | Prophylactic/preventive move analysis |
| `types.ts` | Type definitions |

### Hybrid Prediction System

Located at `src/lib/chess/hybridPrediction/`:

- Fuses En Pensent's pattern recognition (strategic) with Stockfish's tactical analysis
- Confidence calculator weights each signal
- Generates fused recommendations with trajectory predictions

---

## 8. The Pensent Core SDK

**Location:** `src/lib/pensent-core/index.ts`
**Version:** 1.2.0

The SDK provides a domain-agnostic API for temporal pattern recognition:

```typescript
import { createPensentEngine } from '@/lib/pensent-core';

const engine = createPensentEngine(myDomainAdapter);

// Extract signature from input
const signature = engine.extractSignature(input);

// Classify into archetype
const archetype = engine.classifyArchetype(signature);

// Find similar historical patterns
const matches = engine.findSimilarPatterns(signature, patternDatabase);

// Predict trajectory
const prediction = engine.predictTrajectory(signature, matches, currentPos, totalLength);
```

### SDK Capabilities (v1.2.0)

- **Signature Extraction:** `generateFingerprint`, `calculateQuadrantProfile`, `detectCriticalMoments`
- **Pattern Matching:** `findSimilarPatterns`, `calculateSignatureSimilarity`, `calculateOutcomeProbabilities`
- **Trajectory Prediction:** `generateTrajectoryPrediction`, `assessTrajectorySustainability`
- **Archetype Resolution:** `classifyUniversalArchetype`, `calculateArchetypeSimilarity`
- **Visualization:** Radar charts, heatmaps, flow charts, gauges, timelines
- **Event Bus:** Real-time event system for pipeline hooks
- **Caching:** Signature, match, and prediction caches with TTL
- **Pipeline/Middleware:** Composable analysis pipelines with retry, timeout, validation
- **Batch/Stream Processing:** Bulk analysis with progress tracking

---

## 9. 55 Universal Adapters

**Location:** `src/lib/pensent-core/domains/universal/adapters/` (88 items)

En Pensent has 55 domain adapters organized in phases:

### Foundation (27 adapters)
Temporal consciousness, linguistic semantic, human attraction, cosmic, bio, mycelium, consciousness, mathematical foundations, universal patterns, Grotthuss mechanism, soul, Rubik's cube, light, audio, music, botanical, climate/atmospheric, geological/tectonic, sensory/memory/humor, competitive dynamics, cultural valuation, universal realization impulse, multi-broker, deep biology, molecular, atomic, network.

### Phase 1 Expansion (10 adapters)
Mental time travel, cybersecurity, narrative, economic circuitry, immunological, linguistic evolution, architectural, game theory, supply chain, demographic.

### Phase 2 Expansion (18 adapters)
Medical, forensic, judicial, electoral, educational, entrepreneurial, journalistic, diplomatic, criminal, fashion, gastronomic, genetic, pharmacological, sports, comedic, artistic, meteorological, oceanographic, romantic, psychedelic, religious, therapeutic, information virality, economic warfare, nuclear, spatial.

Each adapter maps domain-specific data into the universal grid format, defining its own natural color palette and archetype set. All adapters are documented in `ADAPTER_MATRIX.ts` with detection capabilities and cross-domain resonance patterns.

---

## 10. Photonic Computing Architecture

**Location:** `src/lib/pensent-core/photonic-architecture.ts`

The software system models photonic/neuromorphic computing using the exact mathematics that physical silicon photonics hardware uses. The vision is to fabricate a physical chip.

### EnPensent-27 Chip Spec

- **27 photonic processing units** (one per foundation domain)
- **64×64 waveguide matrix** (like a chess board)
- **1,024 waveguides, 256 resonators, 128 modulators** per core
- **128-channel WDM bus** at 10 Tbps/channel
- **50W peak** vs 500W electronic equivalent
- **20mm × 20mm die**, 45nm silicon photonics
- **Material:** Silicon nitride (low loss at 1550nm)

### Software-to-Hardware Mapping

| Software Component | Photonic Hardware |
|---|---|
| SynapticTruthNetwork neurons | Ring resonator arrays |
| Synaptic weight × energy | Mach-Zehnder interferometer transmission |
| Cascade propagation | Waveguide-coupled resonator chains |
| Interference calculations | Physical photon interference (same equations) |
| Holographic memory | Photorefractive crystal lookup |
| 64×64 matrix | Silicon photonics chip |

### Gap to Silicon
Fabrication partner needed (MIT Photonics, TU Eindhoven, UCSB). ~$500K seed for Phase 1 prototype. The gap is fabrication, not architecture — the math is already running.

---

## 11. The Synaptic Truth Network

**Location:** `src/lib/pensent-core/domains/universal/modules/synapticTruthNetwork.ts`
**Status:** Patent Pending — Alec Arthur Shelton

A nervous system architecture that fires pattern recognition based on accumulated universal truth, not sequential calculation.

### Architecture

- **12 Pattern Neurons:** Each represents a pattern archetype with accumulated energy, firing threshold, and truth accuracy
- **Weighted Synaptic Connections:** Hebbian learning strengthens connections that co-fire correctly
- **Golden Ratio Threshold (φ = 0.618):** Energy accumulation triggers firing at the golden ratio
- **Cascade Propagation:** Firing neurons propagate signals through connected synapses with decay
- **Refractory Periods:** Cooldown after firing prevents oscillation

### Core Principle
> "Truth doesn't need to be calculated — it needs to be RECOGNIZED."

---

## 12. 24/7 Compute Farm

**Configuration:** `ecosystem.config.json`
**Manager:** PM2

### 8 Active Workers

| Worker | Script | Purpose |
|--------|--------|---------|
| `chess-benchmark` | `ep-enhanced-worker.mjs` | Chess game analysis (worker 1 of 3) |
| `chess-benchmark-2` | `ep-enhanced-worker.mjs` | Chess game analysis (worker 2 of 3) |
| `chess-benchmark-3` | `ep-enhanced-worker.mjs` | Chess game analysis (worker 3 of 3) |
| `hf-trader` | `high-frequency-paper-trader.mjs` | Paper trading |
| `ib-bridge` | `server-simple.js` | IB Gateway connection |
| `server-auto-evolution` | `server-auto-evolution.mjs` | Self-learning engine |
| `market-prediction` | `market-prediction-worker.mjs` | Multi-timeframe market predictions |
| `system-monitor` | `system-monitor.mjs` | Health monitoring & alerts |

### Chess Worker Partitioning (No Overlap)

Workers are partitioned by both **player** and **time window** to prevent duplicate work:

- **Worker 1:** First third of players, 0–1.5 years back
- **Worker 2:** Second third of players, 1.5–3 years back
- **Worker 3:** Last third of players, 3–5 years back

Deduplication: in-memory Set of 20K recent game IDs + DB `ON CONFLICT (game_id) DO NOTHING`.

### Target Throughput
- **17,000+ games/day** sustained minimum
- Auto-scale trigger: queue > 100 games
- CEO alert: daily count < 17,000

### Connection Resilience
- Pool max: 3 connections per worker (9 total, safe for Supabase)
- `resilientQuery()` wrapper retries failed queries 3× with backoff
- `pool.on('error')` handler prevents crashes on dropped connections

---

## 13. Self-Learning & Auto-Evolution

### Server Auto-Evolution (`server-auto-evolution.mjs`)

The self-evolving engine queries the database for accuracy trends and adjusts strategy:

1. **Archetype Accuracy Trends:** Compares recent (3-day) vs older (3–14 day) per-archetype accuracy to detect improving/declining archetypes
2. **Live Weights:** Queries `chess_prediction_attempts` for real per-archetype accuracy (replaces hardcoded values)
3. **Puzzle Calibration Merge:** Loads puzzle calibration data from `farm/data/archetype-calibration.json`
4. **Decision Logic:** Trust hybrid prediction, trust Stockfish, consensus boost, or material tiebreak based on trend + live weights

### Self-Learning Mechanisms Across Domains

| Domain | What It Learns |
|--------|---------------|
| Chess | Archetype weights from accuracy data (every 50 cycles) |
| Battery | Optimal deviation threshold, blend alpha, grid centroids |
| Chemical | Fault priors, vote threshold, z-score threshold |
| Energy | Threshold, alpha, archetype weights, centroids |
| Music | Blend alpha, direction threshold, archetype weights |
| Market | Directional thresholds per timeframe, tactical calibration multipliers, archetype weights |

### The Core Principle
> "Consistency doesn't change but understanding grows with volume."

The system's architecture remains constant — more data doesn't change the algorithm, it refines the parameters the algorithm discovers for itself.

---

## 14. Market Prediction System

### Multi-Timeframe Architecture

The market prediction worker routes through the SAME universal grid portal at different temporal granularities:

| Timeframe | Candle Size | Resolution | Chess Time-Control Mapping |
|-----------|------------|------------|---------------------------|
| Scalp | 1m | 5m | Puzzle/Bullet |
| Short | 5m | 30m | Bullet/Blitz |
| Medium | 15m | 2h | Blitz/Rapid |
| Swing | 1h | 8h | Rapid/Classical |
| Daily | 1d | 24h | Classical/Rapid |

### Cross-Timeframe Intelligence Engine

Chess archetype accuracy BY time control is mapped to market timeframes:

- `buildCrossTimeframeIntelligence()`: Queries chess predictions grouped by time control
- `getTimeframeChessResonance(marketTimeframe)`: Returns matched chess intelligence
- Each market prediction receives a chess signal from the matching time controls

### 5 Tactical Detectors (Chess → Market)

1. **Trap / Queen Sacrifice:** Volume spike + apparent momentum + weak buying pressure = institutional distribution → reversal
2. **En Passant / Fleeting Window:** Gap that fills within 1–3 candles → mean reversion (act now or miss it)
3. **Pawn Promotion / Transformation:** Long compression → explosive breakout → continuation
4. **Castling / Repositioning:** Selling pressure then flow turning → regime change
5. **Blunder / Free Queen:** Extreme volume + capitulation → buy the blood (opposite of trap)

### Adaptive Context

`computeMarketContext(features)` determines volatility regime (quiet/normal/volatile/extreme) and scales all tactical detector thresholds accordingly — a 2× volume spike in a quiet market is significant (like a pawn on the 7th rank), while the same spike in a volatile market needs a bigger signal.

---

## 15. Web Application

### Route Architecture

Routes are split into **public** and **CEO-only** (protected by `AdminRoute` component):

#### Public Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | Index | Homepage |
| `/play` | Play | Chess game interface |
| `/creative-mode` | CreativeMode | Creative visualization mode |
| `/marketplace` | Marketplace | Art marketplace |
| `/about` | About | About En Pensent |
| `/openings` | OpeningEncyclopedia | Chess opening reference |
| `/code-analysis` | CodeAnalysis | Code pattern analysis |
| `/my-palettes` | MyPalettes | User color palettes |
| `/my-vision` | MyVision | User visualizations gallery |
| `/book` | BookGenerator | Chess art book generator |
| `/account` | Account | User account management |

#### CEO-Only Routes (Admin)
| Path | Page | Description |
|------|------|-------------|
| `/analytics` | Analytics | Full analytics dashboard |
| `/benchmark` | Benchmark | Live benchmark results |
| `/investors` | Investors | Investor pitch/data |
| `/trading` | ScalpingTerminalPage | Trading terminal |
| `/options` | OptionsScalpingPage | Options scalping |
| `/stock-predictions` | StockPredictions | Market predictions |
| `/strategic-plan` | StrategicPlan | Company strategy |
| `/academic-paper` | AcademicPaper | Academic publication |
| `/admin/ceo-dashboard` | AdminCEODashboard | CEO control center |
| `/admin/economics` | AdminEconomics | Economic controls |
| `/proof` | ProofCenter | Proof of accuracy |

### React Providers (Wrap entire app)

1. **`RealtimeAccuracyProvider`** — Live accuracy tracking from Supabase
2. **`AutoEvolutionProvider`** — Self-evolution engine (auto-starts)
3. **`UniversalHeartbeatProvider`** — System health heartbeat (30s interval)

### State Stores (Zustand)

| Store | Purpose |
|-------|---------|
| `cartStore` | Shopping cart for marketplace |
| `sessionStore` | User session state |
| `tradingSessionStore` | Trading session data |
| `visualizationStateStore` | Visualization rendering state |
| `activeVisionStore` | Currently viewed visualization |
| `currencyStore` | Currency preferences |
| `printOrderStore` | Print order management |
| `recentlyViewedStore` | Recently viewed items |
| `soundStore` | Sound preferences |

---

## 16. Database Layer (Supabase)

**Project ID:** `ezvfslkjyjsqycztyfxh`
**URL:** `https://ezvfslkjyjsqycztyfxh.supabase.co`

### Key Tables

| Table | Purpose |
|-------|---------|
| `chess_prediction_attempts` | Game predictions with SHA-256 position hashes |
| `chess_benchmark_results` | Aggregated accuracy metrics |
| `cross_domain_correlations` | Cross-domain pattern detection |
| `system_alerts` | CEO notification queue |
| `company_profit_pool` | Stripe revenue tracking |
| `analysis_queue` | Pending analysis jobs |

### Data Integrity Safeguards
- Position deduplication via SHA-256(FEN)
- Game ID uniqueness constraints
- Data quality tier tracking (`farm_enhanced_8quad`)
- A/B test accuracy comparison (4-quadrant vs 8-quadrant)
- RLS policies enforce user isolation

---

## 17. Supabase Edge Functions

48 Edge Functions deployed via Supabase (Deno runtime):

### Core Functions
| Function | Purpose |
|----------|---------|
| `stock-data` | Yahoo Finance market data (returns null on failure, never fake) |
| `lichess-games` | Fetch games from Lichess API |
| `chesscom-games` | Fetch games from Chess.com API |
| `lichess-cloud-eval` | Cloud evaluation from Lichess |
| `resolve-predictions` | Resolve pending market predictions |
| `market-collector` | Market data collection |
| `multi-broker-data` | Multi-broker data aggregation |
| `options-data` | Options chain data |
| `farm-heartbeat` | Farm health check |
| `system-heartbeat` | System health check |
| `health-check` | General health endpoint |

### Commerce & Auth
| Function | Purpose |
|----------|---------|
| `create-checkout` | Stripe checkout session |
| `stripe-webhook` | Stripe webhook handler |
| `marketplace-purchase` | Marketplace purchases |
| `complete-marketplace-purchase` | Purchase completion |
| `wallet-deposit` | Wallet deposit processing |
| `grant-ceo-admin` | CEO admin role grant |
| `check-subscription` | Subscription status |

### Intelligence & Learning
| Function | Purpose |
|----------|---------|
| `auto-evolve` | Trigger auto-evolution cycle |
| `continuous-learning` | Learning pipeline trigger |
| `auto-heal-codebase` | Self-healing codebase |
| `analyze-repository` | Repository analysis |
| `validate-concept` | Concept validation |
| `chess-heatmap-analysis` | Chess heatmap generation |
| `daily-snapshot` | Daily metrics snapshot |
| `en-pensent-log` | System logging |
| `en-pensent-recall` | Memory recall |

---

## 18. Data Integrity Rules

These are **absolute rules** enforced across the entire system:

1. **NEVER source false data.** The ONLY synthesis allowed is within prediction algorithms.
2. **NEVER synthesize data of any kind** outside of prediction engines.
3. **All external data must be 100% real:** Lichess games, Chess.com games, Yahoo Finance.
4. **No simulation fallback.** When real data is unavailable → show "OFFLINE".
5. **Every prediction must be traceable** to source game ID.
6. **Position hashes (SHA-256)** required for deduplication.
7. **Same game_id CANNOT be re-analyzed** in future runs.
8. **Dashboard metrics must match DB truth exactly** — no estimates.
9. **Profit pool uses real Stripe data ONLY** — no simulated revenue.
10. **All public metrics must be verifiable** from Supabase database.

### Data Integrity Audit History
Three rounds of audits found and fixed 24 violations total (fake `Math.random()` values, simulation fallbacks, mock data). All production pipelines are now clean. Remaining `Math.random()` usage is safe (animations, ID generation, gameplay, shuffle/selection).

---

## 19. Deployment & Infrastructure

### Production Deployment
```bash
npx vercel --prod
```
- **Platform:** Vercel (NEVER Netlify)
- **Domain:** enpensent.com
- **Framework:** Vite
- **Build:** `npm install && npm run build`
- **Output:** `dist/`

### Build Configuration (`vite.config.ts`)
- **Minification:** Terser with `drop_console`, `drop_debugger`
- **Pure functions removed:** `console.log`, `console.info`, `console.debug`
- **Path alias:** `@` → `./src`
- **Dev server:** Port 8080

### Security Headers (`vercel.json`)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- SPA rewrites: all paths → `/index.html`

### Farm Management
```bash
# Start all PM2 workers
pm2 start ecosystem.config.json

# Check status
pm2 status

# View logs
pm2 logs chess-benchmark

# Stop all
pm2 stop all
```

---

## 20. Grants & Funding Pipeline

13 grant application briefs in `public/documents/grants/`, covering ~$50M+ in potential funding:

### Priority Applications

| Grant | Amount | Status |
|-------|--------|--------|
| DARPA PICASSO | $35M | Due March 6, 2026 (highest priority) |
| IARPA | $1M–$20M | Cross-domain intelligence |
| DOE ARPA-E | $500K–$10M | Energy efficiency |
| DoD SBIR | $250K–$1.75M | Multi-sensor fusion |
| NSF Convergence Accelerator | $750K–$5M | Convergence research |
| CHIPS/NIST | $500K–$10M | Domestic photonic fabrication |
| NASA SBIR | $150K–$750K | Battery critical detection |
| NSF POSE | $300K–$1.5M | Open-source ecosystem |
| ONR Young Investigator | $510K | Naval fusion (needs MIT) |
| MIT Deshpande Center | $125K | Rolling (needs MIT co-PI) |

### Canadian Programs (Entity is Canadian)
- NRC IRAP, SR&ED tax credits, IDEaS (defence), NSERC Alliance, Mitacs, CanExport

### US Restrictions
- SBIR/STTR programs are BLOCKED (require >51% US ownership)
- DARPA/ARPA-E/IARPA BAAs accessible to foreign entities via NCAGE + SAM.gov

---

## 21. Key Commands Reference

### Development
```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm test             # Run Vitest tests
npm run test:e2e     # Run Playwright E2E tests
```

### Deployment
```bash
npx vercel --prod    # Deploy to production
```

### Farm
```bash
pm2 start ecosystem.config.json   # Start all workers
pm2 status                         # Check worker status
pm2 logs chess-benchmark           # View chess worker logs
pm2 logs market-prediction         # View market worker logs
pm2 restart all                    # Restart all workers
pm2 stop all                       # Stop all workers
cd farm && ./farm.sh start         # Alternative farm start
cd farm && ./farm.sh monitor       # Live monitoring dashboard
```

### Database
```bash
node check-supabase.mjs            # Check Supabase connection
node check-table.mjs               # Check table structure
node verify-data.mjs               # Verify data integrity
node debug-sql.mjs                 # Debug SQL queries
```

### Benchmarks
```bash
node farm/workers/battery-benchmark-worker.mjs    # Run battery benchmark
node farm/workers/tep-benchmark-worker.mjs         # Run chemical benchmark
node farm/workers/energy-benchmark-worker.mjs      # Run energy benchmark
node farm/workers/music-benchmark-worker.mjs       # Run music benchmark
```

### Audit & Analysis
```bash
node farm/scripts/accuracy-report.js               # Accuracy report
node farm/scripts/scientific-evidence-audit.cjs     # Scientific audit
node farm/scripts/data-integrity-monitor.mjs        # Data integrity check
node farm/scripts/verify-legitimacy.js              # Legitimacy verification
node farm/scripts/ep-vs-sf17-audit.cjs              # EP vs Stockfish audit
```

---

## Architecture Diagram (Conceptual)

```
                    ┌─────────────────────────────────────────┐
                    │           enpensent.com (Vercel)         │
                    │      React + Vite + TailwindCSS          │
                    │    60 Pages | 298 Components | 67 Hooks  │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │         Supabase (PostgreSQL)            │
                    │  48 Edge Functions | Auth | Realtime     │
                    │  chess_prediction_attempts               │
                    │  cross_domain_correlations               │
                    │  company_profit_pool                     │
                    └──────────────┬──────────────────────────┘
                                   │
     ┌─────────────────────────────┼─────────────────────────────┐
     │                             │                             │
┌────▼────┐  ┌────────────────────▼───────────────┐  ┌──────────▼──────────┐
│ Lichess │  │        24/7 Compute Farm (PM2)      │  │    Yahoo Finance    │
│Chess.com│  │                                     │  │    EIA Energy API   │
│   APIs  │  │  3× chess-benchmark workers         │  │    IB Gateway       │
│         │  │  1× market-prediction worker        │  │                     │
└─────────┘  │  1× server-auto-evolution           │  └─────────────────────┘
             │  1× high-frequency paper trader     │
             │  1× ib-bridge                       │
             │  1× system-monitor                  │
             └────────────────┬────────────────────┘
                              │
              ┌───────────────▼───────────────────┐
              │     Universal Grid Portal          │
              │     (universal-grid.mjs)           │
              │                                    │
              │  createGrid() → recordVisit()      │
              │  → generateFingerprint()           │
              │  → calculateQuadrantProfile()      │
              │  → classifyArchetype()             │
              │  → prediction                      │
              └───────────────┬───────────────────┘
                              │
        ┌─────────┬───────────┼───────────┬──────────┬──────────┐
        │         │           │           │          │          │
     ┌──▼──┐  ┌──▼──┐  ┌─────▼────┐  ┌──▼──┐  ┌───▼──┐  ┌───▼──┐
     │Chess│  │Batt.│  │Chemical  │  │Mkt. │  │Energy│  │Music │
     │Adpt.│  │Adpt.│  │Adapter   │  │Adpt.│  │Adpt. │  │Adpt. │
     │59.7%│  │56.5%│  │F1 93.3%  │  │35.5%│  │66.6% │  │34.4% │
     └─────┘  └─────┘  └──────────┘  └─────┘  └──────┘  └──────┘
```

---

*En Pensent — Universal Temporal Pattern Recognition*
*"The universe speaks in patterns. We are building the Rosetta Stone for this universal language."*
*Copyright (c) 2024-2026 En Pensent. All Rights Reserved.*
