# NSERC Alliance — Application Brief
### En Pensent: University-Industry Partnership for Photonic Cross-Domain Pattern Recognition

**Program:** NSERC Alliance Grants
**Agency:** Natural Sciences and Engineering Research Council of Canada (NSERC)
**URL:** https://www.nserc-crsng.gc.ca/Professors-Professeurs/RPP-PP/Alliance-Alliance_eng.asp
**Funding:** $20,000–$1,000,000+ per year (project dependent)
**Cost Share:** Industry partner contributes cash (minimum 1:1 ratio for Option 1, or in-kind for Option 2)
**Duration:** 1–5 years
**Eligibility:** Canadian university PI + Canadian industry partner
**Timeline:** Rolling applications (Option 2), or specific deadlines (Option 1)

---

## 1. PROGRAM OVERVIEW

NSERC Alliance funds collaborative R&D between Canadian universities and industry partners. The university professor is the Principal Investigator (PI) and holds the grant. En Pensent participates as the **industry partner**, providing:

- Cash and/or in-kind contributions
- Real-world data and domain expertise
- Technology platform for student research
- Commercialization pathway for research results

### Alliance Options

| Option | Cash Requirement | Best For | Amount |
|---|---|---|---|
| **Option 1** | Minimum 1:1 cash match | Large multi-year projects, high TRL | $20K–$1M+/year |
| **Option 2** | In-kind accepted (lower cash) | Early-stage, discovery-oriented | $20K–$250K/year |

