/**
 * Photonic Coherence Panel
 * 
 * Visualizes the photonic computing architecture's state,
 * including channel coherence, entanglement, and glitch detection.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Sparkles, Radio, Waves, Zap, Eye, Activity } from 'lucide-react';
import {
  photonicEngine,
  DOMAIN_WAVELENGTHS,
  PhotonicDomain
} from '@/lib/pensent-core/architecture/photonicComputing';

interface PhotonicSummary {
  globalCoherence: number;
  entanglementStrength: number;
  totalEnergy: number;
  dominantWavelength: number;
  dominantDomain: string;
  channelStates: Array<{
    domain: string;
    wavelength: number;
    amplitude: number;
    phase: number;
    coherence: number;
    color: string;
  }>;
  glitch: {
    detected: boolean;
    type: string | null;
    confidence: number;
    description: string;
  };
}

// Convert wavelength to visible color (HSL)
function wavelengthToColor(wavelength: number): string {
  // Map 380-850nm to hue 270-0 (violet to red to infrared)
  const normalized = Math.max(0, Math.min(1, (wavelength - 380) / 470));
  const hue = 270 - normalized * 300; // Wraps around through red
  return `hsl(${hue < 0 ? hue + 360 : hue}, 80%, 50%)`;
}

export function PhotonicCoherencePanel() {
  const [summary, setSummary] = useState<PhotonicSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(() => {
    // Inject some random signals to simulate activity
    const domains = Object.keys(DOMAIN_WAVELENGTHS) as PhotonicDomain[];
    domains.forEach(domain => {
      photonicEngine.injectSignal(domain, {
        amplitude: 0.3 + Math.random() * 0.7,
        phase: Math.random() * 2 * Math.PI,
        coherence: 0.5 + Math.random() * 0.5
      });
    });

    const state = photonicEngine.getUnifiedState();
    const glitch = photonicEngine.detectGlitchInMatrix();

    // Find dominant domain by wavelength
    let dominantDomain = 'unknown';
    let minDiff = Infinity;
    Object.entries(DOMAIN_WAVELENGTHS).forEach(([domain, wavelength]) => {
      const diff = Math.abs(wavelength - state.dominantWavelength);
      if (diff < minDiff) {
        minDiff = diff;
        dominantDomain = domain;
      }
    });

    const channelStates = Array.from(state.channels.values()).map(channel => ({
      domain: channel.domain,
      wavelength: channel.state.wavelength,
      amplitude: channel.state.amplitude,
      phase: channel.state.phase,
      coherence: channel.state.coherence,
      color: wavelengthToColor(channel.state.wavelength)
    })).sort((a, b) => a.wavelength - b.wavelength);

    setSummary({
      globalCoherence: state.globalCoherence,
      entanglementStrength: state.entanglementStrength,
      totalEnergy: state.totalEnergy,
      dominantWavelength: state.dominantWavelength,
      dominantDomain,
      channelStates,
      glitch: {
        detected: glitch.detected,
        type: glitch.type,
        confidence: glitch.confidence,
        description: glitch.description
      }
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [refreshData]);

  if (loading || !summary) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">Calibrating photonic channels...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20 overflow-hidden relative">
      {/* Glitch overlay when detected */}
      {summary.glitch.detected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 pointer-events-none z-10"
        />
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          Photonic Coherence
        </CardTitle>
        <CardDescription>
          Light-speed domain synchronization & quantum entanglement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Core Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Waves className="w-3 h-3 text-primary" />
              <p className="text-xs text-muted-foreground">Global Coherence</p>
            </div>
            <p className="text-2xl font-bold">{(summary.globalCoherence * 100).toFixed(1)}%</p>
            <Progress value={summary.globalCoherence * 100} className="h-1.5 mt-1" />
          </div>
          <div className="p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <p className="text-xs text-muted-foreground">Entanglement</p>
            </div>
            <p className="text-2xl font-bold">{(summary.entanglementStrength * 100).toFixed(1)}%</p>
            <Progress value={summary.entanglementStrength * 100} className="h-1.5 mt-1" />
          </div>
        </div>

        {/* Dominant Domain */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
          <span className="text-xs text-muted-foreground">Dominant Domain</span>
          <Badge 
            variant="outline" 
            style={{ borderColor: wavelengthToColor(summary.dominantWavelength) }}
          >
            {summary.dominantDomain.toUpperCase()}
            <span className="ml-1 text-[10px] opacity-70">{summary.dominantWavelength}nm</span>
          </Badge>
        </div>

        {/* Spectrum Visualization */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">Channel Spectrum</p>
          <div className="flex gap-0.5 h-8 rounded overflow-hidden">
            {summary.channelStates.map(channel => (
              <motion.div
                key={channel.domain}
                className="relative group"
                style={{ 
                  flex: channel.amplitude,
                  backgroundColor: channel.color,
                  opacity: 0.3 + channel.coherence * 0.7
                }}
                animate={{ 
                  opacity: [0.3 + channel.coherence * 0.7, 0.5 + channel.coherence * 0.5, 0.3 + channel.coherence * 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                title={`${channel.domain}: ${channel.wavelength}nm`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                    {channel.domain}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>UV (380nm)</span>
            <span>IR (850nm)</span>
          </div>
        </div>

        {/* Glitch Detection */}
        <motion.div
          className={`p-3 rounded-lg ${
            summary.glitch.detected 
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
              : 'bg-muted/30'
          }`}
          animate={summary.glitch.detected ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Eye className={`w-4 h-4 ${summary.glitch.detected ? 'text-purple-400' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">Matrix Glitch Detector</span>
            {summary.glitch.detected && (
              <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30">
                {summary.glitch.type}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.glitch.description}
          </p>
          {summary.glitch.detected && (
            <div className="flex items-center gap-2 mt-2">
              <Activity className="w-3 h-3 text-purple-400" />
              <Progress value={summary.glitch.confidence * 100} className="h-1 flex-1" />
              <span className="text-xs">{(summary.glitch.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
