# MIT Startup Exchange & Photonics Lab Outreach

**STATUS: Updated Feb 13 2026 — Irina reply ready, faculty emails updated with academic ties, 4 domains.**

---

## EMAIL 0: REPLY TO IRINA GAZIYEVA — MIT Startup Exchange (SEND FIRST)

**To:** Irina Gaziyeva (Program Coordinator, MIT Startup Exchange)
**Subject:** RE: MIT Startup Exchange — Application Follow-Up

---

Dear Irina,

Thank you for following up. I'm happy to provide the details below.

**Faculty connection:**

We listed Prof. Soljačić, Prof. Englund, and Prof. Notaros because En Pensent's architecture maps directly to their research — specifically the integrated photonic processor demonstrated by their groups in Nature Photonics (Bandyopadhyay et al., Dec 2024) and the edge-learnable network paradigm introduced in the KAN paper (Liu, Vaidya et al., 2024), which Prof. Soljačić co-authored. We have not yet established a formal faculty relationship. We are actively reaching out to these professors — as well as faculty at other institutions (Université Laval COPL, University of Waterloo, UBC, University of Toronto) — to establish a sponsored research partnership. We are also in the process of applying to DARPA's PICASSO program, which would further formalize a university collaboration. The first faculty member to engage will likely become our primary research partner, and MIT is our top choice given the direct alignment with the Soljačić and Englund groups.

**Stage of development:**

We have a fully operational software implementation running 24/7 on production data across four validated domains — this is beyond proof-of-concept and into continuous production validation. The next stage is translating the software architecture onto photonic hardware, which is why the MIT faculty connection is critical.

**Growth and funding:**

We are self-funded to date. We have funding capacity for a sponsored research collaboration with MIT faculty. We are concurrently applying to DARPA (PICASSO program, ~$35M total), NSERC Alliance (Canada), and evaluating IARPA and NSF Convergence Accelerator opportunities. Our immediate goal is securing a faculty research partner, which unlocks multiple grant pathways simultaneously.

**Company size:**

En Pensent is currently a 1-person operation (founder/CEO + AI-assisted engineering). The system runs autonomously via 10 production workers on cloud infrastructure. The lean team is intentional — the architecture's value is in the algorithm and the data, not headcount.

**Proof of concept and traction:**

Yes — running proof across four domains, all using the identical universal algorithm:

- **Chess game prediction:** 700,000+ predictions at 58.5% accuracy on 3-way classification (white wins / black wins / draw). Random baseline is 33.3%. Statistical significance: p ≈ 0 (z > 80). Running 24/7 on Lichess and Chess.com grandmaster games.
- **Financial market prediction:** 36,000+ directional predictions across equities, forex, and commodities. Multi-horizon (5-minute to 24-hour). Cross-timeframe chess-resonance intelligence engine.
- **Battery degradation:** MIT-Stanford MATR dataset (140 batteries, 114,692 cycles). 56.5% accuracy with 89% critical event detection. Self-learned archetype weights.
- **Chemical fault detection:** Tennessee Eastman Process (industry benchmark, 52 sensors). F1 score 93.3% vs 72.7% Hotelling T² baseline (+20.6 percentage points). Self-learning discovered optimal detection threshold autonomously.

All four domains pass through the same 8×8 universal interference grid. The architecture uses wave equations that map directly to silicon photonics hardware (micro-ring resonators, wavelength-division multiplexing, thermo-optic phase shifters).

Live system: https://enpensent.com

**Existing use cases with large corporations:**

Not yet — we are pre-commercial. The current focus is validating the architecture across domains and establishing the academic research partnership. Large corporate engagement is the next phase, which is precisely why we're applying to the Startup Exchange.

**Target industries:**

- Photonic computing / AI hardware (primary — the chip itself is the product)
- Energy storage / battery management (critical degradation detection)
- Industrial process monitoring (chemical, manufacturing fault detection)
- Financial technology (cross-domain pattern recognition for trading intelligence)
- Defense / intelligence (multi-sensor fusion — aligned with DARPA PICASSO)

**Engagement with large corporations:**

The MIT Startup Exchange is our preferred channel for this. The architecture is domain-agnostic by design — the same chip processes chess games, battery cycles, chemical sensor data, and market candles. This means any corporation with temporal sensor data is a potential partner. We envision pilot programs where corporations provide domain-specific sensor data, and we demonstrate the universal grid's ability to self-learn patterns in their domain using the same algorithm validated on our four existing domains.

I'm happy to join the monthly assessment call and provide a live demonstration. Please let me know the next available date.

