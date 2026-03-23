import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RefreshCw, Zap, Activity, Layers, Thermometer, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

// ─── PHYSICS CONSTANTS (mirrored from rubber-photonic-adapter.mjs) ───────────

const RUBBER = {
  n0: 1.52, dndt: -0.0003, dnde: 0.0085,
  alpha0: 0.8, k_strain: 0.35,
  C_stress: 2.4e-9, E_young: 0.8e6,
  kappa: 1.2e-7, I_sat: 0.5, L: 1.0, T_ambient: 20.0,
};

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function clamp(v: number) { return Math.max(-1, Math.min(1, v)); }
function norm(v: number, lo: number, hi: number) {
  return clamp((v - (lo + hi) / 2) / ((hi - lo) / 2 || 1e-9));
}

function strainAbsorption(e: number) { return RUBBER.alpha0 * (1 + RUBBER.k_strain * e); }
function beerLambert(e: number) { return Math.exp(-strainAbsorption(e) * RUBBER.L); }
function saturableGate(I: number) {
  return Math.exp(-(RUBBER.alpha0 / (1 + I / RUBBER.I_sat)) * RUBBER.L);
}
function refractiveIndex(T: number, e: number) {
  return RUBBER.n0 + RUBBER.dndt * (T - RUBBER.T_ambient) + RUBBER.dnde * e;
}
function photoelasticBiref(e: number) {
  const lam = e + 1;
  const sigma = RUBBER.E_young * (lam - 1 / (lam * lam));
  return clamp(RUBBER.C_stress * sigma * 1e6);
}
function thermalLens(I: number) {
  const Pabs = I * (1 - beerLambert(0));
  const bw = 0.1e-3;
  const finv = (Pabs * Math.abs(RUBBER.dndt) * RUBBER.L) / (Math.PI * bw ** 2 * RUBBER.n0 * 100);
  return clamp(finv * 1e4 * -1);
}
function phononBand(I: number, e: number, band: 'low' | 'mid' | 'high') {
  const absorbed = I * (1 - beerLambert(e));
  const fw = { low: 0.6, mid: 0.3, high: 0.1 }[band];
  const sc = { low: 0.8, mid: 1.2, high: 0.4 }[band];
  return clamp(absorbed * fw * (1 + sc * e * 0.2) * 2 - 0.5);
}
function infoDensity(e: number, T: number, I: number) {
  const sc = Math.sin(Math.PI * Math.min(e / 3, 1));
  const tc = 1 - Math.exp(-Math.abs(T - RUBBER.T_ambient) / 20);
  const ic = 4 * I * (1 - I);
  return clamp((sc * 0.4 + tc * 0.4 + ic * 0.2) * 2 - 1);
}

interface SimState {
  absorptionHistory: number[];
  thermalHistory: number[];
  strainHistory: number[];
}

