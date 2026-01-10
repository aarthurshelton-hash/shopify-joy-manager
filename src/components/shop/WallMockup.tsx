import React from 'react';

interface WallMockupProps {
  sizeLabel: string;
  className?: string;
}

// Size configurations with relative frame sizes for the mockup
const sizeConfigs: Record<string, { width: number; height: number; label: string }> = {
  '8" x 10"': { width: 40, height: 50, label: '8×10"' },
  '11" x 14"': { width: 55, height: 70, label: '11×14"' },
  '12" x 16"': { width: 60, height: 80, label: '12×16"' },
  '16" x 20"': { width: 80, height: 100, label: '16×20"' },
  '18" x 24"': { width: 90, height: 120, label: '18×24"' },
  '24" x 36"': { width: 120, height: 180, label: '24×36"' },
};

// Find matching size config
const findSizeConfig = (label: string) => {
  const normalized = label.toLowerCase().replace(/\s/g, '');
  for (const [key, value] of Object.entries(sizeConfigs)) {
    if (normalized.includes(key.toLowerCase().replace(/\s/g, '')) || 
        normalized.includes(key.replace(/"/g, '').replace(/\s/g, ''))) {
      return value;
    }
  }
  // Default to medium size
  return { width: 60, height: 80, label: label };
};

export const WallMockup: React.FC<WallMockupProps> = ({ sizeLabel, className = '' }) => {
  const config = findSizeConfig(sizeLabel);
  
  // Scale factor for the mockup (max frame height ~100px for the popup)
  const scale = 100 / 180; // Normalize to largest size
  const frameWidth = config.width * scale;
  const frameHeight = config.height * scale;
  
  return (
    <div className={`relative ${className}`}>
      {/* Wall background */}
      <div 
        className="relative w-[200px] h-[140px] rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #E8E4DF 0%, #D4CFC8 50%, #C8C2BA 100%)',
        }}
      >
        {/* Subtle wall texture */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Shadow on wall */}
        <div 
          className="absolute rounded-sm"
          style={{
            width: frameWidth + 8,
            height: frameHeight + 8,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '4px 6px 12px rgba(0,0,0,0.25), 2px 3px 6px rgba(0,0,0,0.15)',
            background: 'transparent',
          }}
        />
        
        {/* Frame */}
        <div 
          className="absolute bg-stone-800 rounded-sm"
          style={{
            width: frameWidth + 8,
            height: frameHeight + 8,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: 'inset 0 0 0 2px #3d3d3d, inset 0 0 0 4px #2a2a2a',
          }}
        >
          {/* Inner mat */}
          <div 
            className="absolute bg-[#F5F3F0] rounded-[1px]"
            style={{
              width: frameWidth,
              height: frameHeight,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Art placeholder */}
            <div 
              className="absolute rounded-[1px] overflow-hidden"
              style={{
                width: frameWidth - 8,
                height: frameHeight - 8,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(135deg, #FAFAF9 0%, #F0EFED 100%)',
              }}
            >
              {/* Mini chess board representation */}
              <div className="absolute inset-1 grid grid-cols-4 grid-rows-4 opacity-40">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`${(Math.floor(i / 4) + i) % 2 === 0 ? 'bg-stone-200' : 'bg-stone-400'}`}
                  />
                ))}
              </div>
              {/* Color dots to represent piece movements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-amber-500" />
                  <div className="w-1 h-1 rounded-full bg-rose-500" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        {/* Small plant */}
        <div className="absolute bottom-2 right-4">
          <div className="w-3 h-4 bg-emerald-700/60 rounded-full" />
          <div className="w-2 h-2 bg-stone-500/60 rounded-sm mx-auto -mt-0.5" />
        </div>
        
        {/* Furniture line */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-stone-600/20" />
      </div>
      
      {/* Size label */}
      <div className="absolute -bottom-5 left-0 right-0 text-center">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {config.label}
        </span>
      </div>
    </div>
  );
};

export default WallMockup;
