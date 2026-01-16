/**
 * Territory Heatmap Component
 * Extracted from LiveColorLegend for modularity
 */

import React from 'react';
import { motion } from 'framer-motion';

interface TerritoryData {
  whiteControl: number[][];
  blackControl: number[][];
  maxWhite: number;
  maxBlack: number;
  whitePercent: number;
  blackPercent: number;
}

interface TerritoryHeatmapProps {
  territoryData: TerritoryData;
}

export const TerritoryControlBar: React.FC<{ whitePercent: number; blackPercent: number }> = ({
  whitePercent,
  blackPercent
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px]">
      <span className="text-sky-400 font-semibold">👑 White {whitePercent}%</span>
      <span className="text-rose-400 font-semibold">🖤 Black {blackPercent}%</span>
    </div>
    <div className="h-2 rounded-full overflow-hidden bg-muted/50 flex">
      <motion.div
        className="h-full bg-gradient-to-r from-sky-500 to-sky-400"
        initial={{ width: 0 }}
        animate={{ width: `${whitePercent}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.div
        className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
        initial={{ width: 0 }}
        animate={{ width: `${blackPercent}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  </div>
);

const HeatmapGrid: React.FC<{
  control: number[][];
  max: number;
  color: 'white' | 'black';
  label: string;
}> = ({ control, max, color, label }) => {
  const colorClass = color === 'white' ? 'text-sky-400' : 'text-rose-400';
  const rgbColor = color === 'white' ? '56, 189, 248' : '251, 113, 133';
  
  return (
    <div className="space-y-1">
      <span className={`text-[9px] ${colorClass} font-display uppercase tracking-wider`}>
        {label}
      </span>
      <div className="aspect-square grid grid-cols-8 gap-px bg-border/30 rounded overflow-hidden">
        {control.map((row, r) =>
          row.map((value, f) => {
            const intensity = value / max;
            return (
              <div
                key={`${color}-${r}-${f}`}
                className="aspect-square transition-colors"
                style={{
                  backgroundColor: intensity > 0 
                    ? `rgba(${rgbColor}, ${0.2 + intensity * 0.8})` 
                    : (r + f) % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                }}
                title={`${String.fromCharCode(97 + f)}${8 - r}: ${value} visits`}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const CombinedHeatmap: React.FC<{ territoryData: TerritoryData }> = ({ territoryData }) => (
  <div className="space-y-1">
    <span className="text-[9px] text-muted-foreground font-display uppercase tracking-wider">
      Combined Dominance
    </span>
    <div className="aspect-[2/1] grid grid-cols-8 gap-px bg-border/30 rounded overflow-hidden">
      {territoryData.whiteControl.map((row, r) =>
        row.map((wValue, f) => {
          const bValue = territoryData.blackControl[r][f];
          const total = wValue + bValue;
          
          if (total === 0) {
            return (
              <div
                key={`c-${r}-${f}`}
                className="aspect-square"
                style={{
                  backgroundColor: (r + f) % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
                }}
              />
            );
          }
          
          const whiteRatio = wValue / total;
          const contested = Math.min(wValue, bValue) / Math.max(wValue, bValue, 1);
          
          let color: string;
          if (contested > 0.5) {
            color = `rgba(168, 85, 247, ${0.4 + (total / (territoryData.maxWhite + territoryData.maxBlack)) * 0.6})`;
          } else if (whiteRatio > 0.5) {
            color = `rgba(56, 189, 248, ${0.3 + whiteRatio * 0.7})`;
          } else {
            color = `rgba(251, 113, 133, ${0.3 + (1 - whiteRatio) * 0.7})`;
          }
          
          return (
            <div
              key={`c-${r}-${f}`}
              className="aspect-square transition-colors"
              style={{ backgroundColor: color }}
              title={`${String.fromCharCode(97 + f)}${8 - r}: W:${wValue} B:${bValue}`}
            />
          );
        })
      )}
    </div>
    <div className="flex justify-center gap-3 text-[8px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-sky-400" /> White
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-purple-500" /> Contested
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-rose-400" /> Black
      </span>
    </div>
  </div>
);

export const TerritoryHeatmap: React.FC<TerritoryHeatmapProps> = ({ territoryData }) => (
  <div className="space-y-3">
    <TerritoryControlBar 
      whitePercent={territoryData.whitePercent} 
      blackPercent={territoryData.blackPercent} 
    />
    
    <div className="grid grid-cols-2 gap-2">
      <HeatmapGrid 
        control={territoryData.whiteControl} 
        max={territoryData.maxWhite} 
        color="white" 
        label="White Control" 
      />
      <HeatmapGrid 
        control={territoryData.blackControl} 
        max={territoryData.maxBlack} 
        color="black" 
        label="Black Control" 
      />
    </div>
    
    <CombinedHeatmap territoryData={territoryData} />
  </div>
);

export default TerritoryHeatmap;
