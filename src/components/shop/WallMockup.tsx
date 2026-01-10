import React from 'react';

export type RoomSetting = 'living' | 'office' | 'gallery';

interface WallMockupProps {
  sizeLabel: string;
  roomSetting: RoomSetting;
  visualizationElement?: React.ReactNode;
  className?: string;
}

// Size configurations - dimensions in inches, scaled to mockup proportions
// Base wall is ~10 feet wide (120 inches), mockup is 320px wide
// Scale: 320px / 120in = 2.67px per inch
const SCALE = 2.67;

const sizeConfigs: Record<string, { width: number; height: number; label: string }> = {
  '8" x 10"': { width: 8 * SCALE, height: 10 * SCALE, label: '8×10"' },
  '11" x 14"': { width: 11 * SCALE, height: 14 * SCALE, label: '11×14"' },
  '12" x 16"': { width: 12 * SCALE, height: 16 * SCALE, label: '12×16"' },
  '16" x 20"': { width: 16 * SCALE, height: 20 * SCALE, label: '16×20"' },
  '18" x 24"': { width: 18 * SCALE, height: 24 * SCALE, label: '18×24"' },
  '24" x 36"': { width: 24 * SCALE, height: 36 * SCALE, label: '24×36"' },
};

const roomConfigs: Record<RoomSetting, {
  wallGradient: string;
  floorColor: string;
  baseboardColor: string;
  shadowOpacity: number;
}> = {
  living: {
    wallGradient: 'linear-gradient(180deg, #E8E2DC 0%, #DED8D2 40%, #D4CEC8 100%)',
    floorColor: '#8B7355',
    baseboardColor: '#F5F2EF',
    shadowOpacity: 0.25,
  },
  office: {
    wallGradient: 'linear-gradient(180deg, #E8EAF0 0%, #DEE0E6 40%, #D4D6DC 100%)',
    floorColor: '#5C5C5C',
    baseboardColor: '#FFFFFF',
    shadowOpacity: 0.2,
  },
  gallery: {
    wallGradient: 'linear-gradient(180deg, #FEFEFE 0%, #F8F8F8 40%, #F2F2F2 100%)',
    floorColor: '#C8C8C8',
    baseboardColor: '#FFFFFF',
    shadowOpacity: 0.12,
  },
};

