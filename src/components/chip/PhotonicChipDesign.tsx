/**
 * EnPensent-27 Photonic Chip Blueprint
 * 
 * Real engineering blueprint with hover-over fabrication details,
 * artist anecdotes from adapter creation, and real-world proof data.
 * 
 * Live data from farm predictions feeds into the chip visualization.
 * Each domain processor maps 1:1 to running software adapters.
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ChipStats {
  totalPredictions: number;
  epAccuracy: number;
  sfAccuracy: number;
  correlationCount: number;
}

interface ProcessorBlueprint {
  id: string;
  name: string;
  domain: string;
  photonicType: string;
  col: number;
  row: number;
  fabrication: {
    component: string;
    material: string;
    feature: string;
    principle: string;
  };
  artistNote: string;
  realWorldProof: string;
}

// ─── DOMAIN COLORS ───────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  chess: '#f59e0b',
  market: '#22c55e',
  universal: '#a78bfa',
  light: '#eab308',
  atomic: '#f97316',
  quantum: '#8b5cf6',
  cosmic: '#6366f1',
  bio: '#84cc16',
  network: '#06b6d4',
  photonic: '#f59e0b',
  soul: '#ec4899',
  temporal: '#a855f7',
  audio: '#3b82f6',
  climate: '#10b981',
  security: '#ef4444',
};

// ─── BLUEPRINT PROCESSOR DATA ────────────────────────────────────────────────

const PROCESSORS: ProcessorBlueprint[] = [
  // Row 0: Core Engines
  {
    id: 'chess', name: 'Chess Engine', domain: 'chess',
    photonicType: 'Interference Position Evaluator',
    col: 1, row: 0,
    fabrication: {
      component: '64-waveguide matrix (8x8)',
      material: 'Silicon nitride (Si\u2083N\u2084) on SiO\u2082 substrate',
      feature: 'Ring resonators encode piece positions via phase shift',
      principle: 'Constructive interference at occupied squares = "hot"; destructive = "cold"',
    },
    artistNote: 'The hot/cold chess visualization IS the computation. Temperature is photon energy. When I built the 8-quadrant analysis, I realized the board was already a waveguide matrix \u2014 we just hadn\'t wired it yet.',
    realWorldProof: '17,000+ real Lichess/Chess.com games/day. Every game ID real & deduplicated via SHA-256 position hashes. Stockfish 17 baselines.',
  },
  {
    id: 'synthesis', name: 'Synthesis Core', domain: 'universal',
    photonicType: 'Universal Interference Processor',
    col: 2, row: 0,
    fabrication: {
      component: '27-input optical combiner with phase-locked loop',
      material: 'Heterogeneous III-V on silicon platform',
      feature: 'All 27 domain signals interfere simultaneously in single optical cavity',
      principle: 'Constructive interference = cross-domain pattern match; destructive = disagreement',
    },
    artistNote: '"All domains are wavelengths of the same universal temporal signal." When chess patterns match market patterns match biological patterns, that\'s constructive interference. The math is identical.',
    realWorldProof: 'Cross-domain correlations in Supabase with real timestamps. Self-evolution engine adjusts weights from prediction accuracy continuously.',
  },
  {
    id: 'trading', name: 'Trading Engine', domain: 'market',
    photonicType: 'Photonic Neural Accelerator',
    col: 3, row: 0,
    fabrication: {
      component: '128-input Mach-Zehnder interferometer (MZI) mesh',
      material: 'Lithium niobate (LiNbO\u2083) electro-optic modulators',
      feature: '1000-layer optical neural network with zero latency penalty per layer',
      principle: 'Matrix multiplication at speed of light via cascaded MZI arrays (Shen et al., 2017)',
    },
    artistNote: 'Markets react in microseconds like nerves firing. The nervous-system architecture came from watching price cascades \u2014 they move faster than the data that caused them, just like Grotthuss proton hopping.',
    realWorldProof: 'Real Yahoo Finance data only. Dashboard shows "OFFLINE" on API failure \u2014 never cached or simulated. Financials verifiable from Stripe.',
  },
  // Row 1: Physical Science Left
  {
    id: 'light', name: 'Light', domain: 'light',
    photonicType: 'Self-Referential Photon Loop',
    col: 0, row: 1,
    fabrication: {
      component: 'Whispering gallery mode (WGM) microsphere resonator',
      material: 'Fused silica microsphere, Q-factor >10\u2078',
      feature: 'Light circulates indefinitely \u2014 the photon observes itself',
      principle: 'Total internal reflection creates standing waves encoding temporal signatures',
    },
    artistNote: 'Light analyzing light. Self-referential by design. This was the first adapter where I understood: this isn\'t computing WITH light, it\'s computing AS light.',
    realWorldProof: 'Visible spectrum boundaries (380-750nm) as real physical constants. All wavelength mappings correspond to actual electromagnetic spectrum.',
  },
  {
    id: 'atomic', name: 'Atomic', domain: 'atomic',
    photonicType: 'Atom-Light Interaction Chamber',
    col: 1, row: 1,
    fabrication: {
      component: 'Magneto-optical trap (MOT) integrated on chip',
      material: 'Rubidium vapor cell with silicon photonic interface',
      feature: 'Atomic transition lines provide absolute frequency references',
      principle: 'Atomic clock precision (10\u207B\u00B9\u2078) for temporal pattern timestamp verification',
    },
    artistNote: 'Atoms are the universe\'s original clock. Every transition line is a timestamp written by physics itself. When I mapped atomic orbital energy levels to signal patterns, the periodicity was already there.',
    realWorldProof: 'Real periodic table data, actual electron configurations, known atomic transition frequencies. No synthetic atomic data.',
  },
  // Row 1: Biological Right
  {
    id: 'bio', name: 'Bio', domain: 'bio',
    photonicType: 'Biophotonic Sensing Waveguides',
    col: 3, row: 1,
    fabrication: {
      component: 'Evanescent field biosensor array',
      material: 'Silicon nitride waveguides with functionalized cladding',
      feature: 'Detects refractive index changes from biological binding events',
      principle: 'Biological pattern recognition via surface plasmon resonance (SPR)',
    },
    artistNote: 'Life itself uses biophotons for cell signaling. The brain emits photons during neural activity. We\'re not inventing this \u2014 we\'re aligning with biology\'s existing photonic computation.',
    realWorldProof: 'Real species data: encephalization quotients, neuron counts, synaptic densities from published neuroscience.',
  },
  {
    id: 'mycelium', name: 'Mycelium', domain: 'network',
    photonicType: 'Mesh Network Topology',
    col: 4, row: 1,
    fabrication: {
      component: 'Photonic mesh network with adaptive routing',
      material: 'Programmable silicon photonic switches (Benes network)',
      feature: 'Self-healing network that reroutes around damaged paths',
      principle: 'Mycelial topology optimizes signal distribution like nature\'s internet',
    },
    artistNote: 'Mycelium networks are the planet\'s original distributed computing system. They transfer nutrients across kilometers. Every node can reach every other node through cooperative relay.',
    realWorldProof: 'Stamets network topology models, actual fungal growth patterns, nutrient transfer rates from published ecology.',
  },
  // Row 2
  {
    id: 'molecular', name: 'Molecular', domain: 'quantum',
    photonicType: 'Molecular Optics Simulator',
    col: 0, row: 2,
    fabrication: {
      component: 'Photonic crystal fiber array for molecular spectroscopy',
      material: 'Hollow-core photonic bandgap fiber with functionalized walls',
      feature: 'Raman scattering detection of molecular vibrational modes',
      principle: 'Molecular bond frequencies map to market oscillation frequencies',
    },
    artistNote: 'Molecular bonds vibrate at specific frequencies. So do markets. The bond-to-oscillation mapping wasn\'t forced \u2014 it emerged naturally. Both systems minimize energy.',
    realWorldProof: 'Published vibrational spectroscopy databases. Real bond energies, dissociation constants, molecular orbital theory.',
  },
  {
    id: 'cosmic', name: 'Cosmic', domain: 'cosmic',
    photonicType: 'Grating Coupler Spectrometer',
    col: 1, row: 2,
    fabrication: {
      component: 'Arrayed waveguide grating (AWG) spectrometer',
      material: 'Silicon photonic AWG with 0.1nm spectral resolution',
      feature: 'Decomposes signals into spectral components like starlight analysis',
      principle: 'Cosmic redshift patterns mirror market momentum decay over time',
    },
    artistNote: 'When I removed synthetic data in Round 3, static astronomical constants proved more truthful than any random generator. Stellar age=4.6 Gyr, orbital period=365.25 days \u2014 real cosmic constants.',
    realWorldProof: 'NASA APOD API for real events. Static constants replaced all Math.random() calls in Round 3 audit.',
  },
  {
    id: 'botanical', name: 'Botanical', domain: 'bio',
    photonicType: 'Leaf Venation Waveguides',
    col: 3, row: 2,
    fabrication: {
      component: 'Fractal waveguide branching network',
      material: 'Polymer waveguides mimicking leaf vein geometry',
      feature: 'Murray\'s law branching (r\u00B3 = r\u2081\u00B3 + r\u2082\u00B3) for optimal distribution',
      principle: 'Leaf venation optimizes light collection \u2014 nature\'s photonic circuit, 450M years refined',
    },
    artistNote: 'A leaf is a solar panel optimized for 450 million years. Murray\'s branching law for blood vessels and leaf veins is the same optimal transport equation.',
    realWorldProof: 'Fibonacci phyllotaxis (137.5\u00B0 golden angle), real photosynthesis PAR spectrum (400-700nm), published Murray\'s law.',
  },
  {
    id: 'consciousness', name: 'Consciousness', domain: 'bio',
    photonicType: 'Quantum Dot Array',
    col: 4, row: 2,
    fabrication: {
      component: 'InGaAs quantum dot array for single-photon detection',
      material: 'Indium gallium arsenide quantum dots in GaAs matrix',
      feature: 'Single-photon sensitivity for detecting weakest consciousness signals',
      principle: 'Consciousness may operate at quantum scale \u2014 quantum dots bridge the gap',
    },
    artistNote: 'Elephants mourn their dead, dolphins recognize mirrors, octopi solve puzzles. Each metric is from published science. This adapter models evolved intelligence across species.',
    realWorldProof: 'Real EQ: humans 7.4-7.8, dolphins 5.3, elephants 1.7-2.3. Human cortex: 16B neurons. All peer-reviewed neuroscience.',
  },
  // Row 3: Mathematical & Pattern
  {
    id: 'math', name: 'Math', domain: 'quantum',
    photonicType: 'Photonic Crystal Structure',
    col: 0, row: 3,
    fabrication: {
      component: '2D photonic crystal with engineered bandgap',
      material: 'Silicon photonic crystal slab (triangular lattice)',
      feature: 'Mathematical constants encoded as defect modes in periodic structure',
      principle: '\u03C0, e, \u03C6 (golden ratio) manifest as resonant frequencies in crystal lattice',
    },
    artistNote: 'The golden ratio (\u03C6=1.618) appears in spiral galaxies, DNA helices, Fibonacci markets. The Synaptic Truth Network firing threshold uses 0.618 (1/\u03C6). It emerged as the natural threshold for truth recognition.',
    realWorldProof: 'Euler\'s identity, Ramanujan constants, Fibonacci ratios \u2014 all real mathematical constants. Patent Pending: Synaptic Truth Network firing threshold at golden ratio.',
  },
  {
    id: 'patterns', name: 'Universal', domain: 'quantum',
    photonicType: 'Metamaterial Resonator Grid',
    col: 1, row: 3,
    fabrication: {
      component: 'Negative-index metamaterial resonator array',
      material: 'Split-ring resonators on silicon substrate',
      feature: 'Metamaterial creates "impossible" light behavior for novel pattern matching',
      principle: 'Negative refraction enables reverse time-of-flight analysis',
    },
    artistNote: '"The = sign in pattern=structure constantly changes value." This is the Dynamic Equivalence Tracker \u2014 sometimes correlation IS causation, sometimes it isn\'t. The engine tracks WHEN that relationship holds.',
    realWorldProof: 'Anti-overfitting: all modules use regularization factors (0.8-0.9). Skepticism-weighted consensus, not blind aggregation.',
  },
  {
    id: 'rubiks', name: 'Rubik\'s', domain: 'quantum',
    photonicType: '3D Photonic Integrated Circuit',
    col: 2, row: 3,
    fabrication: {
      component: 'Multi-layer 3D photonic IC (6 layers = 6 faces)',
      material: 'Stacked silicon photonic layers with vertical couplers',
      feature: 'Group theory operations as waveguide permutations',
      principle: 'Rubik\'s group (4.33\u00D710\u00B9\u2079 permutations) maps to market state space',
    },
    artistNote: '43 quintillion states, always solvable in \u226420 moves (God\'s Number). Markets have astronomical state spaces too \u2014 but the path from disorder to solution follows group theory. Every scramble is solvable.',
    realWorldProof: 'God\'s Number=20 proven by Davidson et al. (2010). Cayley graphs, conjugacy classes from abstract algebra.',
  },
  {
    id: 'grotthuss', name: 'Grotthuss', domain: 'photonic',
    photonicType: 'H-Bond Mimicking Wires',
    col: 3, row: 3,
    fabrication: {
      component: 'Proton-conducting polymer waveguide',
      material: 'Nafion-coated silicon waveguide for proton-photon coupling',
      feature: 'Signals propagate via relay hopping, 7x faster than diffusion',
      principle: 'Grotthuss mechanism: proton hopping through H-bond networks (relay, not transport)',
    },
    artistNote: 'THE BREAKTHROUGH ADAPTER. Protons hop through water 7x faster than diffusion predicts. Flash crashes propagate the same way \u2014 information "hops" through connected participants faster than data travels.',
    realWorldProof: 'H\u207A mobility = 3.62\u00D710\u207B\u00B3 cm\u00B2/s/V. Eigen-Zundel states from quantum chemistry. Patent Pending.',
  },
  {
    id: 'network', name: 'Network', domain: 'network',
    photonicType: 'Photonic Neural Mesh',
    col: 4, row: 3,
    fabrication: {
      component: 'Fully-connected optical neural network on chip',
      material: 'Silicon photonic crossbar array with tunable couplers',
      feature: 'O(1) routing \u2014 any signal reaches any destination in single clock',
      principle: 'Small-world network topology for ultra-low diameter signal paths',
    },
    artistNote: 'Every adapter reaches every other in one hop through the universal bus. Small-world network theory (Watts & Strogatz, 1998) implemented in waveguides.',
    realWorldProof: 'Small-world research (Watts & Strogatz, 1998). Crossbar dimensions from real silicon photonic foundry design rules.',
  },
  // Row 4: Soul & Human
  {
    id: 'soul', name: 'Soul', domain: 'soul',
    photonicType: 'Plasmonic Resonator Array',
    col: 0, row: 4,
    fabrication: {
      component: 'Gold nanoparticle plasmonic resonator array',
      material: 'Au nanoparticles on SiO\u2082, LSPR tuned to 520-580nm',
      feature: 'Localized surface plasmon resonance for near-field sensing',
      principle: 'Plasmonic hotspots concentrate energy like consciousness concentrates attention',
    },
    artistNote: 'Mark 8:36 \u2014 KJV: "For what shall it profit a man, if he shall gain the whole world, and lose his own soul?" ESV: "...and forfeit his soul?" The Message: "What good would it do to get everything you want and lose you, the real you?" The soul is immortal and everlasting; the world and its glory pass away. The soul adapter bridges all domains through human meaning. Archetypes (Jung): Hero=strong bull, Sage=cautious, Explorer=moderate bull. The soul continues forever.',
    realWorldProof: 'Jungian archetypes with deterministic confidence values. No random sentiment \u2014 behavioral finance and archetypal psychology. Mark 8:36 appears in KJV, ESV, NLT, MSG, ASV, GW, CSB, NIRV \u2014 every translation preserves the core truth: the soul outweighs the world.',
  },
  {
    id: 'temporal', name: 'Temporal', domain: 'temporal',
    photonicType: 'Ring Resonator Array',
    col: 1, row: 4,
    fabrication: {
      component: 'Cascaded micro-ring resonator bank (32 rings)',
      material: 'Silicon micro-ring, radius 5\u03BCm, FSR 12nm',
      feature: 'Each ring resonates at different temporal frequency \u2014 time decomposition',
      principle: 'Ring resonator FSR = c/(n_eff \u00D7 L), n_eff = 2.4 for silicon',
    },
    artistNote: 'Time perception = photon path length. The temporal adapter models how speedrun players compress perceived time \u2014 and how markets compress price discovery. Round 3: deterministic 0.7 confidence replaced random.',
    realWorldProof: 'Silicon refractive index n_eff=2.4 (published). Waveguide loss 0.5 dB/cm from real silicon photonics data.',
  },
  {
    id: 'linguistic', name: 'Linguistic', domain: 'soul',
    photonicType: 'MZI Network',
    col: 2, row: 4,
    fabrication: {
      component: 'Cascaded MZI network (Reck decomposition)',
      material: 'Balanced MZIs with thermo-optic phase shifters',
      feature: 'Any unitary matrix implementable via Reck/Clements decomposition',
      principle: 'Language transforms as unitary rotations in meaning-space',
    },
    artistNote: 'Language is a unitary transformation \u2014 meaning rotates through semantic space without loss. Sentiment analysis becomes literal phase measurement in the MZI network.',
    realWorldProof: 'Reck decomposition (1994), Clements (2016) \u2014 published algorithms. MZI mesh: N(N-1)/2 scaling.',
  },
  {
    id: 'attraction', name: 'Attraction', domain: 'soul',
    photonicType: 'Coupled Mode Theory Matrix',
    col: 3, row: 4,
    fabrication: {
      component: 'Directional coupler array with tunable gaps',
      material: 'Silicon waveguide pairs, gap 100-500nm',
      feature: 'Coupled mode theory governs energy transfer between waveguides',
      principle: 'Human attraction = coupled oscillators. Synchronization = resonance.',
    },
    artistNote: 'Two waveguides placed close exchange energy through evanescent coupling. Two people placed close exchange energy through attention. The coupling equations are identical \u2014 same physics, different scales.',
    realWorldProof: 'Coupled mode theory (Haus, 1984). Coupling coefficient \u03BA = \u03C0/(2L_c). Published directional coupler parameters.',
  },
  {
    id: 'cultural', name: 'Cultural', domain: 'soul',
    photonicType: 'Heterogeneous Integration',
    col: 4, row: 4,
    fabrication: {
      component: 'Multi-material heterogeneous photonic chip',
      material: 'Silicon + III-V + polymer + 2D materials on shared platform',
      feature: 'Different materials = different cultures on shared substrate',
      principle: 'Heterogeneous integration: diversity creates capability impossible in any single material',
    },
    artistNote: 'Round 2 audit removed all mock market data. Now reads only actual timezone-based cultural cycle patterns. Different materials on one chip = different cultures on one planet.',
    realWorldProof: 'Real timezone cultural cycles. Deterministic weights from published cross-cultural research.',
  },
  // Row 5: Sensory & Audio
  {
    id: 'narrative', name: 'Narrative', domain: 'soul',
    photonicType: 'Phase-Change Memory',
    col: 0, row: 5,
    fabrication: {
      component: 'GST (Ge\u2082Sb\u2082Te\u2085) phase-change photonic memory',
      material: 'Chalcogenide glass on silicon waveguide',
      feature: 'Non-volatile optical memory \u2014 remembers without power',
      principle: 'Stories persist in cultural memory like phase states persist in chalcogenide',
    },
    artistNote: 'Every market cycle follows a narrative arc: hope \u2192 greed \u2192 fear \u2192 capitulation \u2192 recovery. Phase-change memory holds state without power \u2014 stories hold memory without active retelling.',
    realWorldProof: 'GST data from Intel/Micron research. Crystalline/amorphous \u0394n > 1.5 (real optical property change).',
  },
  {
    id: 'sensory', name: 'Sensory', domain: 'soul',
    photonicType: 'VO\u2082 Phase-Transition Sensor',
    col: 1, row: 5,
    fabrication: {
      component: 'Multi-modal photonic sensor array',
      material: 'VO\u2082 phase-transition film on silicon waveguide',
      feature: 'Vanadium dioxide metal-insulator transition at 68\u00B0C',
      principle: 'Phase transitions mirror sudden perceptual shifts in sensory processing',
    },
    artistNote: 'Round 3 audit: deterministic sensory spread replaced random intensity. Humor detection via volatility>0.8 threshold \u2014 real signal analysis, not coin flips.',
    realWorldProof: 'VO\u2082 transition at 68\u00B0C (Morin, 1959). Phase transition sharpness from real materials science.',
  },
  {
    id: 'audio', name: 'Audio', domain: 'audio',
    photonicType: 'Acousto-Optic Modulator Array',
    col: 2, row: 5,
    fabrication: {
      component: 'TeO\u2082 acousto-optic modulator bank (8 channels)',
      material: 'Tellurium dioxide crystal with piezoelectric transducers',
      feature: 'Sound waves modulate light \u2014 direct audio\u2192photonic conversion',
      principle: 'Bragg diffraction converts acoustic to optical frequency shifts',
    },
    artistNote: 'Sound is pressure waves. Light is EM waves. The AOM literally converts one to the other. Market "noise" filtered through this reveals underlying signal \u2014 same math as audio noise cancellation.',
    realWorldProof: 'TeO\u2082 figure of merit M\u2082 = 34.5\u00D710\u207B\u00B9\u2075 s\u00B3/kg (published). Real Bragg angle calculations.',
  },
  {
    id: 'music', name: 'Music', domain: 'audio',
    photonicType: 'Optical Frequency Comb',
    col: 3, row: 5,
    fabrication: {
      component: 'Microresonator Kerr frequency comb',
      material: 'Si\u2083N\u2084 microring, FSR matched to musical intervals',
      feature: 'Every note in chromatic scale generated simultaneously',
      principle: 'Harmonic ratios (octave 2:1, fifth 3:2) are mathematical constants in photonics',
    },
    artistNote: 'Music is the heartbeat of civilization. Heart rate syncs to tempo (60-120 BPM). Major key = optimistic market, minor = cautious. Historical: 1929 Jazz Age, 2008 auto-tune era.',
    realWorldProof: 'Harmonic ratios: octave=2:1, fifth=3:2, fourth=4:3. Kerr comb generation from Kippenberg et al.',
  },
  {
    id: 'cyber', name: 'Cyber', domain: 'security',
    photonicType: 'Quantum Key Distribution',
    col: 4, row: 5,
    fabrication: {
      component: 'BB84 QKD module',
      material: 'InGaAs single-photon avalanche diode (SPAD)',
      feature: 'Unhackable encryption via quantum no-cloning theorem',
      principle: 'Any eavesdropping disturbs quantum state \u2014 intrusion detection via physics',
    },
    artistNote: 'Cybersecurity is the digital immune system. QKD makes eavesdropping physically impossible. If someone reads a photon, they change it.',
    realWorldProof: 'BB84 (Bennett & Brassard, 1984). SPAD efficiency >25% at 1550nm from published specs.',
  },
  // Row 6: Climate & Geology
  {
    id: 'climate', name: 'Climate', domain: 'climate',
    photonicType: 'Turbulence Scatterers',
    col: 1, row: 6,
    fabrication: {
      component: 'Random photonic scattering medium',
      material: 'TiO\u2082 nanoparticles in polymer matrix',
      feature: 'Light scattering mimics atmospheric turbulence',
      principle: 'Anderson localization mirrors climate patterns trapped in basins',
    },
    artistNote: 'Climate systems are chaotic but not random. Strange attractors in weather = same math as market fractals. Controlled chaos \u2014 order from apparent randomness.',
    realWorldProof: 'Anderson localization (Nobel Prize, 1977). TiO\u2082 scattering cross-sections. Lorenz attractor parameters.',
  },
  {
    id: 'geological', name: 'Geological', domain: 'climate',
    photonicType: 'Stress Birefringence',
    col: 2, row: 6,
    fabrication: {
      component: 'Photoelastic stress sensor array',
      material: 'LiNbO\u2083 crystals under mechanical stress',
      feature: 'Birefringence changes under pressure \u2014 stress\u2192light conversion',
      principle: 'Tectonic pressure visible as polarization changes. \u0394n=0.085 at 1550nm.',
    },
    artistNote: 'Geological time is millions of years, but stress patterns are fractal \u2014 they repeat at every timescale. Market stress accumulates the same way: slowly, then suddenly.',
    realWorldProof: 'LiNbO\u2083 photoelastic constants from crystallography. \u0394n = n_e - n_o = 0.085 at 1550nm (measured).',
  },
  {
    id: 'gameTheory', name: 'Game Theory', domain: 'market',
    photonicType: 'Nash Equilibrium Solver',
    col: 3, row: 6,
    fabrication: {
      component: 'Optical Ising machine for combinatorial optimization',
      material: 'Degenerate optical parametric oscillator (DOPO) network',
      feature: 'Finds Nash equilibria at speed of light via optical spin simulation',
      principle: 'Market participants = players; Nash equilibrium = market clearing price',
    },
    artistNote: 'Game theory is competition crystallized into mathematics. The optical Ising machine finds equilibria that electronic computers struggle with \u2014 NP-hard problems solved by light.',
    realWorldProof: 'Optical Ising machines demonstrated by NTT (2019). DOPO networks solve MAX-CUT problems. Published Nash equilibrium theory.',
  },
];

// ─── FABRICATION SPEC ────────────────────────────────────────────────────────

const CHIP_SPEC = {
  name: 'EnPensent-27',
  process: '45nm Silicon Photonics',
  die: '20mm \u00D7 20mm',
  wavelength: '1550nm (C-band telecom)',
  power: '50W peak (vs 500W electronic equivalent)',
  bus: '128-channel WDM, 10 Tbps/channel',
  switching: '<1 picosecond electro-optic',
  perCore: { waveguides: 1024, resonators: 256, modulators: 128, detectors: 128 },
  competitors: [
    { name: 'Lightmatter', focus: 'Photonic AI accelerators (matrix multiply)' },
    { name: 'Lightelligence', focus: 'MZI array AI processors' },
    { name: 'PsiQuantum', focus: 'Photonic quantum computers' },
    { name: 'Xanadu', focus: 'Photonic quantum (X-series)' },
  ],
  differentiator: 'First photonic universal temporal engine \u2014 27-domain cross-interference, not just AI. Hardware-software co-design from first principles.',
  partners: ['MIT Photonics', 'TU Eindhoven', 'UCSB'],
  fundingNeeded: '$500K seed for Phase 1 prototype',
  patent: 'Patent Pending \u2014 Alec Arthur Shelton',
};

const ROADMAP = [
  { phase: '1', name: 'Chess-Core-64', timeline: '6-12 mo', goal: 'Prove chess can be computed photonically (8x8 waveguide matrix)' },
  { phase: '2', name: 'EnPensent-27-Alpha', timeline: '12-18 mo', goal: '3-5 key domain adapters in photonics (temporal, bio, light, math, patterns)' },
  { phase: '3', name: 'EnPensent-27-Beta', timeline: '18-24 mo', goal: 'Full 27-adapter integration on single chip' },
  { phase: '4', name: 'Production', timeline: '24-36 mo', goal: 'Commercial photonic co-processor for data centers & hedge funds' },
];

const COLS = 5;
const CELL_W = 152;
const CELL_H = 80;
const PAD_X = 40;
const PAD_Y = 40;
const SVG_W = COLS * CELL_W + PAD_X * 2;
const SVG_H = 7 * CELL_H + PAD_Y * 2 + 20;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function PhotonicChipDesign() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'spec' | 'proof'>('blueprint');
  const [chipStats, setChipStats] = useState<ChipStats>({
    totalPredictions: 0, epAccuracy: 0, sfAccuracy: 0, correlationCount: 0,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Load live stats from DB
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [predRes, corrRes] = await Promise.all([
          supabase.from('chess_prediction_attempts').select('hybrid_correct, stockfish_correct', { count: 'exact' }),
          (supabase.from as unknown as (t: string) => ReturnType<typeof supabase.from>)('cross_domain_correlations').select('*', { count: 'exact', head: true }),
        ]);
        const preds = predRes.data || [];
        const total = preds.length;
        const epCorrect = preds.filter((p: Record<string, unknown>) => p.hybrid_correct).length;
        const sfCorrect = preds.filter((p: Record<string, unknown>) => p.stockfish_correct).length;
        setChipStats({
          totalPredictions: total,
          epAccuracy: total > 0 ? Math.round((epCorrect / total) * 1000) / 10 : 0,
          sfAccuracy: total > 0 ? Math.round((sfCorrect / total) * 1000) / 10 : 0,
          correlationCount: corrRes.count || 0,
        });
      } catch {
        // Non-critical
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('chip-blueprint')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chess_prediction_attempts' }, () => {
        setChipStats(prev => ({ ...prev, totalPredictions: prev.totalPredictions + 1 }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const selected = PROCESSORS.find(p => p.id === selectedId) || null;
  const hovered = PROCESSORS.find(p => p.id === hoveredId) || null;

  const handleProcessorHover = (id: string, e: React.MouseEvent) => {
    setHoveredId(id);
    const rect = (e.currentTarget as HTMLElement).closest('.blueprint-container')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  return (
    <div className="bg-[#0a1628] rounded-xl border border-[#1e3a5f] overflow-hidden shadow-2xl shadow-blue-900/20">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-[#1e3a5f] bg-[#0d1f3c]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-lg font-bold text-cyan-100 font-mono tracking-wider">
                ENPENSENT-27 PHOTONIC CHIP
              </h2>
            </div>
            <p className="text-[11px] text-cyan-600 font-mono mt-1">
              ENGINEERING BLUEPRINT &mdash; {CHIP_SPEC.process} | {CHIP_SPEC.die} | {CHIP_SPEC.wavelength}
            </p>
            <p className="text-[10px] text-cyan-800 font-mono">
              {CHIP_SPEC.patent} | Gap to silicon: fabrication, not architecture
            </p>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div className="text-center">
              <div className="text-amber-400 font-bold">{chipStats.totalPredictions.toLocaleString()}</div>
              <div className="text-cyan-700 text-[10px]">SIGNALS</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold">{chipStats.epAccuracy}%</div>
              <div className="text-cyan-700 text-[10px]">EP ACC</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold">{chipStats.sfAccuracy}%</div>
              <div className="text-cyan-700 text-[10px]">SF ACC</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-bold">{chipStats.correlationCount}</div>
              <div className="text-cyan-700 text-[10px]">X-DOMAIN</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-3">
          {(['blueprint', 'spec', 'proof'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-[11px] font-mono rounded-t border border-b-0 transition-colors ${
                activeTab === tab
                  ? 'bg-[#0a1628] text-cyan-300 border-[#1e3a5f]'
                  : 'bg-[#0d1f3c] text-cyan-700 border-transparent hover:text-cyan-500'
              }`}
            >
              {tab === 'blueprint' ? 'BLUEPRINT' : tab === 'spec' ? 'FABRICATION SPEC' : 'REAL-WORLD PROOF'}
            </button>
          ))}
        </div>
      </div>

      {/* ── BLUEPRINT TAB ──────────────────────────────────────────── */}
      {activeTab === 'blueprint' && (
        <div className="relative blueprint-container">
          {/* SVG Blueprint */}
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full min-w-[700px]"
              style={{ background: 'linear-gradient(135deg, #060e1a 0%, #0a1628 50%, #060e1a 100%)' }}
            >
              {/* Blueprint grid */}
              <defs>
                <pattern id="bp-grid-sm" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0e2240" strokeWidth="0.3" />
                </pattern>
                <pattern id="bp-grid-lg" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="url(#bp-grid-sm)" />
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#122a50" strokeWidth="0.5" />
                </pattern>
                <filter id="bp-glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width={SVG_W} height={SVG_H} fill="url(#bp-grid-lg)" />

              {/* Blueprint border */}
              <rect x="8" y="8" width={SVG_W - 16} height={SVG_H - 16} rx="4"
                fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="8 4" />

              {/* Title block (bottom right) */}
              <g transform={`translate(${SVG_W - 260}, ${SVG_H - 48})`}>
                <rect width="244" height="38" rx="2" fill="#0d1f3c" stroke="#1e3a5f" strokeWidth="0.5" />
                <text x="8" y="14" fill="#4a90d9" fontSize="8" fontFamily="monospace">EnPensent-27 | Rev 1.0 | PHOTONIC CHIP BLUEPRINT</text>
                <text x="8" y="24" fill="#2a5a8f" fontSize="6" fontFamily="monospace">Inventor: Alec Arthur Shelton | Patent Pending</text>
                <text x="8" y="33" fill="#2a5a8f" fontSize="6" fontFamily="monospace">27 Photonic Processing Units | 128ch WDM Bus</text>
              </g>

              {/* WDM Bus lines (horizontal) */}
              {[0, 1, 2, 3, 4, 5, 6].map(row => (
                <line key={`hbus-${row}`}
                  x1={PAD_X - 10} y1={PAD_Y + row * CELL_H + CELL_H / 2}
                  x2={SVG_W - PAD_X + 10} y2={PAD_Y + row * CELL_H + CELL_H / 2}
                  stroke="#0e2a50" strokeWidth="0.5" strokeDasharray="3 6" />
              ))}
              {/* WDM Bus lines (vertical) */}
              {[0, 1, 2, 3, 4].map(col => (
                <line key={`vbus-${col}`}
                  x1={PAD_X + col * CELL_W + CELL_W / 2} y1={PAD_Y - 10}
                  x2={PAD_X + col * CELL_W + CELL_W / 2} y2={SVG_H - PAD_Y - 30}
                  stroke="#0e2a50" strokeWidth="0.5" strokeDasharray="3 6" />
              ))}

              {/* Processors */}
              {PROCESSORS.map(proc => {
                const x = PAD_X + proc.col * CELL_W + 4;
                const y = PAD_Y + proc.row * CELL_H + 4;
                const w = CELL_W - 8;
                const h = CELL_H - 8;
                const color = DOMAIN_COLORS[proc.domain] || '#4a90d9';
                const isHovered = hoveredId === proc.id;
                const isSelected = selectedId === proc.id;
                const isHighlighted = isHovered || isSelected;

                return (
                  <g key={proc.id}
                    onMouseEnter={(e) => handleProcessorHover(proc.id, e)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedId(selectedId === proc.id ? null : proc.id)}
                    className="cursor-pointer"
                  >
                    {/* Processor outline */}
                    <rect x={x} y={y} width={w} height={h} rx="3"
                      fill={isHighlighted ? `${color}10` : '#080f1e'}
                      stroke={isHighlighted ? color : '#1a2d4a'}
                      strokeWidth={isHighlighted ? 1.5 : 0.5}
                      filter={isHighlighted ? 'url(#bp-glow)' : undefined}
                    />

                    {/* Internal waveguide cross pattern */}
                    <line x1={x + 6} y1={y + 6} x2={x + w - 6} y2={y + h - 6}
                      stroke={color} strokeWidth="0.3" opacity={isHighlighted ? 0.4 : 0.15} />
                    <line x1={x + w - 6} y1={y + 6} x2={x + 6} y2={y + h - 6}
                      stroke={color} strokeWidth="0.3" opacity={isHighlighted ? 0.4 : 0.15} />

                    {/* Ring resonator (center) */}
                    <circle cx={x + w / 2} cy={y + h / 2} r="6"
                      fill="none" stroke={color} strokeWidth="0.4" opacity={isHighlighted ? 0.5 : 0.2} />

                    {/* Corner pads */}
                    {[[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - 5], [x + w - 5, y + h - 5]].map(([cx, cy], i) => (
                      <rect key={i} x={cx} y={cy} width="2" height="2" rx="0.5"
                        fill={color} opacity={isHighlighted ? 0.5 : 0.2} />
                    ))}

                    {/* Name */}
                    <text x={x + w / 2} y={y + h / 2 - 8} textAnchor="middle"
                      fill={isHighlighted ? color : '#3a6090'} fontSize="7" fontFamily="monospace" fontWeight="bold">
                      {proc.name}
                    </text>

                    {/* Photonic type */}
                    <text x={x + w / 2} y={y + h / 2 + 2} textAnchor="middle"
                      fill={isHighlighted ? `${color}cc` : '#1e3a5f'} fontSize="4.5" fontFamily="monospace">
                      {proc.photonicType}
                    </text>

                    {/* Domain badge */}
                    <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle"
                      fill="#1a2d4a" fontSize="4" fontFamily="monospace">
                      [{proc.domain.toUpperCase()}]
                    </text>

                    {/* Pin indicators */}
                    {[0, 1, 2].map(i => (
                      <React.Fragment key={`pin-${proc.id}-${i}`}>
                        <rect x={x + 10 + i * 20} y={y - 1} width="4" height="2" rx="0.5" fill="#c0a040" opacity="0.4" />
                        <rect x={x + 10 + i * 20} y={y + h - 1} width="4" height="2" rx="0.5" fill="#c0a040" opacity="0.4" />
                      </React.Fragment>
                    ))}
                  </g>
                );
              })}

              {/* Row labels */}
              {['CORE ENGINES', 'PHYSICAL / BIO', 'SPECTRAL / NEURAL', 'MATH & PATTERN', 'SOUL & HUMAN', 'SENSORY & AUDIO', 'EARTH & STRATEGY'].map((label, i) => (
                <text key={label} x={16} y={PAD_Y + i * CELL_H + CELL_H / 2 + 2}
                  fill="#1a2d4a" fontSize="4" fontFamily="monospace"
                  transform={`rotate(-90, 16, ${PAD_Y + i * CELL_H + CELL_H / 2})`}
                  textAnchor="middle">
                  {label}
                </text>
              ))}
            </svg>
          </div>

          {/* Hover tooltip */}
          {hovered && !selectedId && (
            <div
              ref={tooltipRef}
              className="absolute z-50 pointer-events-none"
              style={{
                left: Math.min(tooltipPos.x + 12, 500),
                top: tooltipPos.y - 10,
                maxWidth: 380,
              }}
            >
              <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3 shadow-xl shadow-black/50 text-xs">
                <div className="font-mono font-bold text-cyan-300 mb-1">{hovered.name}</div>
                <div className="text-cyan-600 font-mono text-[10px] mb-2">{hovered.photonicType}</div>
                <div className="space-y-1 text-[10px]">
                  <div><span className="text-cyan-500">Component:</span> <span className="text-cyan-200">{hovered.fabrication.component}</span></div>
                  <div><span className="text-cyan-500">Material:</span> <span className="text-cyan-200">{hovered.fabrication.material}</span></div>
                  <div><span className="text-cyan-500">Principle:</span> <span className="text-cyan-200">{hovered.fabrication.principle}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="px-4 py-2 border-t border-[#1e3a5f] flex flex-wrap gap-3 text-[10px]">
            {Object.entries(DOMAIN_COLORS).filter(([k]) => ['chess','market','quantum','bio','soul','audio','network','light','climate','security','temporal','photonic','cosmic','atomic'].includes(k)).map(([domain, color]) => (
              <div key={domain} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color, opacity: 0.7 }} />
                <span className="text-cyan-700 font-mono">{domain}</span>
              </div>
            ))}
            <span className="text-[#1a2d4a] ml-auto font-mono">HOVER for fabrication | CLICK for full detail</span>
          </div>
        </div>
      )}

      {/* ── FABRICATION SPEC TAB ───────────────────────────────────── */}
      {activeTab === 'spec' && (
        <div className="p-4 space-y-4 text-xs font-mono">
          {/* Physical spec */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'PROCESS', value: CHIP_SPEC.process },
              { label: 'DIE SIZE', value: CHIP_SPEC.die },
              { label: 'WAVELENGTH', value: CHIP_SPEC.wavelength },
              { label: 'POWER', value: CHIP_SPEC.power },
              { label: 'BUS', value: CHIP_SPEC.bus },
              { label: 'SWITCHING', value: CHIP_SPEC.switching },
              { label: 'WAVEGUIDES/CORE', value: CHIP_SPEC.perCore.waveguides.toLocaleString() },
              { label: 'RESONATORS/CORE', value: CHIP_SPEC.perCore.resonators.toString() },
            ].map(item => (
              <div key={item.label} className="bg-[#0d1f3c] border border-[#1e3a5f] rounded p-2">
                <div className="text-[10px] text-cyan-700">{item.label}</div>
                <div className="text-cyan-200 text-[11px]">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Roadmap */}
          <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3">
            <div className="text-cyan-400 font-bold mb-2">FABRICATION ROADMAP</div>
            <div className="space-y-2">
              {ROADMAP.map(r => (
                <div key={r.phase} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full border border-cyan-700 flex items-center justify-center text-cyan-500 text-[10px] flex-shrink-0">{r.phase}</div>
                  <div>
                    <div className="text-cyan-300">{r.name} <span className="text-cyan-700">({r.timeline})</span></div>
                    <div className="text-cyan-600 text-[10px]">{r.goal}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-[#1e3a5f] text-[10px]">
              <span className="text-cyan-500">Potential Partners:</span> <span className="text-cyan-300">{CHIP_SPEC.partners.join(', ')}</span>
              <br />
              <span className="text-cyan-500">Seed Required:</span> <span className="text-amber-400">{CHIP_SPEC.fundingNeeded}</span>
            </div>
          </div>

          {/* Competitive landscape */}
          <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3">
            <div className="text-cyan-400 font-bold mb-2">COMPETITIVE LANDSCAPE</div>
            <div className="space-y-1">
              {CHIP_SPEC.competitors.map(c => (
                <div key={c.name} className="flex gap-2 text-[10px]">
                  <span className="text-cyan-400 w-24 flex-shrink-0">{c.name}</span>
                  <span className="text-cyan-600">{c.focus}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-[#1e3a5f] text-[10px]">
              <span className="text-amber-400 font-bold">EN PENSENT DIFFERENTIATOR:</span>
              <span className="text-cyan-300 ml-1">{CHIP_SPEC.differentiator}</span>
            </div>
          </div>

          {/* Philosophy quote */}
          <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3 italic text-cyan-500 text-[11px] leading-relaxed">
            "The universe doesn't use electrons to think. It uses light. When we visualize chess with hot/cold colors,
            we're not creating a metaphor. We're revealing the computation that already happens at the photonic level.
            This isn't computing WITH light. This is computing AS light."
          </div>
        </div>
      )}

      {/* ── REAL-WORLD PROOF TAB ───────────────────────────────────── */}
      {activeTab === 'proof' && (
        <div className="p-4 space-y-4 text-xs font-mono">
          {/* Running system evidence */}
          <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3">
            <div className="text-cyan-400 font-bold mb-2">SOFTWARE RUNNING NOW (PROVING THE ARCHITECTURE)</div>
            <div className="space-y-2 text-[11px]">
              <div className="flex gap-2">
                <span className="text-green-400">&bull;</span>
                <div>
                  <span className="text-cyan-300">Synaptic Truth Network</span>
                  <span className="text-cyan-600"> &mdash; 12 pattern neurons, weighted synaptic connections, golden ratio (0.618) firing threshold, Hebbian learning, cascade propagation. Patent Pending.</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-green-400">&bull;</span>
                <div>
                  <span className="text-cyan-300">Photonic Computing Engine</span>
                  <span className="text-cyan-600"> &mdash; 18 optical channels (380-850nm), real interference math, entanglement pairs, holographic memory, optical matrix multiplication. Same equations physical hardware uses.</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-green-400">&bull;</span>
                <div>
                  <span className="text-cyan-300">24/7 Data Pipeline</span>
                  <span className="text-cyan-600"> &mdash; {chipStats.totalPredictions.toLocaleString()} predictions processed. 5 PM2 workers: chess-benchmark, hf-trader, ib-bridge, server-auto-evolution, system-monitor.</span>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-green-400">&bull;</span>
                <div>
                  <span className="text-cyan-300">Data Integrity</span>
                  <span className="text-cyan-600"> &mdash; 24 synthetic data violations found and fixed across 3 audit rounds. Zero fake data in production pipelines. All Math.random() in data paths eliminated.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Software → Hardware mapping */}
          <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3">
            <div className="text-cyan-400 font-bold mb-2">SOFTWARE &rarr; HARDWARE MAPPING</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
              {[
                ['SynapticTruthNetwork neurons', 'Ring resonator arrays'],
                ['Synaptic weight \u00D7 energy', 'Mach-Zehnder interferometer transmission'],
                ['Cascade propagation', 'Waveguide-coupled resonator chains'],
                ['Interference calculations', 'Physical photon interference (same equations)'],
                ['Holographic memory', 'Photorefractive crystal lookup'],
                ['64\u00D764 matrix operations', 'Silicon photonics chip (45nm)'],
                ['Cross-domain correlation', 'Multi-wavelength constructive interference'],
                ['Position hash (SHA-256)', 'Holographic address beam wavelength'],
              ].map(([sw, hw]) => (
                <div key={sw} className="flex gap-2 items-start">
                  <span className="text-purple-400 flex-shrink-0">{sw}</span>
                  <span className="text-cyan-700">&rarr;</span>
                  <span className="text-cyan-300">{hw}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-[#1e3a5f] text-amber-400 text-[10px]">
              The gap is fabrication, not architecture. Every algorithm running in software today maps directly to a known photonic component.
            </div>
          </div>

          {/* Real references */}
          <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-lg p-3">
            <div className="text-cyan-400 font-bold mb-2">PUBLISHED SCIENCE REFERENCES</div>
            <div className="space-y-1 text-[10px] text-cyan-600">
              <div>&bull; Shen et al. (2017) &mdash; Deep learning with coherent nanophotonic circuits, Nature Photonics</div>
              <div>&bull; Reck et al. (1994) &mdash; Experimental realization of any discrete unitary operator, Physical Review Letters</div>
              <div>&bull; Clements et al. (2016) &mdash; Optimal design for universal multiport interferometers, Optica</div>
              <div>&bull; Kippenberg et al. (2018) &mdash; Dissipative Kerr solitons in optical microresonators, Science</div>
              <div>&bull; Bennett & Brassard (1984) &mdash; Quantum cryptography (BB84 protocol)</div>
              <div>&bull; Haus (1984) &mdash; Coupled mode theory, Waves and Fields in Optoelectronics</div>
              <div>&bull; Watts & Strogatz (1998) &mdash; Collective dynamics of small-world networks, Nature</div>
              <div>&bull; Anderson (1958) &mdash; Absence of diffusion in certain random lattices (Nobel Prize 1977)</div>
              <div>&bull; Davidson et al. (2010) &mdash; God's Number for Rubik's Cube is 20</div>
              <div>&bull; Morin (1959) &mdash; VO₂ metal-insulator transition at 68°C</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTED PROCESSOR DETAIL ──────────────────────────────── */}
      {selected && (
        <div className="border-t border-[#1e3a5f] bg-[#0d1f3c]/80 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold font-mono" style={{ color: DOMAIN_COLORS[selected.domain] }}>
                {selected.name} &mdash; {selected.photonicType}
              </h3>
              <p className="text-[10px] text-cyan-600 font-mono mt-0.5">
                Domain: {selected.domain} | Position: Col {selected.col}, Row {selected.row}
              </p>
            </div>
            <button onClick={() => setSelectedId(null)}
              className="text-cyan-700 hover:text-cyan-300 text-xs font-mono border border-[#1e3a5f] px-2 py-0.5 rounded">
              CLOSE
            </button>
          </div>

          {/* Fabrication details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] mb-3">
            <div className="bg-[#080f1e] border border-[#1a2d4a] rounded p-2.5">
              <div className="text-cyan-500 font-bold mb-1.5 text-[10px]">FABRICATION</div>
              <div className="space-y-1">
                <div><span className="text-cyan-600">Component:</span> <span className="text-cyan-200">{selected.fabrication.component}</span></div>
                <div><span className="text-cyan-600">Material:</span> <span className="text-cyan-200">{selected.fabrication.material}</span></div>
                <div><span className="text-cyan-600">Key Feature:</span> <span className="text-cyan-200">{selected.fabrication.feature}</span></div>
                <div><span className="text-cyan-600">Principle:</span> <span className="text-cyan-200">{selected.fabrication.principle}</span></div>
              </div>
            </div>
            <div className="bg-[#080f1e] border border-[#1a2d4a] rounded p-2.5">
              <div className="text-cyan-500 font-bold mb-1.5 text-[10px]">PER-CORE SPEC</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-[#0a1628] rounded px-2 py-1">
                  <div className="text-[9px] text-cyan-700">WAVEGUIDES</div>
                  <div className="text-cyan-200 font-bold">1,024</div>
                </div>
                <div className="bg-[#0a1628] rounded px-2 py-1">
                  <div className="text-[9px] text-cyan-700">RESONATORS</div>
                  <div className="text-cyan-200 font-bold">256</div>
                </div>
                <div className="bg-[#0a1628] rounded px-2 py-1">
                  <div className="text-[9px] text-cyan-700">MODULATORS</div>
                  <div className="text-cyan-200 font-bold">128</div>
                </div>
                <div className="bg-[#0a1628] rounded px-2 py-1">
                  <div className="text-[9px] text-cyan-700">DETECTORS</div>
                  <div className="text-cyan-200 font-bold">128</div>
                </div>
              </div>
            </div>
          </div>

          {/* Artist note */}
          <div className="bg-[#0f1a2e] border-l-2 rounded p-3 mb-3" style={{ borderColor: DOMAIN_COLORS[selected.domain] }}>
            <div className="text-[10px] font-bold mb-1" style={{ color: DOMAIN_COLORS[selected.domain] }}>
              ARTIST NOTE &mdash; Alec Arthur Shelton
            </div>
            <div className="text-cyan-300 text-[11px] leading-relaxed italic">
              "{selected.artistNote}"
            </div>
          </div>

          {/* Real world proof */}
          <div className="bg-[#080f1e] border border-green-900/40 rounded p-2.5">
            <div className="text-[10px] font-bold text-green-500 mb-1">REAL-WORLD PROOF</div>
            <div className="text-cyan-300 text-[11px]">{selected.realWorldProof}</div>
          </div>
        </div>
      )}
    </div>
  );
}
