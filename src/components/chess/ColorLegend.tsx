import React from 'react';
import { getPieceColorLegend } from '@/lib/chess/pieceColors';

const ColorLegend: React.FC = () => {
  const legend = getPieceColorLegend();
  
  // Group by piece color
  const whitePieces = legend.filter(p => p.color === 'w');
  const blackPieces = legend.filter(p => p.color === 'b');
  
  return (
    <div className="flex flex-col gap-4 p-5 bg-card rounded-xl border shadow-sm">
      <h3 className="text-sm font-bold text-center uppercase tracking-widest">
        Piece Colors
      </h3>
      
      <div className="space-y-4">
        {/* White pieces - Cold theme */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-1 border-b">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              ❄️ White — Cold
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {whitePieces.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md shadow-sm border border-white/20"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-sm">{item.symbol}</span>
                <span className="text-xs text-muted-foreground">{item.name.replace('White ', '')}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Black pieces - Hot theme */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-1 border-b">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
              🔥 Black — Hot
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {blackPieces.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md shadow-sm border border-white/20"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-sm">{item.symbol}</span>
                <span className="text-xs text-muted-foreground">{item.name.replace('Black ', '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