const findSizeConfig = (label: string) => {
  const normalized = label.toLowerCase().replace(/\s/g, '');
  for (const [key, value] of Object.entries(sizeConfigs)) {
    if (normalized.includes(key.toLowerCase().replace(/\s/g, '')) || 
        normalized.includes(key.replace(/"/g, '').replace(/\s/g, ''))) {
      return value;
    }
  }
  return { width: 12 * SCALE, height: 16 * SCALE, label: label };
};

export const WallMockup: React.FC<WallMockupProps> = ({ 
  sizeLabel, 
  roomSetting,
  visualizationElement,
  className = '' 
}) => {
  const config = findSizeConfig(sizeLabel);
  const room = roomConfigs[roomSetting];
  
  const frameWidth = config.width;
  const frameHeight = config.height;
  const frameThickness = 4;
  const matWidth = 3;
  
  return (
    <div className={`relative group ${className}`}>
      {/* Room scene - 10ft wide x 8ft tall wall */}
      <div 
        className="relative w-[320px] h-[220px] rounded-lg overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.03] group-hover:shadow-xl cursor-pointer"
        style={{ background: room.wallGradient }}
      >
        {/* Subtle wall texture */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Ambient light from above */}
        {roomSetting === 'gallery' && (
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[100px] pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,252,245,0.2) 0%, transparent 100%)',
            }}
          />
        )}
        
        {/* Frame shadow */}
        <div 
          className="absolute rounded-[1px]"
          style={{
            width: frameWidth + frameThickness * 2 + 6,
            height: frameHeight + frameThickness * 2 + 8,
            left: '50%',
            top: '45%',
            transform: 'translate(-48%, -48%)',
            background: `rgba(0,0,0,${room.shadowOpacity})`,
            filter: 'blur(6px)',
          }}
        />
        
        {/* Frame outer edge */}
        <div 
          className="absolute"
          style={{
            width: frameWidth + frameThickness * 2,
            height: frameHeight + frameThickness * 2,
            left: '50%',
            top: '45%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(145deg, #1F1F1F 0%, #0A0A0A 50%, #151515 100%)',
            boxShadow: `
              inset 1px 1px 0 rgba(255,255,255,0.08),
              inset -1px -1px 0 rgba(0,0,0,0.5),
              2px 3px 6px rgba(0,0,0,0.3)
            `,
            borderRadius: '1px',
          }}
        >
          {/* Mat/mount */}
          <div 
            className="absolute"
            style={{
              width: frameWidth,
              height: frameHeight,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#FAF9F7',
              boxShadow: 'inset 0 0 1px rgba(0,0,0,0.15)',
            }}
          >
            {/* Artwork area */}
            <div 
              className="absolute overflow-hidden bg-[#FAFAF9]"
              style={{
                width: frameWidth - matWidth * 2,
                height: frameHeight - matWidth * 2,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {visualizationElement ? (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ transform: 'scale(1)', transformOrigin: 'center' }}
                >
                  {React.cloneElement(visualizationElement as React.ReactElement, {
                    size: Math.min(frameWidth - matWidth * 2, frameHeight - matWidth * 2) - 2
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="grid grid-cols-8 grid-rows-8 opacity-30"
                    style={{ 
                      width: Math.min(frameWidth - matWidth * 2, frameHeight - matWidth * 2) - 4,
                      height: Math.min(frameWidth - matWidth * 2, frameHeight - matWidth * 2) - 4,
                    }}
                  >
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`${(Math.floor(i / 8) + i) % 2 === 0 ? 'bg-stone-200' : 'bg-stone-400'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* === LIVING ROOM FURNITURE === */}
        {roomSetting === 'living' && (
          <>
            {/* Hardwood floor */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-[35px]"
              style={{ 
                background: `linear-gradient(180deg, ${room.floorColor} 0%, #705C45 100%)`,
              }}
            >
              {/* Floor boards */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border-r border-black/10"
                    style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                  />
                ))}
              </div>
            </div>
            
            {/* Baseboard */}
            <div 
              className="absolute bottom-[35px] left-0 right-0 h-[6px]"
              style={{ 
                background: room.baseboardColor,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            />
            
            {/* Modern sofa */}
            <div className="absolute bottom-[35px] left-1/2 -translate-x-1/2">
              {/* Sofa back */}
              <div 
                className="relative w-[140px] h-[28px] rounded-t-[4px]"
                style={{ background: 'linear-gradient(180deg, #6B5B4F 0%, #5A4A3E 100%)' }}
              >
                {/* Back cushion texture */}
                <div className="absolute inset-x-2 top-2 bottom-1 flex gap-1">
                  <div className="flex-1 rounded-t-sm bg-black/5" />
                  <div className="flex-1 rounded-t-sm bg-black/5" />
                  <div className="flex-1 rounded-t-sm bg-black/5" />
                </div>
              </div>
              {/* Seat cushions */}
              <div 
                className="relative w-[150px] h-[14px] -mt-[2px] rounded-t-[2px] mx-auto flex gap-[2px] px-1"
                style={{ background: 'linear-gradient(180deg, #7A6A5E 0%, #6B5B4F 100%)' }}
              >
                <div className="flex-1 rounded-sm bg-white/5 mt-1" />
                <div className="flex-1 rounded-sm bg-white/5 mt-1" />
                <div className="flex-1 rounded-sm bg-white/5 mt-1" />
              </div>
              {/* Sofa base */}
              <div className="w-[150px] h-[4px] bg-[#3D3228]" />
              {/* Legs */}
              <div className="flex justify-between px-3 -mt-[1px]">
                <div className="w-[6px] h-[6px] bg-[#2A231C] rounded-sm" />
                <div className="w-[6px] h-[6px] bg-[#2A231C] rounded-sm" />
              </div>
            </div>
            
            {/* Side table with lamp */}
            <div className="absolute bottom-[35px] right-[30px]">
              {/* Table top */}
              <div className="w-[24px] h-[3px] bg-[#4A3C30] rounded-sm shadow-sm" />
              {/* Table leg */}
              <div className="w-[3px] h-[20px] bg-[#3D3228] mx-auto" />
              <div className="w-[14px] h-[2px] bg-[#3D3228] mx-auto rounded-full" />
              {/* Lamp */}
              <div className="absolute -top-[22px] left-1/2 -translate-x-1/2">
                <div className="w-[16px] h-[12px] bg-gradient-to-b from-[#F5F0E8] to-[#E8E0D5] rounded-t-full border border-[#D4CCC0]" />
                <div className="w-[3px] h-[8px] bg-[#8B7355] mx-auto" />
              </div>
            </div>
            
            {/* Potted plant */}
            <div className="absolute bottom-[35px] left-[25px]">
              {/* Leaves */}
              <div className="relative w-[20px] h-[24px]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[8px] h-[18px] bg-[#4A7C59] rounded-full rotate-[-8deg]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-[80%] w-[7px] h-[15px] bg-[#5A8C69] rounded-full rotate-[-25deg]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-[20%] w-[7px] h-[16px] bg-[#3A6C49] rounded-full rotate-[20deg]" />
              </div>
              {/* Pot */}
              <div className="w-[14px] h-[10px] bg-gradient-to-b from-[#C4A07A] to-[#A8876A] mx-auto rounded-b-[3px]" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }} />
            </div>
            
            {/* Throw pillow on sofa */}
            <div 
              className="absolute bottom-[53px] left-[115px] w-[12px] h-[10px] rounded-[2px] rotate-[-10deg]"
              style={{ background: 'linear-gradient(135deg, #C9A86C 0%, #B8975B 100%)' }}
            />
          </>
        )}
        
        {/* === OFFICE FURNITURE === */}
        {roomSetting === 'office' && (
          <>
            {/* Carpet/floor */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-[30px]"
              style={{ background: `linear-gradient(180deg, ${room.floorColor} 0%, #4A4A4A 100%)` }}
            />
            
            {/* Baseboard */}
            <div 
              className="absolute bottom-[30px] left-0 right-0 h-[5px]"
              style={{ background: room.baseboardColor, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
            />
            
            {/* Modern desk */}
            <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2">
              {/* Desktop surface */}
              <div 
                className="w-[180px] h-[6px] rounded-t-[1px]"
                style={{ 
                  background: 'linear-gradient(180deg, #F5F0EB 0%, #E8E0D8 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                }}
              />
              {/* Desk legs */}
              <div className="flex justify-between px-4">
                <div className="w-[4px] h-[22px] bg-[#2A2A2A]" />
                <div className="w-[4px] h-[22px] bg-[#2A2A2A]" />
              </div>
            </div>
            
            {/* Monitor */}
            <div className="absolute bottom-[56px] left-1/2 -translate-x-1/2">
              {/* Screen */}
              <div 
                className="w-[50px] h-[30px] rounded-[2px] border-2 border-[#1A1A1A] bg-[#0F0F0F]"
                style={{ boxShadow: 'inset 0 0 10px rgba(100,150,255,0.1)' }}
              >
                <div className="w-full h-full bg-gradient-to-br from-[#1a2030] to-[#0a1020] rounded-[1px]" />
              </div>
              {/* Stand neck */}
              <div className="w-[6px] h-[6px] bg-[#2A2A2A] mx-auto" />
              {/* Stand base */}
              <div className="w-[20px] h-[3px] bg-[#2A2A2A] mx-auto rounded-full" />
            </div>
            
            {/* Keyboard */}
            <div className="absolute bottom-[36px] left-1/2 -translate-x-1/2">
              <div className="w-[35px] h-[10px] bg-[#2A2A2A] rounded-[2px]" />
            </div>
            
            {/* Office chair back (visible behind desk) */}
            <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2">
              <div 
                className="w-[40px] h-[35px] rounded-t-[8px] -mb-[12px]"
                style={{ background: 'linear-gradient(180deg, #1A1A1A 0%, #2A2A2A 100%)' }}
              />
            </div>
            
            {/* Desk lamp */}
            <div className="absolute bottom-[56px] right-[55px]">
              <div className="w-[14px] h-[3px] bg-[#1A1A1A] rounded-full transform -rotate-12" />
              <div className="w-[2px] h-[16px] bg-[#2A2A2A] ml-[3px] transform rotate-[15deg] origin-bottom" />
              <div className="w-[8px] h-[2px] bg-[#2A2A2A] rounded-full" />
            </div>
            
            {/* Books/papers stack */}
            <div className="absolute bottom-[36px] left-[85px]">
              <div className="w-[18px] h-[3px] bg-[#4A6B8A] rounded-sm" />
              <div className="w-[16px] h-[2px] bg-[#8B4A4A] rounded-sm -mt-[1px] ml-[1px]" />
              <div className="w-[17px] h-[2px] bg-[#4A8B6B] rounded-sm -mt-[1px]" />
            </div>
          </>
        )}
        
        {/* === GALLERY FURNITURE === */}
        {roomSetting === 'gallery' && (
          <>
            {/* Polished concrete floor */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-[28px]"
              style={{ 
                background: `linear-gradient(180deg, ${room.floorColor} 0%, #B0B0B0 100%)`,
              }}
            >
              {/* Floor reflection */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-full"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)' }}
              />
            </div>
            
            {/* Subtle baseboard */}
            <div 
              className="absolute bottom-[28px] left-0 right-0 h-[3px]"
              style={{ background: '#E8E8E8' }}
            />
            
            {/* Gallery bench */}
            <div className="absolute bottom-[28px] left-1/2 -translate-x-1/2">
              {/* Bench seat - leather/upholstered */}
              <div 
                className="w-[90px] h-[12px] rounded-[2px]"
                style={{ 
                  background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {/* Tufted detail */}
                <div className="flex justify-around pt-1">
                  <div className="w-[3px] h-[3px] rounded-full bg-black/20" />
                  <div className="w-[3px] h-[3px] rounded-full bg-black/20" />
                  <div className="w-[3px] h-[3px] rounded-full bg-black/20" />
                </div>
              </div>
              {/* Bench legs */}
              <div className="flex justify-between px-2">
                <div className="w-[3px] h-[10px] bg-[#1A1A1A]" />
                <div className="w-[3px] h-[10px] bg-[#1A1A1A]" />
              </div>
            </div>
            
            {/* Track lighting */}
            <div className="absolute top-[3px] left-0 right-0">
              <div className="h-[4px] bg-gradient-to-b from-[#E0E0E0] to-[#D0D0D0]" />
              {/* Spotlight */}
              <div className="absolute top-[4px] left-1/2 -translate-x-1/2">
                <div className="w-[8px] h-[10px] bg-[#1A1A1A] rounded-b-full" />
              </div>
            </div>
            
            {/* Information placard */}
            <div className="absolute bottom-[65px] right-[40px]">
              <div className="w-[25px] h-[15px] bg-white border border-[#E0E0E0] shadow-sm" />
            </div>
          </>
        )}
      </div>
      
      {/* Size label */}
      <div className="absolute -bottom-7 left-0 right-0 text-center">
        <span className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">
          {config.label}
        </span>
      </div>
    </div>
  );
};

export default WallMockup;