function computeFeatures(I: number, e: number, T: number, step: number, state: SimState) {
  const deltaT = T - RUBBER.T_ambient;
  const alpha = strainAbsorption(e);
  const trans = beerLambert(e);
  const n = refractiveIndex(T, e);
  const biref = photoelasticBiref(e);

  state.absorptionHistory.push(1 - trans);
  state.thermalHistory.push(T);
  state.strainHistory.push(e);
  if (state.absorptionHistory.length > 50) state.absorptionHistory.shift();
  if (state.thermalHistory.length > 50) state.thermalHistory.shift();
  if (state.strainHistory.length > 50) state.strainHistory.shift();

  const cumAbs = state.absorptionHistory.reduce((s, v) => s + v, 0) / state.absorptionHistory.length;
  const thermMem = state.thermalHistory.reduce((s, t) => s + (t - RUBBER.T_ambient), 0)
    / Math.max(1, state.thermalHistory.length);
  const fp = (alpha - RUBBER.alpha0) / RUBBER.alpha0;
  const snr = trans > 0.01 ? Math.log10((1 - trans) / (trans + 0.01) + 1) : 0;
  const Pabs = I * (1 - trans);

  return {
    // Absorption
    beer_lambert_transmission: clamp(trans * 2 - 1),
    absorption_coefficient:    norm(alpha, 0.5, 2.5),
    saturable_gate:            clamp(saturableGate(I) * 2 - 1),
    differential_absorption:   norm(alpha * 28.0 * (1 + 0.12 * e) / alpha, 25, 40),
    spectral_fingerprint:      clamp(fp * 3),
    absorption_memory:         norm(cumAbs, 0, 1),
    wave_penetration_depth:    norm(1 / Math.max(alpha, 1e-6), 0.3, 2.0),
    intensity_contrast:        clamp(snr),
    // Thermal
    thermal_field:             norm(T, 15, 80),
    thermal_gradient:          norm(deltaT, -30, 30),
    thermal_lens_power:        thermalLens(I),
    thermal_pulse_timing:      clamp(Math.sin((step % 10) / 10 * Math.PI * 2)),
    heat_diffusion_rate:       0.1,
    thermal_memory:            norm(thermMem, -10, 30),
    phonon_emission:           clamp(Pabs * 0.4 * (1 - Math.exp(-Math.abs(deltaT) / 15)) * (deltaT >= 0 ? 1 : -0.3)),
    thermo_optic_feedback:     clamp((RUBBER.dndt * deltaT) / (Math.abs(RUBBER.dnde) * 2 + 1e-10)),
    // Strain
    strain_field:              norm(e, 0, 3),
    refractive_index_map:      norm(n, 1.48, 1.62),
    birefringence:             biref,
    elastic_recovery:          clamp((1 - Math.exp(-(step % 5) / 5)) * 2 - 1),
    chain_alignment:           clamp(Math.tanh(e * 1.5) - Math.tanh(e * 0.3)),
    stress_field:              norm(RUBBER.E_young * e * 1e-6, 0, 2.5),
    waveguide_mode:            clamp(n / RUBBER.n0 * 2 - 2),
    polarization_rotation:     clamp(Math.sin(biref * Math.PI)),
    // Memory / emission
    phonon_spectrum_low:       phononBand(I, e, 'low'),
    phonon_spectrum_mid:       phononBand(I, e, 'mid'),
    phonon_spectrum_high:      phononBand(I, e, 'high'),
    thermal_reemission:        clamp(((T + 273.15) ** 4 - (RUBBER.T_ambient + 273.15) ** 4) / (RUBBER.T_ambient + 273.15) ** 4 * 5),
    cumulative_absorption:     norm(cumAbs, 0, 1),
    information_density:       infoDensity(e, T, I),
    signal_to_noise:           clamp(snr * 2 - 0.5),
    calorimetric_fingerprint:  clamp(Math.sin(cumAbs * Math.PI + thermMem / 10 * Math.PI + e * 0.5)),
  };
}

