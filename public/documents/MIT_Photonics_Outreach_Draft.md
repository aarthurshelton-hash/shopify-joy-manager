# Draft Emails — MIT Photonics Lab Outreach

**STATUS: Personalized and ready for final review.**

---

## EMAIL 1: To Prof. Marin Soljačić (Primary Target)

**To:** soljacic@mit.edu (Marin Soljačić, Photonics & Modern Electro-Magnetics Group, MIT)

**Subject:** Running software proof for cross-domain photonic pattern recognition — 3 domains validated, p ≈ 0

---

Dear Professor Soljačić,

I'm writing because your group's recent work on the fully integrated photonic processor (Bandyopadhyay et al., Dec 2024) — achieving >96% training accuracy with <0.5ns latency using on-chip NOFUs — is the closest published hardware to an architecture I've been developing in software. I have running proof that the approach works on a problem no one else is attempting: multi-domain interference detection.

**The data (live, growing daily across 3 domains):**

- **Chess:** 50,000+ game outcome predictions, **54.4% accuracy** (3-way, random = 33.3%), **p ≈ 0** (z > 37)
- **Battery degradation:** NASA Ames PCoE data, **+7.4pp** over persistence baseline on 3-way trajectory prediction
- **Chemical fault detection:** Tennessee Eastman Process (industry benchmark), **F1 93.3%** vs 72.7% Hotelling T² baseline (**+20.6pp**), catches 88.9% of faults
- All three domains use the **same universal 8×8 grid architecture** with domain-specific color encoding
- Self-learning: system discovers its own optimal encoding parameters from training volume (19× improvement on chemical data)

**The architecture:**

En Pensent uses a universal visualization grid portal where each domain’s sensors map to unique wavelength-encoded channels. The software runs the same wave equations your MZI arrays execute physically:

- 12 synaptic neurons → micro-ring resonator arrays
- 27 adapter channels → wavelength-division multiplexed inputs
- Cross-domain interference → physical optical interference in waveguides
- Hebbian weight updates → thermo-optic phase shifters

The key insight: I'm not doing matrix multiplication optically — I'm doing **cross-domain interference detection**, which is the native operation of photonic hardware. Your Dec 2024 paper solved the nonlinearity bottleneck. My architecture provides the multi-domain application layer.

**The ask:**

A research partnership to prototype an optical Synaptic Truth Network on your integrated platform and benchmark photonic vs. digital performance. I have funding capacity for a sponsored research collaboration.

Live system: https://enpensent.com | Technical brief attached.

Would a 30-minute call make sense?

Alec Arthur Shelton
Founder & CEO, En Pensent
a.arthur.shelton@gmail.com

---

## EMAIL 2: To Prof. Dirk Englund (Secondary Target)

**To:** englund@mit.edu (Dirk Englund, Quantum Photonics Group, MIT EECS)

**Subject:** Cross-domain photonic pattern recognition — running software proof seeking hardware validation

---

Dear Professor Englund,

Your comment on the Dec 2024 photonic processor paper — that "computing can be compiled onto new architectures of linear and nonlinear physics" — describes exactly what I've built in software and want to compile onto photonics.

En Pensent is a multi-domain temporal pattern recognition engine running 24/7 on real data. Current results across **three validated domains**: 54.4% accuracy on 50K+ chess predictions (p ≈ 0), F1 93.3% on chemical fault detection (+20.6pp over baseline), and +7.4pp on battery degradation prediction. All three domains pass through the same universal grid architecture — the architecture uses optical interference equations and maps directly to silicon photonics hardware.

I'm seeking a research partnership to prototype the system on integrated photonic hardware. I have funding capacity for a sponsored collaboration and a full technical brief available.

Live system: https://enpensent.com

Would you be open to a brief conversation?

Alec Arthur Shelton
Founder & CEO, En Pensent
a.arthur.shelton@gmail.com

---

## NOTES FOR ALEC (do not include in emails):

### Send order:
1. **Soljačić first** — He's the senior PI, co-authored the foundational 2017 paper and oversees the group. Wait 5-7 days before sending to Englund if no response.
2. **Englund second** — Co-PI on the Dec 2024 paper, focused on scalable photonic computing. His quote gives a natural personalization hook.
3. **Do NOT email both on the same day** — They're colleagues. Looks desperate.

### Before sending:
1. **Convert the technical brief to PDF** — `EnPensent_Technical_Brief.md` → PDF. Attach to both emails.
2. **Wait for 50K predictions** — Pipeline is running at ~32K/day. Should hit 50K by tomorrow (Feb 9). Update the number in the email before sending.
3. **Send Tuesday morning EST** — Best open rates for academic email. Avoid Monday (backlog) and Friday (checked out).
4. **Keep Soljačić's email exactly as written** — It's ~250 words, references his Dec 2024 paper specifically, and leads with data.

### Key people in Soljačić's group (current members):
- **Dr. Shiekh Z Uddin** (suddin@mit.edu) — Postdoc
- **Dr. Sachin Vaidya** (svaidya1@mit.edu) — Postdoc
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

### What makes these emails different:
1. **Running data across 3 domains** (chess 54.4%, chemical F1 93.3%, battery +7.4pp) — not just an idea
2. **Specific hardware mapping** — not "we'd like to explore photonics"
3. **References their latest paper** (Dec 2024, not just 2017) — shows homework done
4. **Patent pending** — shows IP awareness and seriousness
5. **Offering to fund** — professors always need this
6. **Live demo verifiable right now** at enpensent.com