**Recommendation: Start with Option 2** — lower cash requirement, accepts in-kind contributions (En Pensent's software platform, data, and mentorship count as in-kind).

## 2. RESEARCH PROGRAM

### Title: "Universal Photonic Pattern Recognition: From Software to Silicon"

### Research Questions

1. **Architecture translation:** How does optical interference in micro-ring resonator arrays replicate the software-validated universal grid portal?
2. **Self-learning in photonics:** Can thermo-optic phase shifter tuning achieve the same self-learning behaviour demonstrated in software?
3. **Cross-domain transfer:** Do photonic hardware implementations preserve the cross-domain generalization proven across chess, battery, and chemical datasets?
4. **Scaling laws:** How does accuracy scale with the number of resonator neurons (12 → 64 → 256) and wavelength channels (27 → 100+)?
5. **Energy efficiency:** What is the measured energy per inference for the photonic implementation vs. electronic baselines?

### Research Themes

#### Theme 1: Photonic Circuit Design & Simulation (Year 1-2)

**Objective:** Design and simulate the complete photonic inference circuit.

**Activities:**
- Map universal grid 8×8 architecture to micro-ring resonator topology
- Design wavelength-division multiplexing (WDM) input stage for 27 channels
- Simulate optical power budget, insertion loss, crosstalk, and thermal sensitivity
- Optimize self-learning via thermo-optic phase shifter control algorithms
- Validate: simulated photonic accuracy matches software baseline on all 3 domains

**Student involvement:** 1 PhD student (photonic circuit design), 1 MSc student (simulation and verification)

**Deliverables:**
- Complete photonic circuit schematic in SOI PDK
- Simulation results across 3 benchmark domains
- Journal paper: circuit design and simulation methodology

#### Theme 2: Fabrication & Characterization (Year 2-3)

**Objective:** Fabricate and test photonic prototype chips.

**Activities:**
- Tape-out prototype via Canadian or allied foundry (CMC Microsystems, AIM Photonics)
- Characterize optical performance: insertion loss, free spectral range, thermo-optic response
- Benchmark inference accuracy on all 3 domains with real data
- Measure power consumption and latency
- Iterate design based on measured results

**Student involvement:** 1 PhD student (fabrication and testing), 1 MSc student (optical characterization)

**Deliverables:**
- Fabricated prototype chips (5-10 dies)
- Characterization report: optical, electrical, thermal
- Accuracy benchmark: photonic vs. software on chess, battery, chemical
- Journal paper: fabrication and experimental results

#### Theme 3: Cross-Domain Scaling & Applications (Year 3-5)

**Objective:** Expand to new domains and demonstrate scalability.

**Activities:**
- Develop 5+ new domain adapters with graduate students across departments
- Benchmark cross-domain transfer on photonic hardware
- Scale architecture: 12 → 64 → 256 resonator neurons
- Demonstrate real-time inference on streaming sensor data
- Explore defence, energy, medical, and industrial applications

**Student involvement:** 2 PhD students (new domains + scaling), 2 MSc students (applications)

**Deliverables:**
- 5+ new domain benchmarks on photonic hardware
- Scaling analysis: accuracy vs. architecture size
- Application demonstrations for defence, energy, medical
- 3+ journal papers

## 3. TARGET CANADIAN UNIVERSITIES & PIs

| University | Department | Potential PI Area | NSERC Track Record |
|---|---|---|---|
| **Université Laval** | COPL | Silicon photonics, integrated optics | Strong — COPL is Canada's premier photonics centre |
| **University of British Columbia** | ECE, Stewart Blusson QMI | Quantum photonics, optical computing | Strong |
| **University of Waterloo** | ECE, IQC | Integrated photonics, quantum | Strong |
| **University of Toronto** | ECE, Photonics Group | Photonic neural networks | Strong |
| **McMaster University** | CEDT | Photonic devices, silicon photonics | Good |
| **University of Ottawa** | CRPuO | Integrated photonics, fibre optics | Good |
| **Polytechnique Montréal** | Engineering Physics | Photonic design, fabrication | Good |

### Ideal PI Profile
- Active NSERC Discovery Grant holder (demonstrates NSERC track record)
- Research in silicon photonics, integrated photonic circuits, or optical computing
- Access to photonic simulation tools (Lumerical, Synopsys Photonic Solutions)
- Connection to CMC Microsystems (Canadian fab access) or AIM Photonics
- Interest in cross-domain applications beyond traditional photonics

## 4. EN PENSENT CONTRIBUTION (INDUSTRY PARTNER)

### Cash Contribution (for Option 1)

| Item | Annual Amount |
|---|---|
| Graduate student stipend supplement | $10,000–$20,000 |
| Travel (students to En Pensent for data/mentorship) | $5,000 |
| Equipment/software licenses | $5,000 |
| **Total cash** | **$20,000–$30,000/year** |

### In-Kind Contribution (for Option 2, or in addition to cash)

| Item | Value | Justification |
|---|---|---|
| Universal grid software platform | $50,000/year | Core research tool, production-validated code |
| 3-domain benchmark datasets (chess, battery, chemical) | $25,000/year | Curated, validated, labeled datasets |
| CEO technical mentorship (10 hrs/month) | $24,000/year | Domain expertise, architecture guidance |
| Domain adapter framework and documentation | $15,000/year | Enables student research on new domains |
| Patent access for academic research | $10,000/year | Synaptic Truth Network architecture |
| Cloud computing credits for benchmarking | $6,000/year | AWS/GCP for large-scale experiments |
| **Total in-kind** | **$130,000/year** | |

### Total Industry Contribution
- **Option 1:** $20K–$30K cash + $130K in-kind = **$150K–$160K/year**
- **Option 2:** $130K in-kind (minimal cash) = **$130K/year**

## 5. BUDGET REQUEST FROM NSERC

| Category | Year 1 | Year 2 | Year 3 | Total |
|---|---|---|---|---|
| PhD stipends (2 students) | $50,000 | $50,000 | $50,000 | $150,000 |
| MSc stipends (2 students) | $30,000 | $30,000 | $30,000 | $90,000 |
| Fabrication (CMC/AIM) | $0 | $40,000 | $30,000 | $70,000 |
| Equipment/characterization | $20,000 | $15,000 | $10,000 | $45,000 |
| Travel/conferences | $10,000 | $10,000 | $10,000 | $30,000 |
| Supplies/consumables | $5,000 | $5,000 | $5,000 | $15,000 |
| **Total NSERC request** | **$115,000** | **$150,000** | **$135,000** | **$400,000** |

*3-year program. Can scale to 5 years ($600K–$800K) with expanded scope.*

## 6. EXPECTED IMPACT

### Academic Impact
- 6+ journal publications (Nature Photonics, Optica, IEEE Photonics, APL Photonics)
- 4+ trained HQP (Highly Qualified Personnel) in photonic AI computing
- New research area: universal photonic cross-domain pattern recognition
- Open-source benchmark suite for photonic pattern recognition

### Industrial Impact
- Fabrication-ready photonic chip design
- Validated cross-domain performance data for commercial applications
- Defence, energy, and medical application demonstrations
- Strengthened Canadian photonic computing ecosystem

### National Impact
- Canadian leadership in photonic AI computing
- Trained workforce for emerging photonic computing industry
- Domestic IP in strategic technology area
- Enhanced Canada-US photonic research collaboration

## 7. HOW TO INITIATE

1. **Identify PI:** Email professors at target universities (see list above) with this brief
2. **Intro meeting:** Present En Pensent technology, discuss mutual research interests
3. **Letter of Intent (LOI):** PI submits LOI to NSERC (Option 2 — rolling, no deadline)
4. **Full application:** PI leads, En Pensent provides industry partner sections
5. **Review:** 4-6 months for Option 1, faster for Option 2
6. **Start:** Upon approval, students begin within one academic term

### Email Template for PI Outreach

Subject: Industry Partnership Opportunity — Photonic Cross-Domain Pattern Recognition

*Dear Professor [Name],*

*I'm the founder of En Pensent, a Canadian company that has developed a universal photonic pattern recognition architecture. We've validated it on 3 domains — chess (59.7%), battery degradation (89% critical detection), and chemical fault detection (F1 93.3%) — using the identical algorithm. The next step is translating this software architecture into a silicon photonic chip.*

*I'm writing to explore an NSERC Alliance partnership. En Pensent would contribute our software platform, benchmark datasets, and domain expertise as the industry partner. We're seeking a PI with expertise in integrated photonics to lead the academic research program.*

*Would you be open to a brief call to discuss?*

*Best regards,*
*Alec Arthur Shelton, CEO, En Pensent*
*a.arthur.shelton@gmail.com | enpensent.com*

## 8. CONTACT

**Alec Arthur Shelton** — Founder & CEO, En Pensent
- Email: a.arthur.shelton@gmail.com
- Website: https://enpensent.com
- Patent: Pending (Synaptic Truth Network)

---
*Prepared for NSERC Alliance Grants Program*
*En Pensent — Canadian University-Industry Photonic Computing Partnership*
