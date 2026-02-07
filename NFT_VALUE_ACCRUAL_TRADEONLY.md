# Vision NFT Value Accrual Architecture (No Direct Payouts)

## Core Philosophy
**Value accrues to the NFT, not to the owner.** Owners realize gains only through:
- Selling on marketplace (another buyer pays the appreciated value)
- Trading for other visions
- Collateral for loans (future feature)

No direct cash withdrawals from accrued value. The platform retains all funds for reinvestment.

---

## Economic Model

### Value Accrual Sources
1. **Print Orders** → 17% of profit adds to vision's "implied value"
2. **Game Popularity** → Visions using "hyped" games get appreciation boost
3. **Palette Scarcity** → Limited palettes increase value per vision
4. **Trading Volume** → Active trading history adds premium
5. **Engagement** → Views/downloads add micro-value

### Value Realization Events
- **Marketplace Sale**: Buyer pays full appreciated value, seller keeps gain
- **Trade**: Exchange visions at current floor values
- **External Sale**: Export as real NFT and sell on OpenSea

### No Payout Mechanics
❌ Owner cannot:
- Withdraw accrued value as cash
- Claim "dividends" from value pools
- Redeem vision for its appraised value

✅ Owner can:
- Sell to another buyer at appreciated price
- Trade for other appreciating visions
- Use as collateral (future)
- Export as on-chain NFT

---

## Database Schema

### vision_nfts (Individual NFT Registry)
```sql
CREATE TABLE vision_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visualization_id UUID REFERENCES saved_visualizations(id) ON DELETE CASCADE,
  
  -- NFT Identity
  token_id TEXT UNIQUE, -- "enpensent-1234"
  mint_number INTEGER, -- #1 of 50 using this palette
  
  -- Value Tracking (Implied/Paper Value)
  mint_price_cents INTEGER NOT NULL, -- Initial acquisition cost
  current_floor_price_cents INTEGER NOT NULL, -- Calculated implied value
  all_time_high_cents INTEGER DEFAULT 0,
  all_time_low_cents INTEGER DEFAULT 0,
  
  -- Value Sources Breakdown
  print_revenue_contribution_cents INTEGER DEFAULT 0,
  gamecard_pool_share_cents INTEGER DEFAULT 0,
  palette_pool_share_cents INTEGER DEFAULT 0,
  opening_pool_share_cents INTEGER DEFAULT 0,
  engagement_value_cents INTEGER DEFAULT 0,
  trading_premium_cents INTEGER DEFAULT 0,
  
  -- Attribution (Why it's valuable)
  game_id TEXT REFERENCES gamecard_value_pool(game_id),
  palette_id TEXT REFERENCES palette_value_pool(palette_id),
  opening_eco TEXT REFERENCES opening_value_pool(opening_eco),
  
  -- Rarity Metrics
  rarity_score INTEGER, -- 0-100 calculated score
  total_prints_ordered INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_unique_viewers INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  
  -- Ownership
  current_owner_id UUID REFERENCES auth.users(id),
  minted_by UUID REFERENCES auth.users(id),
  minted_at TIMESTAMP DEFAULT now(),
  
  -- Trading History
  last_sale_price_cents INTEGER,
  last_sale_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index for fast floor price lookups
CREATE INDEX idx_vision_nfts_floor_price ON vision_nfts(current_floor_price_cents DESC);
CREATE INDEX idx_vision_nfts_game ON vision_nfts(game_id);
CREATE INDEX idx_vision_nfts_palette ON vision_nfts(palette_id);
CREATE INDEX idx_vision_nfts_owner ON vision_nfts(current_owner_id);
```