Best regards,
Alec Arthur Shelton
Founder & CEO, En Pensent
a.arthur.shelton@gmail.com
https://enpensent.com

---

## EMAIL 1: To Prof. Marin Soljačić (Primary Target)

**To:** soljacic@mit.edu (Marin Soljačić, Photonics & Modern Electro-Magnetics Group, MIT)

**Subject:** Edge-learnable interference networks validated across 4 domains — software proof for photonic compilation

---

Dear Professor Soljačić,

I'm writing because two of your group's recent papers describe — from different angles — exactly the architecture I've built in software and validated on live data across four domains.

Your KAN paper (Liu, Vaidya et al., 2024) moved learnable functions from nodes to edges, outperforming MLPs on scientific tasks while remaining interpretable. Your group's integrated photonic processor (Bandyopadhyay et al., Nature Photonics Dec 2024) then demonstrated that nonlinear deep networks can execute entirely in the optical domain at <0.5ns latency. En Pensent is the application layer that connects these two ideas: a **universal interference architecture with edge-learnable wavelength channels**, validated on real data where the same grid portal produces statistically significant results across unrelated domains.

**Live results (4 domains, same architecture, all real data):**

- **Chess:** 700,000+ game outcome predictions, **58.5% accuracy** (3-way classification, random = 33.3%), p ≈ 0 (z > 80). Running 24/7 on Lichess + Chess.com GM games.
- **Financial markets:** 36,000+ directional predictions across equities, forex, and commodities using cross-timeframe chess-resonance signals. Multi-horizon (5m → 24h).
- **Battery degradation:** MIT-Stanford MATR dataset (140 batteries, 114,692 cycles), **56.5% accuracy** with **89% critical detection**. Self-learned archetype weights from 74,805 training cycles.
- **Chemical fault detection:** Tennessee Eastman Process (industry benchmark), **F1 93.3%** vs 72.7% Hotelling T² baseline (**+20.6pp**). Self-learning discovered optimal z-threshold (19× separation improvement).

**The KAN connection:**

Like KANs, En Pensent places learnable functions on edges (interference channels), not nodes. Each domain's sensors map to wavelength-encoded channels in a universal 8×8 grid. The system learns its own optimal encoding parameters from volume — the same principle your KAN paper demonstrates with B-spline basis functions, but applied to multi-domain temporal pattern recognition. The 8-signal fusion weights and archetype classifications are analogous to KAN's edge activations: they compound with data volume without architectural changes.

**The photonic compilation path:**

The software runs wave interference equations that map directly to your integrated hardware:

- 12 synaptic neurons → micro-ring resonator arrays
- 27 adapter channels → wavelength-division multiplexed inputs
- Cross-domain interference → physical optical interference in waveguides
- Self-learned weights → thermo-optic phase shifters (your NOFUs)

I'm not doing matrix multiplication optically — I'm doing **cross-domain interference detection**, which is the native operation of photonic hardware. Your Dec 2024 paper solved the nonlinearity bottleneck. This architecture provides the multi-domain application layer.

**The ask:**

A research partnership to prototype an optical Synaptic Truth Network on your integrated platform. Benchmark photonic vs. digital performance on the same 4-domain dataset. I have funding capacity for a sponsored research collaboration.

Live system: https://enpensent.com | Technical brief attached.

Would a 30-minute call make sense?

Alec Arthur Shelton
Founder & CEO, En Pensent
a.arthur.shelton@gmail.com

---

## EMAIL 2: To Prof. Dirk Englund (Secondary Target)

**To:** englund@mit.edu (Dirk Englund, Quantum Photonics Group, MIT EECS)

**Subject:** "Computing compiled onto new architectures of physics" — running proof across 4 domains

---

Dear Professor Englund,

Your statement on the Dec 2024 photonic processor — that "computing, at its essence the mapping of inputs to outputs, can be compiled onto new architectures of linear and nonlinear physics that enable a fundamentally different scaling law" — describes exactly what I've built in software and want to compile onto your hardware.

En Pensent is a multi-domain temporal pattern recognition system running 24/7 on real data. The same universal grid architecture produces statistically significant results across **four unrelated domains**:

- **Chess:** 700,000+ predictions at **58.5%** accuracy (3-way, p ≈ 0, z > 80)
- **Financial markets:** 36,000+ multi-horizon directional predictions (equities, forex, commodities)
- **Battery degradation:** **56.5%** on MIT-Stanford MATR (140 batteries, 89% critical detection)
- **Chemical faults:** **F1 93.3%** on Tennessee Eastman (+20.6pp over Hotelling T² baseline)