function classifyArchetype(f: Record<string, number>): string {
  const scores: Record<string, number> = {
    thermal_encoding:             Math.abs(f.thermal_gradient) + Math.abs(f.thermal_lens_power),
    strain_modulation:            Math.abs(f.strain_field) + Math.abs(f.absorption_coefficient),
    saturable_gating:             Math.abs(f.saturable_gate) + Math.abs(f.intensity_contrast),
    delay_line_memory:            Math.abs(f.thermal_pulse_timing) + Math.abs(f.thermal_memory),
    calorimetric_fingerprinting:  Math.abs(f.calorimetric_fingerprint) + Math.abs(f.cumulative_absorption),
    birefringence_encoding:       Math.abs(f.birefringence) + Math.abs(f.polarization_rotation),
    phonon_coupling:              Math.abs(f.phonon_spectrum_mid) + Math.abs(f.phonon_emission),
    spectral_fingerprinting:      Math.abs(f.differential_absorption) + Math.abs(f.spectral_fingerprint),
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

// ─── GRID FINGERPRINT ────────────────────────────────────────────────────────

const CHANNEL_ROWS: Record<string, { row: number; col: number; domain: string }> = {
  beer_lambert_transmission: { row: 0, col: 0, domain: 'absorption' },
  absorption_coefficient:    { row: 0, col: 1, domain: 'absorption' },
  saturable_gate:            { row: 0, col: 2, domain: 'absorption' },
  differential_absorption:   { row: 0, col: 3, domain: 'absorption' },
  spectral_fingerprint:      { row: 0, col: 4, domain: 'absorption' },
  absorption_memory:         { row: 0, col: 5, domain: 'absorption' },
  wave_penetration_depth:    { row: 0, col: 6, domain: 'absorption' },
  intensity_contrast:        { row: 0, col: 7, domain: 'absorption' },
  thermal_field:             { row: 2, col: 0, domain: 'thermal' },
  thermal_gradient:          { row: 2, col: 1, domain: 'thermal' },
  thermal_lens_power:        { row: 2, col: 2, domain: 'thermal' },
  thermal_pulse_timing:      { row: 2, col: 3, domain: 'thermal' },
  heat_diffusion_rate:       { row: 2, col: 4, domain: 'thermal' },
  thermal_memory:            { row: 2, col: 5, domain: 'thermal' },
  phonon_emission:           { row: 2, col: 6, domain: 'thermal' },
  thermo_optic_feedback:     { row: 2, col: 7, domain: 'thermal' },
  strain_field:              { row: 4, col: 0, domain: 'strain' },
  refractive_index_map:      { row: 4, col: 1, domain: 'strain' },
  birefringence:             { row: 4, col: 2, domain: 'strain' },
  elastic_recovery:          { row: 4, col: 3, domain: 'strain' },
  chain_alignment:           { row: 4, col: 4, domain: 'strain' },
  stress_field:              { row: 4, col: 5, domain: 'strain' },
  waveguide_mode:            { row: 4, col: 6, domain: 'strain' },
  polarization_rotation:     { row: 4, col: 7, domain: 'strain' },
  phonon_spectrum_low:       { row: 6, col: 0, domain: 'memory' },
  phonon_spectrum_mid:       { row: 6, col: 1, domain: 'memory' },
  phonon_spectrum_high:      { row: 6, col: 2, domain: 'memory' },
  thermal_reemission:        { row: 6, col: 3, domain: 'memory' },
  cumulative_absorption:     { row: 6, col: 4, domain: 'memory' },
  information_density:       { row: 6, col: 5, domain: 'memory' },
  signal_to_noise:           { row: 6, col: 6, domain: 'memory' },
  calorimetric_fingerprint:  { row: 6, col: 7, domain: 'memory' },
};

const DOMAIN_COLORS: Record<string, string> = {
  absorption: '#f97316',
  thermal:    '#ef4444',
  strain:     '#22c55e',
  memory:     '#a855f7',
};

// ─── WAVEGUIDE CANVAS RENDERER ───────────────────────────────────────────────

function drawWaveguide(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  intensity: number, strain: number, temperature: number, step: number,
  features: Record<string, number>,
) {
  ctx.clearRect(0, 0, W, H);

  const bodyTop = H * 0.25;
  const bodyBot = H * 0.75;
  const bodyH = bodyBot - bodyTop;
  const strainFactor = 1 + strain * 0.12;
  const stretchedTop = bodyTop - (strainFactor - 1) * bodyH * 0.5;
  const stretchedBot = bodyBot + (strainFactor - 1) * bodyH * 0.5;
  const stretchedH = stretchedBot - stretchedTop;

  // ── Thermal background gradient ──────────────────────────────
  const t_norm = clamp01((temperature - 15) / 75);
  const r = Math.round(20 + t_norm * 160);
  const g = Math.round(10 + (1 - t_norm) * 20);
  const b = Math.round(60 + (1 - t_norm) * 150);
  const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
  bgGrad.addColorStop(0, `rgba(${r}, ${g + 20}, ${b + 40}, 0.15)`);
  bgGrad.addColorStop(0.5, `rgba(${r + 40}, ${g}, ${b - 30}, 0.25)`);
  bgGrad.addColorStop(1, `rgba(${r}, ${g}, ${b - 60}, 0.10)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Rubber waveguide body ─────────────────────────────────────
  const bodyGrad = ctx.createLinearGradient(0, stretchedTop, 0, stretchedBot);
  bodyGrad.addColorStop(0, `rgba(${r + 20}, ${g + 10}, ${b}, 0.35)`);
  bodyGrad.addColorStop(0.5, `rgba(${r + 60}, ${g + 30}, ${b - 20}, 0.55)`);
  bodyGrad.addColorStop(1, `rgba(${r + 20}, ${g + 10}, ${b}, 0.35)`);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(60, stretchedTop, W - 120, stretchedH, 8);
  ctx.fill();

  // ── Absorption zones (darker bands) ──────────────────────────
  const alpha_norm = clamp01((strainAbsorption(strain) - 0.5) / 2.0);
  const numBands = 8;
  for (let i = 0; i < numBands; i++) {
    const x = 60 + (i / numBands) * (W - 120);
    const bandW = (W - 120) / numBands;
    const localAlpha = alpha_norm * Math.exp(-alpha_norm * i / numBands * 3);
    ctx.fillStyle = `rgba(0, 0, 0, ${localAlpha * 0.4})`;
    ctx.fillRect(x, stretchedTop, bandW, stretchedH);
  }

  // ── Waveguide border ─────────────────────────────────────────
  ctx.strokeStyle = `rgba(${r + 80}, ${g + 80}, 255, 0.6)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(60, stretchedTop, W - 120, stretchedH, 8);
  ctx.stroke();

  // ── Input beam (left side) ────────────────────────────────────
  const beamY = (stretchedTop + stretchedBot) / 2;
  const beamH = stretchedH * 0.12 * (0.5 + intensity * 0.5);
  const inputGrad = ctx.createLinearGradient(0, beamY - beamH, 0, beamY + beamH);
  inputGrad.addColorStop(0, 'rgba(255,255,100,0)');
  inputGrad.addColorStop(0.5, `rgba(255,255,150,${intensity * 0.9})`);
  inputGrad.addColorStop(1, 'rgba(255,255,100,0)');
  ctx.fillStyle = inputGrad;
  ctx.fillRect(0, beamY - beamH, 70, beamH * 2);

  // ── Photon pulse traveling through waveguide ──────────────────
  const pulseX = 60 + ((step % 60) / 60) * (W - 120);
  const transmission = beerLambert(strain);
  const pulseI = intensity * (0.3 + 0.7 * (pulseX - 60) / (W - 120) > 0
    ? intensity * Math.exp(-strainAbsorption(strain) * (pulseX - 60) / (W - 120) * RUBBER.L)
    : intensity);
  const pulseGrad = ctx.createRadialGradient(pulseX, beamY, 0, pulseX, beamY, beamH * 3);
  pulseGrad.addColorStop(0, `rgba(255,255,200,${pulseI * 0.95})`);
  pulseGrad.addColorStop(0.4, `rgba(255,220,80,${pulseI * 0.6})`);
  pulseGrad.addColorStop(1, 'rgba(255,180,0,0)');
  ctx.fillStyle = pulseGrad;
  ctx.beginPath();
  ctx.ellipse(pulseX, beamY, beamH * 3, beamH * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Transmitted beam (right side) with polarization ellipse ──
  const outI = intensity * transmission;
  const outGrad = ctx.createLinearGradient(0, beamY - beamH, 0, beamY + beamH);
  outGrad.addColorStop(0, 'rgba(255,200,0,0)');
  outGrad.addColorStop(0.5, `rgba(255,200,50,${outI * 0.8})`);
  outGrad.addColorStop(1, 'rgba(255,200,0,0)');
  ctx.fillStyle = outGrad;
  ctx.fillRect(W - 70, beamY - beamH * (0.5 + outI * 0.5), 70, beamH * (1 + outI));

  // ── Birefringence ellipse at output ──────────────────────────
  if (outI > 0.05) {
    const biref = photoelasticBiref(strain);
    const ex = W - 40;
    const ey = beamY;
    const ra = beamH * 0.7;
    const rb = ra * Math.max(0.2, 1 - Math.abs(biref) * 0.8);
    ctx.strokeStyle = `rgba(200, 100, 255, ${outI * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(ex, ey, ra, rb, biref * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(100, 200, 255, ${outI * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(ex, ey, rb, ra, biref * 1.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ── Thermal gradient halo ─────────────────────────────────────
  if (temperature > RUBBER.T_ambient + 5) {
    const heatAlpha = clamp01((temperature - RUBBER.T_ambient) / 50) * 0.15;
    const haloGrad = ctx.createLinearGradient(60, stretchedTop - 10, 60, stretchedTop);
    haloGrad.addColorStop(0, 'rgba(255,80,0,0)');
    haloGrad.addColorStop(1, `rgba(255,120,0,${heatAlpha})`);
    ctx.fillStyle = haloGrad;
    ctx.fillRect(60, stretchedTop - 10, W - 120, 10);
    const haloGrad2 = ctx.createLinearGradient(60, stretchedBot, 60, stretchedBot + 10);
    haloGrad2.addColorStop(0, `rgba(255,120,0,${heatAlpha})`);
    haloGrad2.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = haloGrad2;
    ctx.fillRect(60, stretchedBot, W - 120, 10);
  }

  // ── Labels ────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(200,200,200,0.7)';
  ctx.font = '10px monospace';
  ctx.fillText('INPUT', 5, beamY - beamH - 4);
  ctx.fillText(`I=${intensity.toFixed(2)}`, 5, beamY + beamH + 12);
  ctx.fillText('OUTPUT', W - 58, beamY - beamH - 4);
  ctx.fillText(`T=${(intensity * transmission).toFixed(2)}`, W - 58, beamY + beamH + 12);
  ctx.fillStyle = 'rgba(255,200,100,0.5)';
  ctx.fillText(`n=${refractiveIndex(temperature, strain).toFixed(4)}`, W / 2 - 30, stretchedTop - 6);
  ctx.fillText(`α=${strainAbsorption(strain).toFixed(2)} cm⁻¹`, W / 2 - 28, stretchedBot + 14);
}

// ─── GRID CELL COMPONENT ─────────────────────────────────────────────────────

function GridCell({ channel, value, domain }: { channel: string; value: number; domain: string }) {
  const intensity = clamp01((Math.abs(value) + 1) / 2);
  const isPositive = value >= 0;
  const baseColor = DOMAIN_COLORS[domain] || '#888';
  const opacity = 0.15 + intensity * 0.75;
  return (
    <div
      className="w-full h-full rounded-sm border border-white/5 cursor-default"
      style={{
        backgroundColor: `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        boxShadow: intensity > 0.5 ? `0 0 4px ${baseColor}60` : 'none',
      }}
      title={`${channel}: ${value.toFixed(3)}`}
    />
  );
}

// ─── CHANNEL BAR ─────────────────────────────────────────────────────────────

function ChannelBar({ label, value, domain }: { label: string; value: number; domain: string }) {
  const pct = clamp01((value + 1) / 2) * 100;
  const color = DOMAIN_COLORS[domain];
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 text-right text-muted-foreground truncate">{label.replace(/_/g, ' ')}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 text-right font-mono" style={{ color }}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const ARCHETYPES: Record<string, { desc: string; color: string }> = {
  thermal_encoding:            { desc: 'Temperature gradients carry information via n(T) variations', color: '#ef4444' },
  strain_modulation:           { desc: 'Stretch state encodes data as α(ε) absorption change', color: '#f97316' },
  saturable_gating:            { desc: 'Nonlinear intensity threshold opens/closes optical gate', color: '#eab308' },
  delay_line_memory:           { desc: 'Thermal diffusion timing encodes sequential information', color: '#22c55e' },
  calorimetric_fingerprinting: { desc: 'Unique cumulative thermal history signatures state', color: '#06b6d4' },
  birefringence_encoding:      { desc: 'Photoelastic polarization rotation maps mechanical state', color: '#8b5cf6' },
  phonon_coupling:             { desc: 'Absorbed photons excite C-H phonon modes, read optically', color: '#ec4899' },
  spectral_fingerprinting:     { desc: 'Differential absorption across λ bands encodes composition', color: '#a855f7' },
};

export default function RubberPhotonics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stepRef = useRef(0);
  const stateRef = useRef<SimState>({ absorptionHistory: [], thermalHistory: [], strainHistory: [] });

  const [playing, setPlaying] = useState(false);
  const [intensity, setIntensity] = useState(0.4);
  const [strain, setStrain] = useState(0.8);
  const [temperature, setTemperature] = useState(35);
  const [features, setFeatures] = useState<Record<string, number>>({});
  const [archetype, setArchetype] = useState('strain_modulation');
  const [fidelity, setFidelity] = useState(0.5);
  const [step, setStep] = useState(0);

  const tick = useCallback(() => {
    stepRef.current += 1;
    const s = stepRef.current;
    const f = computeFeatures(intensity, strain, temperature, s, stateRef.current);
    setFeatures(f);
    setArchetype(classifyArchetype(f));
    const infoS = (f.information_density + 1) / 2;
    const snrS = (f.signal_to_noise + 1) / 2;
    setFidelity(infoS * 0.6 + snrS * 0.4);
    setStep(s);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawWaveguide(ctx, canvas.width, canvas.height, intensity, strain, temperature, s, f);
    }
  }, [intensity, strain, temperature]);

  useEffect(() => {
    if (playing) {
      const loop = () => {
        tick();
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, tick]);

  useEffect(() => {
    const f = computeFeatures(intensity, strain, temperature, stepRef.current, stateRef.current);
    setFeatures(f);
    setArchetype(classifyArchetype(f));
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawWaveguide(ctx, canvas.width, canvas.height, intensity, strain, temperature, stepRef.current, f);
    }
  }, [intensity, strain, temperature]);

  const reset = () => {
    stepRef.current = 0;
    stateRef.current = { absorptionHistory: [], thermalHistory: [], strainHistory: [] };
    const f = computeFeatures(intensity, strain, temperature, 0, stateRef.current);
    setFeatures(f);
    setFidelity(0.5);
    setStep(0);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawWaveguide(ctx, canvas.width, canvas.height, intensity, strain, temperature, 0, f);
    }
  };

  const transmission = beerLambert(strain);
  const n = refractiveIndex(temperature, strain);
  const biref = photoelasticBiref(strain);

  type GridCellData = { v: number; domain: string; channel: string };
  const gridCells: React.ReactNode[] = [];
  const grid: Record<string, GridCellData> = {};
  for (const [ch, pos] of Object.entries(CHANNEL_ROWS)) {
    const key = `${pos.row}-${pos.col}`;
    grid[key] = { v: features[ch] ?? 0, domain: pos.domain, channel: ch };
  }
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = grid[`${r}-${c}`];
      if (cell) {
        gridCells.push(<GridCell key={`${r}-${c}`} channel={cell.channel} value={cell.v} domain={cell.domain} />);
      } else {
        gridCells.push(<div key={`${r}-${c}`} className="w-full h-full bg-white/3 rounded-sm border border-white/5" />);
      }
    }
  }

  const domainGroups = [
    { label: 'Absorption', domain: 'absorption', icon: <Layers className="h-3 w-3" />, channels: ['beer_lambert_transmission','absorption_coefficient','saturable_gate','differential_absorption','spectral_fingerprint','absorption_memory','wave_penetration_depth','intensity_contrast'] },
    { label: 'Thermal', domain: 'thermal', icon: <Thermometer className="h-3 w-3" />, channels: ['thermal_field','thermal_gradient','thermal_lens_power','thermal_pulse_timing','thermal_memory','phonon_emission','thermo_optic_feedback'] },
    { label: 'Strain', domain: 'strain', icon: <Activity className="h-3 w-3" />, channels: ['strain_field','refractive_index_map','birefringence','chain_alignment','stress_field','waveguide_mode','polarization_rotation'] },
    { label: 'Memory', domain: 'memory', icon: <Radio className="h-3 w-3" />, channels: ['phonon_spectrum_low','phonon_spectrum_mid','phonon_spectrum_high','thermal_reemission','information_density','signal_to_noise','calorimetric_fingerprint'] },
  ];

  const archetypeInfo = ARCHETYPES[archetype] || ARCHETYPES.strain_modulation;
  const fidelityLabel = fidelity > 0.65 ? 'High Fidelity' : fidelity > 0.40 ? 'Moderate' : 'Lossy';
  const fidelityColor = fidelity > 0.65 ? '#22c55e' : fidelity > 0.40 ? '#eab308' : '#ef4444';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/academic-paper">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Academic Paper
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-base">Elastomeric Photonics</h1>
              <p className="text-xs text-muted-foreground">Natural rubber as information-transfer medium via absorption inversion</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-400">
            Domain 5 — Universal Grid
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">

        {/* Physics equations bar */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-5 p-3 rounded-lg bg-card/40 border border-white/8 overflow-x-auto">
          <div className="flex gap-6 text-xs font-mono text-muted-foreground whitespace-nowrap">
            <span>Beer-Lambert: <span className="text-orange-400">I = I₀·e^(-αL)</span></span>
            <span>Saturable gate: <span className="text-yellow-400">α(I) = α₀/(1+I/I_sat)</span></span>
            <span>Thermo-optic: <span className="text-red-400">n(T) = n₀ + (dn/dT)·ΔT</span></span>
            <span>Photoelastic: <span className="text-green-400">Δn = C·σ = C·E·ε</span></span>
            <span>Delay-line: <span className="text-cyan-400">t(x) = x²/4κ</span></span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Simulation canvas + controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Canvas */}
            <Card className="border-white/10 bg-card/60">
              <CardContent className="p-0">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={200}
                  className="w-full rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0d0a1a 100%)' }}
                />
              </CardContent>
            </Card>

            {/* Live readouts */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Transmission', value: transmission, unit: '', color: '#f97316', fmt: (v: number) => (v * 100).toFixed(1) + '%' },
                { label: 'Ref. Index n', value: n, unit: '', color: '#22c55e', fmt: (v: number) => v.toFixed(5) },
                { label: 'Birefringence Δn', value: Math.abs(biref), unit: '', color: '#8b5cf6', fmt: (v: number) => v.toFixed(4) },
                { label: 'Info Density', value: (((features.information_density ?? 0) + 1) / 2), unit: '', color: '#06b6d4', fmt: (v: number) => (v * 100).toFixed(0) + '%' },
              ].map(item => (
                <div key={item.label} className="rounded-lg bg-card/60 border border-white/8 p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-lg font-mono font-bold" style={{ color: item.color }}>
                    {item.fmt(item.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <Card className="border-white/10 bg-card/60">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Simulation Parameters
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={reset}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                    <Button size="sm" className="h-7 px-3 text-xs" onClick={() => setPlaying(p => !p)}>
                      {playing ? <><Pause className="h-3 w-3 mr-1" />Pause</> : <><Play className="h-3 w-3 mr-1" />Play</>}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-400">Input Intensity I₀</span>
                    <span className="font-mono text-orange-300">{intensity.toFixed(2)} (I/I_sat={( intensity / RUBBER.I_sat).toFixed(1)})</span>
                  </div>
                  <Slider min={0.01} max={0.99} step={0.01} value={[intensity]} onValueChange={([v]) => setIntensity(v)} className="[&>span]:bg-orange-500" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">Applied Strain ε</span>
                    <span className="font-mono text-green-300">{strain.toFixed(2)} ({(strain * 100).toFixed(0)}% elongation)</span>
                  </div>
                  <Slider min={0} max={3} step={0.05} value={[strain]} onValueChange={([v]) => setStrain(v)} className="[&>span]:bg-green-500" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-400">Temperature T</span>
                    <span className="font-mono text-red-300">{temperature.toFixed(0)}°C (ΔT = +{(temperature - RUBBER.T_ambient).toFixed(0)}°C)</span>
                  </div>
                  <Slider min={15} max={85} step={0.5} value={[temperature]} onValueChange={([v]) => setTemperature(v)} className="[&>span]:bg-red-500" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT: Grid fingerprint + archetype */}
          <div className="flex flex-col gap-4">

            {/* Archetype classification */}
            <Card className="border-white/10 bg-card/60">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Active Encoding Archetype</div>
                <div className="text-sm font-bold mb-1" style={{ color: archetypeInfo.color }}>
                  {archetype.replace(/_/g, ' ')}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{archetypeInfo.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Transfer Quality</span>
                  <span className="text-sm font-bold font-mono" style={{ color: fidelityColor }}>
                    {fidelityLabel} ({(fidelity * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${fidelity * 100}%`, backgroundColor: fidelityColor }} />
                </div>
              </CardContent>
            </Card>

            {/* Universal grid fingerprint */}
            <Card className="border-white/10 bg-card/60">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-mono">8×8 UNIVERSAL GRID</span>
                  <span className="ml-auto font-mono text-[10px]">step {step}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="grid grid-cols-8 gap-0.5 aspect-square">
                  {gridCells}
                </div>
                <div className="mt-2 flex gap-3 flex-wrap">
                  {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
                    <div key={d} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: c }} />
                      {d}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel readings */}
            <Card className="border-white/10 bg-card/60 flex-1">
              <CardContent className="p-3 space-y-3">
                {domainGroups.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span style={{ color: DOMAIN_COLORS[group.domain] }}>{group.icon}</span>
                      <span className="text-[11px] font-semibold" style={{ color: DOMAIN_COLORS[group.domain] }}>{group.label}</span>
                    </div>
                    <div className="space-y-0.5">
                      {group.channels.slice(0, 4).map(ch => (
                        <ChannelBar key={ch} label={ch} value={features[ch] ?? 0} domain={group.domain} />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Physics reference */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-white/8 bg-card/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-orange-400 mb-2">Material Constants (Natural Polyisoprene)</h3>
              <div className="text-xs font-mono space-y-1 text-muted-foreground">
                <div>n₀ = <span className="text-foreground">1.52</span> (refractive index @ 632nm)</div>
                <div>dn/dT = <span className="text-red-400">-0.0003 /°C</span> (negative thermo-optic)</div>
                <div>dn/dε = <span className="text-green-400">+0.0085 /strain</span> (stretch-induced)</div>
                <div>α₀ = <span className="text-orange-400">0.8 cm⁻¹</span> (near-IR baseline absorption)</div>
                <div>C_stress = <span className="text-purple-400">2.4×10⁻⁹ Pa⁻¹</span> (photoelastic)</div>
                <div>κ = <span className="text-cyan-400">1.2×10⁻⁷ m²/s</span> (thermal diffusivity)</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/8 bg-card/40">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-2">Universal Grid Integration</h3>
              <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <p>Rubber photonics routes through the same 8×8 universal grid portal as chess, battery, chemical, and market domains. Each photonic event populates 32 channels.</p>
                <p>The grid accumulates a temporal QR-code fingerprint identical in structure to chess piece visits — enabling <span className="text-cyan-300">cross-domain correlation</span> between rubber photonic states and other system archetypes.</p>
                <p>Domain 5 of the universal interference engine.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </main>
    </div>
  );
}