### vision_value_history (Time-series tracking)
```sql
CREATE TABLE vision_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vision_nft_id UUID REFERENCES vision_nfts(id) ON DELETE CASCADE,
  
  -- Snapshot values
  floor_price_cents INTEGER NOT NULL,
  total_contribution_cents INTEGER NOT NULL,
  
  -- Component breakdown at this moment
  print_revenue_cents INTEGER DEFAULT 0,
  gamecard_share_cents INTEGER DEFAULT 0,
  palette_share_cents INTEGER DEFAULT 0,
  opening_share_cents INTEGER DEFAULT 0,
  engagement_cents INTEGER DEFAULT 0,
  trading_premium_cents INTEGER DEFAULT 0,
  
  -- Market context
  game_hype_score INTEGER, -- 0-100 how hot is the game
  palette_scarcity INTEGER, -- visions using this palette
  
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Index for chart data
CREATE INDEX idx_value_history_vision_date ON vision_value_history(vision_nft_id, snapshot_date DESC);
```

### vision_trades (Trading History)
```sql
CREATE TABLE vision_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vision_nft_id UUID REFERENCES vision_nfts(id) ON DELETE CASCADE,
  
  -- Trade details
  seller_id UUID REFERENCES auth.users(id),
  buyer_id UUID REFERENCES auth.users(id),
  trade_price_cents INTEGER NOT NULL,
  trade_type TEXT CHECK (trade_type IN ('marketplace_sale', 'private_trade', 'external_sale')),
  
  -- Value appreciation realized
  seller_gain_cents INTEGER, -- trade_price - seller_acquisition_cost
  platform_fee_cents INTEGER, -- 5% of trade
  
  -- Attribution tracking
  game_id TEXT,
  palette_id TEXT,
  
  traded_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Index for trading volume analytics
CREATE INDEX idx_trades_vision ON vision_trades(vision_nft_id, traded_at DESC);
CREATE INDEX idx_trades_game ON vision_trades(game_id);
CREATE INDEX idx_trades_palette ON vision_trades(palette_id);
```

---

## Value Calculation Engine

### Daily Floor Price Calculation
```typescript
// supabase/functions/calculate-vision-floors/index.ts

interface ValueComponents {
  baseValue: number;           // mint_price or last_sale
  printRevenue: number;        // 17% of all print orders
  gamecardShare: number;       // (game_pool / total_game_visions)
  paletteShare: number;        // (palette_pool / total_palette_visions)
  openingShare: number;        // (opening_pool / total_opening_visions)
  engagementValue: number;     // views * $0.001 + downloads * $0.01
  tradingPremium: number;      // last_sale * 0.1 if recent trade
}

function calculateFloorPrice(visionId: string): number {
  const components = getValueComponents(visionId);
  
  // Weighted formula
  const floorPrice = 
    components.baseValue * 0.30 +                    // 30% base
    components.printRevenue * 0.25 +                 // 25% print-driven
    components.gamecardShare * 0.20 +                // 20% game popularity
    components.paletteShare * 0.15 +                 // 15% palette scarcity
    components.openingShare * 0.05 +                 // 5% opening significance
    components.engagementValue * 0.03 +              // 3% engagement
    components.tradingPremium * 0.02;                // 2% trading activity
  
  return Math.round(floorPrice);
}

// Runs daily at 00:00 UTC
export async function dailyFloorPriceUpdate() {
  const visions = await getAllActiveVisionNFTs();
  
  for (const vision of visions) {
    const newFloor = calculateFloorPrice(vision.id);
    const oldFloor = vision.current_floor_price_cents;
    
    // Update NFT record
    await updateVisionFloor(vision.id, newFloor);
    
    // Record history
    await recordValueSnapshot(vision.id, newFloor);
    
    // Notify owner of significant appreciation (>5%)
    if (newFloor > oldFloor * 1.05) {
      await notifyValueAppreciation(vision.current_owner_id, vision.id, oldFloor, newFloor);
    }
  }
}
```

### Value Attribution from Pools
```typescript
// How a vision gets its share of value pools

function calculatePoolShares(visionId: string) {
  const vision = getVisionNFT(visionId);
  
  // Game share: (vision_rarity / total_game_rarity) * game_pool
  const gameVisions = getVisionsByGame(vision.game_id);
  const totalGameRarity = gameVisions.reduce((sum, v) => sum + v.rarity_score, 0);
  const gameShare = (vision.rarity_score / totalGameRarity) * getGamecardPool(vision.game_id);
  
  // Palette share: (1 / total_visions_using_palette) * palette_pool
  const paletteVisions = getVisionsByPalette(vision.palette_id);
  const paletteShare = (1 / paletteVisions.length) * getPalettePool(vision.palette_id);
  
  // Opening share: weighted by ECO depth
  const openingVisions = getVisionsByOpening(vision.opening_eco);
  const openingWeight = calculateOpeningWeight(vision.opening_eco); // deeper = more valuable
  const totalOpeningWeight = openingVisions.reduce((sum, v) => sum + calculateOpeningWeight(v.opening_eco), 0);
  const openingShare = (openingWeight / totalOpeningWeight) * getOpeningPool(vision.opening_eco);
  
  return { gameShare, paletteShare, openingShare };
}
```

