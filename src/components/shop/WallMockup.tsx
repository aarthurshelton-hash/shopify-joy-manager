import React from 'react';

export type RoomSetting = 'living' | 'office' | 'gallery';

interface WallMockupProps {
  sizeLabel: string;
  roomSetting: RoomSetting;
  visualizationElement?: React.ReactNode;
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

// Room setting configurations
const roomConfigs: Record<RoomSetting, {
  wallColor: string;
  wallTexture: string;
  shadowIntensity: number;
  furniture: 'couch' | 'desk' | 'bench';
  accent: string;
}> = {
  living: {
    wallColor: 'linear-gradient(180deg, #E8E4DF 0%, #DDD8D2 50%, #D4CFC8 100%)',
    wallTexture: '0.2',
    shadowIntensity: 0.2,
    furniture: 'couch',
    accent: '#8B7355',
  },
  office: {
    wallColor: 'linear-gradient(180deg, #E5E7EB 0%, #D1D5DB 50%, #C8CCD2 100%)',
    wallTexture: '0.15',
    shadowIntensity: 0.25,
    furniture: 'desk',
    accent: '#4A5568',
  },
  gallery: {
    wallColor: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 50%, #EFEFEF 100%)',
    wallTexture: '0.05',
    shadowIntensity: 0.15,
    furniture: 'bench',
    accent: '#1A1A1A',
  },
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
  return { width: 60, height: 80, label: label };
};

export const WallMockup: React.FC<WallMockupProps> = ({ 
  sizeLabel, 
  roomSetting,
  visualizationElement,
  className = '' 
}) => {
  const config = findSizeConfig(sizeLabel);
  const room = roomConfigs[roomSetting];
  
  // Scale factor for the mockup
  const scale = 100 / 180;
  const frameWidth = config.width * scale;
  const frameHeight = config.height * scale;
  
  return (
    <div className={`relative ${className}`}>
      {/* Room scene */}
      <div 
        className="relative w-[280px] h-[180px] rounded-lg overflow-hidden shadow-lg"
        style={{ background: room.wallColor }}
      >
        {/* Wall texture overlay */}
        <div 
          className="absolute inset-0"
          style={{
            opacity: parseFloat(room.wallTexture),
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Ambient lighting effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)',
          }}
        />
        
        {/* Frame shadow on wall */}
        <div 
          className="absolute rounded-sm blur-sm"
          style={{
            width: frameWidth + 12,
            height: frameHeight + 12,
            left: '50%',
            top: '42%',
            transform: 'translate(-48%, -48%)',
            background: `rgba(0,0,0,${room.shadowIntensity})`,
          }}
        />
        
        {/* Frame with depth */}
        <div 
          className="absolute rounded-[2px]"
          style={{
            width: frameWidth + 10,
            height: frameHeight + 10,
            left: '50%',
            top: '40%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 50%, #0D0D0D 100%)',
            boxShadow: `
              inset 1px 1px 0 rgba(255,255,255,0.1),
              inset -1px -1px 0 rgba(0,0,0,0.3),
              3px 4px 8px rgba(0,0,0,0.3),
              1px 2px 4px rgba(0,0,0,0.2)
            `,
          }}
        >
          {/* Inner mat/border */}
          <div 
            className="absolute"
            style={{
              width: frameWidth + 4,
              height: frameHeight + 4,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#F8F6F3',
              boxShadow: 'inset 0 0 2px rgba(0,0,0,0.1)',
            }}
          >
            {/* Artwork area */}
            <div 
              className="absolute overflow-hidden"
              style={{
                width: frameWidth - 2,
                height: frameHeight - 2,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#FAFAF9',
              }}
            >
              {visualizationElement ? (
                <div className="w-full h-full flex items-center justify-center">
                  {visualizationElement}
                </div>
              ) : (
                /* Placeholder chess pattern */
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-30">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`${(Math.floor(i / 4) + i) % 2 === 0 ? 'bg-stone-200' : 'bg-stone-400'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Furniture based on room type */}
        {room.furniture === 'couch' && (
          <>
            {/* Modern couch */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[180px]">
              {/* Back cushions */}
              <div className="flex justify-center gap-1 mb-[-2px]">
                <div 
                  className="w-[55px] h-[18px] rounded-t-lg"
                  style={{ background: `linear-gradient(180deg, ${room.accent} 0%, #6B5344 100%)` }}
                />
                <div 
                  className="w-[55px] h-[18px] rounded-t-lg"
                  style={{ background: `linear-gradient(180deg, ${room.accent} 0%, #6B5344 100%)` }}
                />
                <div 
                  className="w-[55px] h-[18px] rounded-t-lg"
                  style={{ background: `linear-gradient(180deg, ${room.accent} 0%, #6B5344 100%)` }}
                />
              </div>
              {/* Seat */}
              <div 
                className="w-full h-[12px] rounded-t-sm"
                style={{ background: `linear-gradient(180deg, #7A6349 0%, ${room.accent} 100%)` }}
              />
              {/* Base/legs hint */}
              <div className="flex justify-between px-4">
                <div className="w-2 h-2 bg-stone-900 rounded-sm" />
                <div className="w-2 h-2 bg-stone-900 rounded-sm" />
              </div>
            </div>
            {/* Side table */}
            <div className="absolute bottom-[28px] right-8">
              <div className="w-[20px] h-[2px] bg-stone-700 rounded-full" />
              <div className="w-[2px] h-[14px] bg-stone-800 mx-auto" />
            </div>
            {/* Plant */}
            <div className="absolute bottom-[28px] left-10">
              <div className="w-[14px] h-[18px] bg-emerald-700/80 rounded-full" />
              <div className="w-[8px] h-[6px] bg-stone-600 mx-auto rounded-sm -mt-1" />
            </div>
          </>
        )}
        
        {room.furniture === 'desk' && (
          <>
            {/* Modern desk */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160px]">
              {/* Desktop */}
              <div 
                className="w-full h-[6px] rounded-t-sm"
                style={{ background: 'linear-gradient(180deg, #5C4A3A 0%, #4A3C30 100%)' }}
              />
              {/* Legs */}
              <div className="flex justify-between px-2">
                <div className="w-[4px] h-[16px] bg-stone-800" />
                <div className="w-[4px] h-[16px] bg-stone-800" />
              </div>
            </div>
            {/* Monitor */}
            <div className="absolute bottom-[22px] left-1/2 -translate-x-1/2">
              <div className="w-[40px] h-[26px] bg-stone-900 rounded-sm border border-stone-700" />
              <div className="w-[8px] h-[4px] bg-stone-800 mx-auto" />
              <div className="w-[16px] h-[2px] bg-stone-700 mx-auto rounded-full" />
            </div>
            {/* Chair hint */}
            <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2">
              <div className="w-[30px] h-[3px] bg-stone-700/50 rounded-full" />
            </div>
            {/* Lamp */}
            <div className="absolute bottom-[22px] right-12">
              <div className="w-[10px] h-[2px] bg-amber-200/80 rounded-full" />
              <div className="w-[2px] h-[12px] bg-stone-700 mx-auto" />
            </div>
          </>
        )}
        
        {room.furniture === 'bench' && (
          <>
            {/* Gallery bench */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div 
                className="w-[80px] h-[8px] rounded-sm"
                style={{ background: 'linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%)' }}
              />
              {/* Legs */}
              <div className="flex justify-between px-2">
                <div className="w-[3px] h-[8px] bg-stone-900" />
                <div className="w-[3px] h-[8px] bg-stone-900" />
              </div>
            </div>
            {/* Spot light effect */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[60px]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,250,240,0.15) 0%, transparent 100%)',
              }}
            />
            {/* Gallery track lighting hint */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-stone-300/30" />
          </>
        )}
        
        {/* Floor line */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ 
            background: roomSetting === 'gallery' 
              ? 'linear-gradient(90deg, #E0E0E0, #D0D0D0, #E0E0E0)'
              : 'linear-gradient(90deg, #B8A898, #A89888, #B8A898)'
          }}
        />
      </div>
      
      {/* Size label */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className="text-xs font-display font-medium text-foreground uppercase tracking-wider">
          {config.label}
        </span>
      </div>
    </div>
  );
};

export default WallMockup;
