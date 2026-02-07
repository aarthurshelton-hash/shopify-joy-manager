# Individual NFT Vision Architecture

## Current State
Value accrues to CATEGORIES:
- `gamecard_value_pool` - Game X earns from all visions using it
- `palette_value_pool` - Palette Y earns from all visions using it
- `opening_value_pool` - Opening Z earns from all visions using it

## Target State
Value accrues to INDIVIDUAL VISIONS as NFTs:
- Vision #1234 has its own token_id, floor_price, appreciation_history
- Owner holds NFT representing that specific visualization
- Value appreciation tied to that specific combination of game+palette

---

## Required Architecture Changes

### 1. NFT Registry Table
```sql
CREATE TABLE vision_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visualization_id UUID REFERENCES saved_visualizations(id),
  token_id TEXT UNIQUE, -- "enpensent-1234" or contract token ID
  chain TEXT DEFAULT 'solana', -- or 'ethereum', 'polygon'
  contract_address TEXT,
  
  -- Value tracking
  mint_price_cents INTEGER,
  current_floor_price_cents INTEGER,
  all_time_high_cents INTEGER,
  appreciation_rate DECIMAL(5,2), -- annual %
  
  -- Attribution tracking (what makes it valuable)
  game_id TEXT REFERENCES gamecard_value_pool(game_id),
  palette_id TEXT REFERENCES palette_value_pool(palette_id),
  opening_eco TEXT REFERENCES opening_value_pool(opening_eco),
  
  -- Rarity scoring
  rarity_score INTEGER, -- calculated from uniqueness
  total_prints_ordered INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  
  -- Provenance
  minted_at TIMESTAMP,
  minted_by UUID,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 2. Vision Value Accrual Table
```sql
CREATE TABLE vision_value_accrual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vision_nft_id UUID REFERENCES vision_nfts(id),
  
  -- Value sources
  print_order_contribution_cents INTEGER DEFAULT 0,
  marketplace_sale_contribution_cents INTEGER DEFAULT 0,
  view_contribution_cents INTEGER DEFAULT 0,
  download_contribution_cents INTEGER DEFAULT 0,
  
  -- Derived value
  attributed_gamecard_value_cents INTEGER DEFAULT 0, -- share of game pool
  attributed_palette_value_cents INTEGER DEFAULT 0, -- share of palette pool
  attributed_opening_value_cents INTEGER DEFAULT 0, -- share of opening pool
  
  -- Total calculated value
  total_attributed_value_cents INTEGER DEFAULT 0,
  
  snapshot_date DATE,
  created_at TIMESTAMP DEFAULT now()
);
```

### 3. Value Accrual Engine (Edge Function)
```typescript
// /supabase/functions/calculate-vision-value/index.ts

/**
 * Calculates the "implied value" of a vision NFT based on:
 * 1. Print orders of that specific vision (direct revenue)
 * 2. Views/downloads of that vision (engagement)
 * 3. Game popularity (share of gamecard pool)
 * 4. Palette rarity (share of palette pool)
 * 5. Opening significance (share of opening pool)
 * 6. Marketplace trading history
 * 
 * Runs daily to update floor prices
 */