---

## Trading Mechanics

### Marketplace Sale Flow
```
Seller lists vision at $150
  ↓
Buyer purchases for $150
  ↓
Seller receives $142.50 (95%)
Platform fee $7.50 (5%) → Reinvested into pools
  ↓
Vision floor price updates to $150 (new base)
Seller realizes $62.50 gain (bought at $80, sold at $150)
Buyer holds appreciating asset starting at $150
```

### Trade-Only Mode (No Cash)
```
Owner A has Vision #1 (floor $100)
Owner B has Vision #2 (floor $120)
  ↓
They agree to trade + $20 from A to B
  ↓
Ownership swaps
Platform fee: 5% of $20 = $1
  ↓
Both visions continue appreciating
```

---

## UI/UX Changes

### Vision Card Display
```
┌─────────────────────────────────────┐
│ [Vision Preview Image]              │
│                                     │
│ "Fischer vs Spassky"                │
│ Dragon Palette • #12 of 50         │
│                                     │
│ Floor: $87.50 ↑ 23% this month     │
│ Mint: $0 → ATH: $120               │
│                                     │
│ [View History] [List for Sale]      │
└─────────────────────────────────────┘
```

### Value History Graph
- 30/90/365 day floor price trend
- Events marked ("Print ordered", "Game went viral")
- Comparison to similar visions

### Marketplace Listing
```
List Price: $120.00
Current Floor: $87.50
Your Gain: +$32.50 (37%)
Last Sale: $95.00 (2 weeks ago)
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. Create `vision_nfts` table
2. Create `vision_value_history` table  
3. Create `vision_trades` table
4. Backfill all existing visions with NFT records
5. Calculate initial floor prices

### Phase 2: Value Engine (Week 2)
1. Build daily calculation edge function
2. Hook into print order flow (update values)
3. Hook into marketplace flow (record trades)
4. Value history API endpoints

### Phase 3: UI Integration (Week 3)
1. Show floor price on vision cards
2. Value history charts
3. "Appreciating" badges for hot visions
4. Value-based sorting/filtering

### Phase 4: Trading Features (Week 4)
1. List at floor price or premium
2. Trade offers (swap visions)
3. Value alerts ("Your vision hit ATH!")
4. Portfolio value tracking

### Phase 5: External NFTs (Optional)
1. Mint on Solana/Ethereum
2. Export to OpenSea
3. Bridge back for premium features

---

## Economic Benefits

### For Platform
- All cash stays in ecosystem (reinvested)
- No withdrawal/payout infrastructure needed
- Simpler compliance (no money transmission)
- Value pools grow continuously

### For Users
- Clear appreciation mechanics
- Realized gains only on sale (taxable event)
- Gamified collection building
- Trading economy drives engagement

### For Collectors
- "Blue chip" games/palettes appreciate faster
- Early adoption = higher gains
- Trading becomes strategic (hold vs. flip)

---

## Key Differences from Original Model

| Aspect | Original (With Payouts) | New (Trade-Only) |
|--------|------------------------|------------------|
| Value Realization | Withdraw cash | Sell to buyer |
| Platform Cash Flow | Outflows for payouts | All reinvested |
| User Incentive | Passive income | Active trading |
| Tax Complexity | Complex (dividends) | Simple (capital gains) |
| Regulatory Risk | Higher (securities) | Lower (collectibles) |
| Liquidity | Platform must provide | User-to-user |

This model transforms visions into **collectible assets** that appreciate based on real demand, with value realized only through the secondary market.
