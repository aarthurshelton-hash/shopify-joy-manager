# Memory: features/universal-engine/v8-07-agreement-calibrated-system
Updated: now

The 'v8.07c-BREAKTHROUGH-MAXIMIZER' system optimizes for disagreement wins by trusting pattern recognition more aggressively:

## Core Philosophy
- Every SF miss is an opportunity for pattern recognition to shine
- Strong archetypes (>50% accuracy) should NEVER defer to SF
- Weak SF signals are BREAKTHROUGH territory

## Calibration Logic

### Agreement (56% historical accuracy)
- Strong archetype (>50%): 1.18x boost
- Decent archetype (45-50%): 1.10x boost  
- Weak archetype: 1.02x boost
- Additional 1.08x if SF signal is strong (confirmation)

### Disagreement - BREAKTHROUGH ZONE

**Strong Archetypes (>50% accuracy) - NEVER DEFER:**
- Absolute extreme SF (>350cp): 0.92x (minimal penalty)
- Extreme SF (>250cp): 0.98x (almost no penalty)
- Strong SF (>150cp): 1.0x (no penalty)
- Weak SF: 1.05x (BOOST - capitalize on opportunity)

**Decent Archetypes (45-50%):**
- Absolute extreme SF: Defer, 0.82x
- Extreme SF: 0.90x (cautious)
- Strong SF: 0.95x (slight penalty)
- Weak SF: 1.0x (no penalty - breakthrough)

**Weak Archetypes (<45%):**
- Absolute extreme SF: Defer, 0.78x
- Extreme SF: Defer, 0.82x
- Strong SF: 0.88x (cautious trust)
- Weak SF: 0.95x (test the archetype)

## Key Changes from v8.07b
- Raised absolute defer threshold to >350cp
- Strong archetypes NEVER defer regardless of SF eval
- Added BOOST (1.05x) for strong archetype + weak SF disagreement
- Raised confidence ceiling for elite archetypes (40 + accuracy*100)