export async function calculateVisionValue(visionNftId: string) {
  // Get base value from mint
  const nft = await getVisionNFT(visionNftId);
  
  // Calculate appreciation from print orders
  const printRevenue = await getVisionPrintRevenue(visionNftId);
  const printValue = printRevenue * 0.17; // 17% appreciation rate
  
  // Calculate share of gamecard pool
  const gamePool = await getGamecardPoolValue(nft.game_id);
  const gameShare = gamePool * (nft.rarity_score / totalRarityScore);
  
  // Calculate share of palette pool
  const palettePool = await getPalettePoolValue(nft.palette_id);
  const paletteShare = palettePool * (1 / totalVisionsWithPalette);
  
  // Calculate trading premium
  const lastSale = await getLastSalePrice(visionNftId);
  const tradingPremium = lastSale ? lastSale * 0.1 : 0; // 10% of last sale
  
  // Total implied value
  const impliedValue = nft.mint_price_cents + 
    printValue + 
    gameShare + 
    paletteShare + 
    tradingPremium;
  
  // Update NFT floor price
  await updateVisionFloorPrice(visionNftId, impliedValue);
  
  return impliedValue;
}
```

### 4. On-Chain Integration Options

#### Option A: Solana (Recommended)
- **Why:** Low fees (~$0.00025), fast finality, good for frequent value updates
- **Contract:** Metaplex Token Metadata program
- **Mint Pattern:** Each vision = 1 NFT with metadata URI pointing to Supabase storage
- **Value Updates:** Off-chain calculation, on-chain floor price oracle

#### Option B: Ethereum/Polygon
- **Why:** Maximum liquidity, established NFT markets (OpenSea)
- **Contract:** ERC-721 with custom value appreciation logic
- **Gas Consideration:** Updates would be batched (daily/weekly)

#### Option C: Hybrid (Recommended for launch)
- **Off-chain:** All value calculation, tracking, accrual (Supabase)
- **On-chain:** Minting only when owner wants to export/sell externally
- **Bridge:** "Wrap" off-chain vision as on-chain NFT when needed

---

## Value Accrual Mechanics

### How a Vision Accrues Value

1. **Print Orders** (Primary driver)
   - Vision #1234 gets printed → Owner earns royalty
   - 17% of profit accrues to vision's "intrinsic value"
   - Example: $50 print → $8.50 value accrual

2. **Game Popularity** (Secondary driver)
   - Game becomes "hyped" (Fischer-Spassky)
   - Gamecard pool grows from marketplace fees
   - All visions using that game get proportional value boost
   - Example: Pool grows $1000 → Vision gets +$5

3. **Palette Rarity** (Scarcity driver)
   - Limited edition palette only has 50 visions
   - Palette pool grows from usage
   - Each vision's share = Pool / 50
   - Example: Palette pool $2500 → Each vision +$50

4. **Trading Activity** (Market driver)
   - Vision sells for $200 on marketplace
   - 5% fee reinvested → $10 to value pools
   - Previous owner takes 95% appreciation
   - New owner holds at new floor price

5. **Engagement** (Network effect)
   - Vision gets 1000 views → micro-value accrual
   - Downloaded 50 times → value boost
   - Featured in showcase → premium boost

---

## Implementation Phases

### Phase 1: Off-Chain NFT Registry (Immediate)
- Create `vision_nfts` table
- Backfill all existing visions with NFT records
- Calculate initial floor prices from historical data
- Show "NFT Value" in UI for each vision

### Phase 2: Value Accrual Engine (1-2 weeks)
- Build daily calculation job
- Track all value sources (prints, views, trades)
- Update floor prices automatically
- Value history graph for each vision

### Phase 3: Marketplace Integration (2-3 weeks)
- Show "Current Value" alongside list price
- Floor price alerts ("Your vision appreciated 15%")
- Value-based search/sort ("Most valuable visions")
- Trading analytics (price history, volume)

### Phase 4: On-Chain Bridge (Optional, 1 month)
- Allow owners to "mint" vision as real NFT
- Pay gas to export to Solana/Ethereum
- Vision becomes tradable on OpenSea, Magic Eden
- Bridge back to platform for premium features

---

## Economic Model

### Value Formula
```
Vision_Value = Base_Mint_Price 
  + (Print_Revenue × 0.17)
  + (Game_Pool_Share × Rarity_Multiplier)
  + (Palette_Pool_Share × Scarcity_Factor)
  + (Last_Sale_Price × 0.1)
  + (Engagement_Score × Micro_Value)
```

### Rarity Calculation
```
Rarity_Score = Uniqueness(game_data) × Palette_Rarity × Opening_Complexity

Where:
- Uniqueness = How different is this game state
- Palette_Rarity = 100 / (number of visions using palette)
- Opening_Complexity = ECO code depth (G99 > G1)
```

### Example Value Growth

**Vision #1234: "Fischer's Immortal with Dragon Palette"**

| Event | Value Change | New Floor |
|-------|-------------|-----------|
| Mint | $0 (free claim) | $0 |
| 3 print orders | +$25.50 | $25.50 |
| Game becomes "hot" | +$12 | $37.50 |
| Palette scarcity bump | +$20 | $57.50 |
| Sold on marketplace ($100) | +$10 (trading) | $67.50 |
| Featured in showcase | +$15 | $82.50 |
| **Current Value** | | **$82.50** |

---

## UI/UX Implications

### Vision Card Updates
```
[Vision Preview]
"Fischer vs Spassky - Dragon Palette"
Owner: @alec | Floor: $82.50 ↑ 23%
[Claim] [Order Print] [View History]
```

### Value History Graph
- 30-day value trend
- Events that caused appreciation ("Print ordered", "Palette hit")
- Comparison to similar visions

### Marketplace Updates
```
List Price: $120.00
Floor Value: $82.50
Profit if sold: $37.50 (45%)
Last sale: $95.00 (3 days ago)
```

---

## Questions for You

1. **Chain Preference:** Solana (cheap/fast) or Ethereum (liquid)?
2. **Mint Timing:** Auto-mint on creation or user-initiated?
3. **Value Updates:** Real-time (expensive) or daily batch (economical)?
4. **External Markets:** Allow OpenSea trading or keep internal?
5. **Fractional Ownership:** Allow buying "shares" of valuable visions?

This architecture makes each vision a true appreciating asset based on real demand (prints, views, trades) rather than speculation.
