# NSF SBIR Phase I — Photonics (PH) Topic
### En Pensent: Cross-Domain Photonic Pattern Recognition Processor

**Program:** NSF SBIR/STTR Phase I (America's Seed Fund)
**Topic:** PH — Photonics
**Sub-topics:** PH5 (Photonic Devices), PH10 (Silicon Photonics and Photonic Integrated Circuits)
**Award:** $305,000 (Phase I) / $1M (Phase II) / $2M (Fast-Track)
**Status:** Paused (Dec 2025 congressional authorization lapse) — monitor for reopening
**Process:** 3-page Project Pitch → feedback in 3 weeks → full proposal if encouraged

---

## EXECUTIVE SUMMARY

En Pensent has developed a software-proven architecture for a photonic cross-domain pattern recognition processor. The system uses optical interference equations to detect correlations across 27 domain-specific data channels simultaneously. Running 24/7 on real data, it has achieved **54.4% accuracy on 50,000+ chess predictions** (p ≈ 0), **F1 93.3% on chemical fault detection** (+20.6pp over Hotelling T² baseline), and **+7.4pp on battery degradation prediction** — all three domains passing through the same universal 8×8 grid architecture with self-learned encoding parameters.

The proposed Phase I work will design and simulate the photonic integrated circuit (PIC) implementation, mapping the proven software architecture to silicon photonics components (micro-ring resonators, Mach-Zehnder interferometers, wavelength-division multiplexing). Phase II will fabricate and test a prototype chip.

## NSF MERIT REVIEW CRITERIA

### Criterion 1: Intellectual Merit

**What is the problem?**
Current AI systems process data domains independently (separate models for vision, language, finance, etc.). Cross-domain pattern recognition — detecting that a chess strategy correlates with a market pattern correlates with a historical trend — requires either massive compute or fundamentally different architecture.

**What is the innovation?**
A photonic processor where cross-domain correlation is the *native operation*. Light naturally interferes. When signals from different domains are encoded on different wavelengths and combined in a coupler, constructive interference amplifies correlated patterns and destructive interference cancels noise. This is what silicon does poorly and photonics does for free.

**What is the evidence?**
- **3 domains validated** with the same universal architecture (chess, battery, chemical)
- **Chess:** 54.4% accuracy on 50K+ predictions, p ≈ 0 (z > 37)
- **Chemical:** F1 93.3% fault detection on Tennessee Eastman Process (+20.6pp over baseline)
- **Battery:** +7.4pp on NASA degradation prediction (636 cycles, 4 batteries)
- **Self-learning:** system discovers optimal encoding parameters from training volume (19× improvement)
- Architecture maps directly to standard SOI photonic components

**What is the advance over prior art?**
Existing photonic neural networks (Shen et al. 2017, Bandyopadhyay et al. 2024) perform matrix multiplication optically. En Pensent performs *interference-based cross-domain pattern detection* — a fundamentally different and more powerful operation that exploits the native behavior of light.

### Criterion 2: Broader Impacts

**Commercial potential:**
- Financial services: real-time cross-asset correlation detection
- Defense: multi-sensor fusion at light-speed
- Healthcare: multi-modal diagnostic pattern recognition
- Climate: cross-domain environmental signal correlation

**Societal benefit:**
- Energy efficiency: photonic processing at <10mW vs GPU at 300W
- Speed: <1ns latency vs milliseconds for electronic cross-domain correlation
- Accessibility: once fabricated, the chip can be mass-produced via standard CMOS foundry processes

**Workforce development:**
- Partnership with MIT photonics group for graduate student training
- Open-source software framework for photonic algorithm development

### Criterion 3: Commercial Potential

**Market size:** The photonic computing market is projected at $32B by 2030 (MarketsandMarkets).

**Revenue model:**
1. **Hardware licensing** — License the PIC design to foundries
2. **SaaS** — Cloud-accessible cross-domain pattern recognition API
3. **Defense contracts** — Multi-sensor fusion for DoD applications

**Competitive advantage:** Only system with running software proof of cross-domain interference-based pattern recognition across 3 validated domains. 50K+ timestamped predictions + multi-domain benchmark results provide defensible prior art.

## ELIGIBILITY CHECKLIST

| Requirement | Status |
|---|---|
| Small business (<500 employees) | ✅ En Pensent, 1 employee |
| >50% US-owned equity | ✅ 100% US-owned |
| Not majority VC/PE/hedge fund owned | ✅ Founder-owned |
| All work in United States | ✅ Cambridge, MA area |
| PI employed 20+ hrs/week | ✅ Alec Arthur Shelton, full-time |
| PI commits 1 month per 6 months | ✅ Full-time dedication |
| Technological innovation | ✅ Patent pending |
| Broader impacts | ✅ Energy, defense, healthcare applications |
| Commercial potential | ✅ $32B market, running proof |

## 3-PAGE PROJECT PITCH OUTLINE

**Page 1: The Problem & Innovation**
- Cross-domain pattern recognition is compute-prohibitive on digital hardware
- Photonic interference performs this operation natively at light-speed
- En Pensent has software proof across 3 domains: chess 54.4%, chemical F1 93.3%, battery +7.4pp

**Page 2: Technical Approach**
- Phase I: Design & simulate PIC (27-channel WDM, micro-ring neuron array, interference junction)
- Phase II: Fabricate on SOI platform, benchmark vs. software baseline
- Architecture maps to standard foundry processes (GlobalFoundries, TSMC)

**Page 3: Team, Market, Timeline**
- PI: Alec Arthur Shelton (software architecture, patent holder)
- University partner: MIT Photonics (Soljačić group, Dec 2024 integrated photonic processor)
- Market: $32B photonic computing, $15B AI accelerator chip
- Timeline: 12-month Phase I, 24-month Phase II

## CONTACT

**Alec Arthur Shelton** — Founder & CEO, En Pensent
- Email: a.arthur.shelton@gmail.com
- Live system: https://enpensent.com

---
*Prepared for NSF SBIR/STTR Phase I — Photonics (PH) Topic*
*Sub-topics: PH5 (Photonic Devices), PH10 (Silicon Photonics and PICs)*
