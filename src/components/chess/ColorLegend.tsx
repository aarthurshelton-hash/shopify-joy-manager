import React from 'react';
import { getPieceColorLegend } from '@/lib/chess/pieceColors';

const ColorLegend: React.FC = () => {
  const legend = getPieceColorLegend();
  
  // Group by piece type
  const whitePieces = legend.filter(p => p.color === 'w');
  const blackPieces = legend.filter(p => p.color === 'b');
  
  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
      <h3 className="text-sm font-semibold text-center uppercase tracking-wide">
        Color Legend
      </h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* White pieces */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">White</p>
          {whitePieces.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-border"
                style={{ backgroundColor: item.hex }}
              />
              <span className="text-xs">{item.name.replace('White ', '')}</span>
            </div>
          ))}
        </div>
        
        {/* Black pieces */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Black</p>
          {blackPieces.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-sm border border-border"
                style={{ backgroundColor: item.hex }}
              />
              <span className="text-xs">{item.name.replace('Black ', '')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
