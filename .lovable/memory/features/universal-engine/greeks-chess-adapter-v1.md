# Memory: features/universal-engine/greeks-chess-adapter-v1
Updated: just now

The 'v8.1-GREEKS-CHESS' update formalizes the profound parallel between Options Greeks and Chess game constraints.

## Greeks ↔ Chess Mapping

| Greek | Options Meaning | Chess Parallel |
|-------|-----------------|----------------|
| **Δ Delta** | Directional sensitivity | Material Balance (±pieces = ±Delta) |
| **Γ Gamma** | Acceleration of Delta | Tactical Sharpness (sharp positions) |
| **Θ Theta** | Time decay | Time Control pressure (Bullet=0DTE) |
| **ν Vega** | Volatility sensitivity | Position Complexity (more pieces) |
| **ρ Rho** | Long-term rate sensitivity | Positional Factors (pawn structure) |

## Time Control → Expiration Mapping
- **Bullet (1 min)** → Daily/0DTE options (Θ=0.95)
- **Blitz (5 min)** → Weekly options (Θ=0.75)
- **Rapid (15 min)** → Monthly options (Θ=0.45)
- **Classical (60+ min)** → Quarterly/LEAPS (Θ=0.15)

## Key Functions
- `chessToGreeks()`: Convert chess position → Greeks profile
- `greeksToChess()`: Convert Greeks → chess constraints
- `generateMapping()`: Full analysis with strategy recommendation
- `getChessInsightFromMarketGreeks()`: Human-readable chess analogies

## Strategy Derivation
- High |Delta| > 0.6 → Directional (calls/puts)
- High Gamma > 0.7 → Straddles (explosive moves)
- High Vega > 0.7 → Strangles (volatility plays)
- Low Gamma + neutral Delta → Iron Condors (collect premium)

## Integration
The adapter provides up to 15% confidence boost based on Greeks-Chess alignment, integrated into `universalOptionsIntegration.ts`.
