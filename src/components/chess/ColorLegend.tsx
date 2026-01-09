import React from 'react';
import { getPieceColorLegend } from '@/lib/chess/pieceColors';

const ColorLegend: React.FC = () => {
  const legend = getPieceColorLegend();
  
  // Group by piece color
  const whitePieces = legend.filter(p => p.color === 'w');
  const blackPieces = legend.filter(p => p.color === 'b');
  
  return (
    <div className="flex flex-col gap-5 p-6 bg-card rounded-lg border border-border/50">
      <h3 className="font-display text-sm font-semibold text-center tracking-wide">
        Color Legend
      </h3>
      
      <div className="space-y-5">
        {/* White pieces - Cold theme */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <span className="text-[10px] font-sans font-medium text-sky-400 uppercase tracking-widest">
              ❄️ White — Cold
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {whitePieces.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded shadow-sm"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-lg">{item.symbol}</span>
                <span className="text-xs text-muted-foreground font-serif">{item.name.replace('White ', '')}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Black pieces - Hot theme */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <span className="text-[10px] font-sans font-medium text-rose-400 uppercase tracking-widest">
              🔥 Black — Hot
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {blackPieces.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded shadow-sm"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-lg">{item.symbol}</span>
                <span className="text-xs text-muted-foreground font-serif">{item.name.replace('Black ', '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