The architecture uses edge-learnable interference channels — conceptually aligned with your group's KAN work (Liu, Vaidya et al., 2024) — where each domain's sensors encode as wavelengths in a universal 8×8 grid. The wave interference equations map directly to the MZI arrays and NOFUs demonstrated in your Nature Photonics paper (Bandyopadhyay et al., 2024). The "different scaling law" you described is what I observe empirically: accuracy compounds with data volume without architectural changes, because the interference patterns self-organize with more signal.

I'm seeking a research partnership to compile this system onto your integrated photonic platform and benchmark the scaling law difference quantitatively. I have funding capacity for a sponsored collaboration.

Live system: https://enpensent.com | Technical brief attached.

Would you be open to a brief conversation?

Alec Arthur Shelton
Founder & CEO, En Pensent
a.arthur.shelton@gmail.com

---

## NOTES FOR ALEC (do not include in emails):

### Send order:
1. **Soljačić first** — He's the senior PI. The KAN connection is the strongest hook — his own postdoc (Vaidya) co-authored it. Wait 5-7 days before sending to Englund if no response.
2. **Englund second** — Co-PI on the Dec 2024 paper. His own quote is the hook.
3. **Do NOT email both on the same day** — They're colleagues. Looks desperate.

### Before sending:
1. **Convert the technical brief to PDF** — `EnPensent_Technical_Brief.md` → PDF. Attach to both emails.
2. **Numbers are current as of Feb 13, 2026** — Chess 700K+ at 58.5%, Market 36K+, Battery/Chemical unchanged.
3. **Send Tuesday morning EST** — Best open rates for academic email. Avoid Monday (backlog) and Friday (checked out).

### Academic ties used:
- **KAN paper** (Apr 2024): Liu, Wang, **Vaidya**, Ruehle, Halverson, **Soljačić**, Hou, Tegmark. "Kolmogorov-Arnold Networks." arXiv:2404.19756. 3,266+ citations.
  - **Connection:** Edge-learnable activation functions = En Pensent's edge-learnable interference channels. Both move learning from nodes to connections.
- **Photonic processor** (Dec 2024): Bandyopadhyay et al. "Single-chip photonic deep neural network with forward-only training." Nature Photonics. doi:10.1038/s41566-024-01567-z.
  - **Connection:** NOFUs solve nonlinearity bottleneck. En Pensent's self-learned weights map to thermo-optic phase shifters.
- **Foundational paper** (2017): Shen, Harris, Skirlo, Prabhu, Baehr-Jones, Hochberg, Sun, Fan, **Englund**, **Soljačić**. "Deep learning with coherent nanophotonic circuits." Nature Photonics. 3,940+ citations.
  - **Connection:** Original optical neural network that En Pensent's architecture extends to multi-domain interference.

### Key people in Soljačić's group (current members):
- **Dr. Sachin Vaidya** (svaidya1@mit.edu) — Postdoc, **KAN co-author**. Best internal champion if Soljačić delegates.
- **Dr. Shiekh Z Uddin** (suddin@mit.edu) — Postdoc
- **Dr. Ali Ghorashi** (aligho@mit.edu) — Postdoc
- **Dr. Simo Pajovic** (pajovics@mit.edu) — Postdoc
- **Sahil Pontula** (spontula@mit.edu) — PhD student

### Yichen Shen (2017 paper lead):
- Left MIT, founded **Lightelligence** (yichen@lightelligence.ai)
- Now a competitor — do NOT contact him. He's building commercial photonic AI chips.

### Alternative targets outside MIT:
- **TU Eindhoven:** Kevin Williams (Photonic Integration group, InP-based ICs)
- **UCSB:** John Bowers (III-V/Silicon hybrid pioneer, prolific and well-connected)
- **Jelena Notaros** (MIT EECS) — Newer faculty, integrated photonics, may be more accessible

### What makes these emails different from v1:
1. **4 domains now** (added financial markets) — not just 3
2. **700K+ chess predictions** (was 50K) — 14× more data, accuracy improved to 58.5%
3. **KAN paper as academic anchor** — Soljačić's OWN paper proves edge-learning works. Not just referencing his hardware.
4. **Sachin Vaidya bridge** — KAN co-author AND current group member. Natural internal champion.
5. **Englund's exact quote** as subject line hook — impossible to ignore when it's your own words
6. **"Compile" language** — matches Englund's framing ("compiled onto new architectures")
7. **Specific hardware mapping** — not "we'd like to explore photonics"
8. **Offering to fund** — professors always need this
9. **Live demo verifiable right now** at enpensent.com
