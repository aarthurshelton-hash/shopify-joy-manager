/**
 * PhotonChipVisualization - Live Photonic Computing Blueprint
 * 
 * Real-time visualization of the 64x64 silicon photonics waveguide matrix
 * Shows photon energy states, wave propagation, and domain processing
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Activity, 
  Grid3X3, 
  Waves,
  Cpu,
  Eye,
  Fingerprint,
  ArrowRight
} from 'lucide-react';
import {
  QuadrantRadar,
  TemporalFlowChart,
  ArchetypeBadge,
  PredictionGauge
} from '@/components/pensent-ui';

// 64x64 grid cell state
interface WaveguideCell {
  x: number;
  y: number;
  energy: number; // 0-1 (low to high photon energy)
  phase: number; // 0-360 degrees
  active: boolean;
  domain: string | null;
}

// Domain processor state
interface DomainProcessor {
  name: string;
  type: string;
  active: boolean;
  load: number;
  photonCount: number;
  lastSignal: number;
}

interface PhotonChipVisualizationProps {
  liveData?: boolean;
  domainSignatures?: Array<{
    domain: string;
    quadrantProfile: { q1: number; q2: number; q3: number; q4: number };
    temporalFlow: { early: number; mid: number; late: number };
    archetype: string;
    fingerprint: string;
    intensity: number;
  }>;
}

export function PhotonChipVisualization({ 
  liveData = true,
  domainSignatures = []
}: PhotonChipVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cells, setCells] = useState<WaveguideCell[]>([]);
  const [processors, setProcessors] = useState<DomainProcessor[]>([
    { name: 'Chess (Brain)', type: 'ring_resonator_array', active: true, load: 0.73, photonCount: 1024, lastSignal: Date.now() },
    { name: 'Code (Blood)', type: 'Mach_Zehnder_interferometer', active: true, load: 0.45, photonCount: 2048, lastSignal: Date.now() },
    { name: 'Market (Nerves)', type: 'wavelength_multiplexing_bus', active: true, load: 0.89, photonCount: 4096, lastSignal: Date.now() },
    { name: 'Light (Vision)', type: 'photonic_neural_network', active: true, load: 0.62, photonCount: 8192, lastSignal: Date.now() },
    { name: 'Bio (Life)', type: 'biophotonic_sensing', active: false, load: 0.0, photonCount: 0, lastSignal: 0 },
    { name: 'Music (Heart)', type: 'frequency_comb_generator', active: true, load: 0.34, photonCount: 512, lastSignal: Date.now() },
  ]);
  const [totalPhotons, setTotalPhotons] = useState(15872);
  const [busLoad, setBusLoad] = useState(0.67);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Initialize 64x64 grid
  useEffect(() => {
    const initialCells: WaveguideCell[] = [];
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        initialCells.push({
          x,
          y,
          energy: Math.random() * 0.3,
          phase: Math.random() * 360,
          active: false,
          domain: null
        });
      }
    }
    setCells(initialCells);
  }, []);

  // Animate photon propagation
  useEffect(() => {
    if (!liveData) return;

    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      setCells(prevCells => {
        return prevCells.map(cell => {
          // Create wave patterns
          const waveX = Math.sin(cell.x * 0.1 + animationFrame * 0.05) * 0.5 + 0.5;
          const waveY = Math.cos(cell.y * 0.1 + animationFrame * 0.03) * 0.5 + 0.5;
          
          // Domain-specific activation patterns
          let domain = null;
          let active = false;
          
          // Chess: diagonal patterns (kingside/queenside)
          if ((cell.x + cell.y) % 8 === animationFrame % 8) {
            domain = 'chess';
            active = true;
          }
          // Code: horizontal bands (commit waves)
          else if (cell.y % 4 === (animationFrame / 2) % 4) {
            domain = 'code';
            active = true;
          }
          // Market: vertical spikes (price movements)
          else if (cell.x % 16 === animationFrame % 16 && cell.y > 32) {
            domain = 'market';
            active = true;
          }
          // Light: circular ripples
          else {
            const centerDist = Math.sqrt(Math.pow(cell.x - 32, 2) + Math.pow(cell.y - 32, 2));
            if (Math.abs(centerDist - (animationFrame % 32)) < 3) {
              domain = 'light';
              active = true;
            }
          }

          return {
            ...cell,
            energy: (waveX + waveY) / 2 * (active ? 0.9 : 0.3),
            phase: (cell.phase + 2) % 360,
            active,
            domain
          };
        });
      });

      // Update processors
      setProcessors(prev => prev.map(p => ({
        ...p,
        load: Math.max(0.1, Math.min(0.95, p.load + (Math.random() - 0.5) * 0.1)),
        photonCount: p.active ? Math.floor(p.load * 10000) : 0,
        lastSignal: p.active ? Date.now() : p.lastSignal
      })));

      // Update totals
      setTotalPhotons(processors.reduce((sum, p) => sum + p.photonCount, 0));
      setBusLoad(Math.random() * 0.3 + 0.5);

    }, 100);

    return () => clearInterval(interval);
  }, [liveData, animationFrame, processors]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 4;
    canvas.width = 64 * cellSize;
    canvas.height = 64 * cellSize;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    cells.forEach(cell => {
      const x = cell.x * cellSize;
      const y = cell.y * cellSize;
      
      // Color based on domain and energy
      let color;
      if (cell.domain === 'chess') {
        color = `hsla(${200 + cell.phase}, 80%, ${50 + cell.energy * 30}%, ${cell.energy})`;
      } else if (cell.domain === 'code') {
        color = `hsla(${120 + cell.phase}, 70%, ${50 + cell.energy * 30}%, ${cell.energy})`;
      } else if (cell.domain === 'market') {
        color = `hsla(${40 + cell.phase}, 90%, ${50 + cell.energy * 30}%, ${cell.energy})`;
      } else if (cell.domain === 'light') {
        color = `hsla(${280 + cell.phase}, 100%, ${60 + cell.energy * 20}%, ${cell.energy})`;
      } else {
        color = `hsla(220, 20%, ${20 + cell.energy * 20}%, ${cell.energy * 0.5})`;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
    });
  }, [cells]);

  // Mock signatures if none provided
  const displaySignatures = domainSignatures.length > 0 ? domainSignatures : [
    {
      domain: 'chess',
      quadrantProfile: { q1: 0.73, q2: 0.45, q3: 0.62, q4: 0.28 },
      temporalFlow: { early: 0.35, mid: 0.68, late: 0.52 },
      archetype: 'kingside_attack',
      fingerprint: 'cf-7a3b9f2',
      intensity: 0.77
    },
    {
      domain: 'code',
      quadrantProfile: { q1: 0.82, q2: 0.34, q3: 0.21, q4: 0.45 },
      temporalFlow: { early: 0.42, mid: 0.89, late: 0.33 },
      archetype: 'feature_rush',
      fingerprint: 'code-8f2c1d4',
      intensity: 0.68
    },
    {
      domain: 'market',
      quadrantProfile: { q1: 0.91, q2: 0.23, q3: 0.15, q4: 0.67 },
      temporalFlow: { early: 0.28, mid: 0.45, late: 0.91 },
      archetype: 'breakout_momentum',
      fingerprint: 'mkt-9e4a7b1',
      intensity: 0.89
    },
    {
      domain: 'light',
      quadrantProfile: { q1: 0.56, q2: 0.78, q3: 0.43, q4: 0.67 },
      temporalFlow: { early: 0.67, mid: 0.52, late: 0.89 },
      archetype: 'interference_cascade',
      fingerprint: 'phn-3d8e5f2',
      intensity: 0.74
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <Cpu className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Photonic Computing Matrix</h2>
            <p className="text-sm text-muted-foreground">64x64 Silicon Waveguide Array - Universal Pattern Processing</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2">
            <Zap className="h-3 w-3 text-yellow-400" />
            {totalPhotons.toLocaleString()} Photons
          </Badge>
          <Badge variant="outline" className="gap-2">
            <Activity className="h-3 w-3 text-green-400" />
            Bus Load: {Math.round(busLoad * 100)}%
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Waveguide Matrix */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-purple-400" />
                <CardTitle className="text-lg">Live Waveguide Activity</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-400" /> Chess
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400" /> Code
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" /> Market
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400" /> Light
                </span>
              </div>
            </div>
            <CardDescription>
              Real-time photon propagation through 4,096 waveguide resonators
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              <canvas 
                ref={canvasRef}
                className="w-full rounded-lg border border-muted"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                <Waves className="h-3 w-3" />
                λ = 1550nm
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain Processors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              <CardTitle className="text-lg">Domain Processors</CardTitle>
            </div>
            <CardDescription>
              27 photonic processing units active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {processors.map((processor) => (
              <motion.div
                key={processor.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${
                  processor.active 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-muted/10 border-muted/50 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      processor.active ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium text-sm">{processor.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {processor.photonCount.toLocaleString()} φ
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{processor.type}</span>
                    <span>{Math.round(processor.load * 100)}%</span>
                  </div>
                  <Progress value={processor.load * 100} className="h-1" />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Domain Signatures */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {displaySignatures.map((sig, index) => (
          <motion.div
            key={sig.domain}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sig.domain === 'chess' && <Grid3X3 className="h-4 w-4 text-blue-400" />}
                    {sig.domain === 'code' && <Activity className="h-4 w-4 text-green-400" />}
                    {sig.domain === 'market' && <Zap className="h-4 w-4 text-amber-400" />}
                    {sig.domain === 'light' && <Eye className="h-4 w-4 text-purple-400" />}
                    <CardTitle className="text-sm capitalize">{sig.domain}</CardTitle>
                  </div>
                  <ArchetypeBadge 
                    archetype={sig.archetype}
                    category="universal"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fingerprint */}
                <div className="flex items-center gap-2 text-xs">
                  <Fingerprint className="h-3 w-3 text-muted-foreground" />
                  <code className="text-muted-foreground font-mono">{sig.fingerprint}</code>
                </div>

                {/* Mini Quadrant Radar */}
                <div className="flex justify-center">
                  <QuadrantRadar
                    data={sig.quadrantProfile}
                    size={120}
                    showLabels={false}
                    showValues={false}
                    animated={false}
                  />
                </div>

                {/* Mini Temporal Flow */}
                <TemporalFlowChart
                  data={{
                    opening: sig.temporalFlow.early,
                    midgame: sig.temporalFlow.mid,
                    endgame: sig.temporalFlow.late
                  }}
                  height={60}
                  showLabels={false}
                  showValues={false}
                  colorScheme="default"
                />

                {/* Intensity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Intensity</span>
                    <span>{Math.round(sig.intensity * 100)}%</span>
                  </div>
                  <Progress value={sig.intensity * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Universal Bus Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-cyan-400" />
            <CardTitle className="text-lg">Universal Photonic Bus</CardTitle>
          </div>
          <CardDescription>
            128-channel wavelength division multiplexing - All adapters communicate here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-16 gap-1">
            {Array.from({ length: 128 }).map((_, i) => {
              const active = i < busLoad * 128;
              const wavelength = 1530 + i * 0.8; // C-band wavelengths
              return (
                <motion.div
                  key={i}
                  className={`h-8 rounded-sm ${active ? 'bg-gradient-to-t' : 'bg-muted'}`}
                  style={{
                    background: active 
                      ? `linear-gradient(to top, hsl(${200 + i}, 70%, 50%), hsl(${200 + i}, 70%, 70%))`
                      : undefined
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: active ? 1 : 0.3 }}
                  transition={{ delay: i * 0.01 }}
                  title={`λ = ${wavelength.toFixed(1)}nm`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1530nm (C-band start)</span>
            <span>1550nm (Center)</span>
            <span>1565nm (C-band end)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PhotonChipVisualization;
