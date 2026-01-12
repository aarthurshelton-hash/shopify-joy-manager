import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface CartItemThumbnailProps {
  previewImage?: string;
  productImage?: string;
  gameTitle?: string;
  frameStyle?: string;
  isActive?: boolean;
}

// Frame color configurations for mini mockup
const frameColors: Record<string, { gradient: string; shadow: string }> = {
  'natural': {
    gradient: 'linear-gradient(145deg, #E8D4B8 0%, #C4A77D 30%, #B8956E 70%, #A88560 100%)',
    shadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  'black': {
    gradient: 'linear-gradient(145deg, #2A2A2A 0%, #0A0A0A 30%, #1A1A1A 70%, #0F0F0F 100%)',
    shadow: '0 2px 4px rgba(0,0,0,0.4)',
  },
  'white': {
    gradient: 'linear-gradient(145deg, #FFFFFF 0%, #F0F0F0 30%, #E8E8E8 70%, #FAFAFA 100%)',
    shadow: '0 2px 4px rgba(0,0,0,0.15)',
  },
  'walnut': {
    gradient: 'linear-gradient(145deg, #6B4423 0%, #5D3A1A 30%, #4A2F15 70%, #3D2610 100%)',
    shadow: '0 2px 4px rgba(0,0,0,0.4)',
  },
  'gold': {
    gradient: 'linear-gradient(145deg, #F5E6C8 0%, #D4AF37 30%, #C5A028 70%, #B8941F 100%)',
    shadow: '0 2px 4px rgba(180,140,30,0.3)',
  },
};

// Parse frame style ID from variant title
const parseFrameId = (frameStyle?: string): string | null => {
  if (!frameStyle) return null;
  const lower = frameStyle.toLowerCase();
  if (lower.includes('natural')) return 'natural';
  if (lower.includes('black')) return 'black';
  if (lower.includes('white')) return 'white';
  if (lower.includes('walnut')) return 'walnut';
  if (lower.includes('gold') || lower.includes('champagne')) return 'gold';
  return 'black'; // Default frame
};

export const CartItemThumbnail: React.FC<CartItemThumbnailProps> = ({
  previewImage,
  productImage,
  gameTitle,
  frameStyle,
  isActive = false,
}) => {
  const frameId = parseFrameId(frameStyle);
  const hasFrame = !!frameId;
  const frameConfig = frameId ? frameColors[frameId] : null;

  // Framed version with mini wall mockup effect
  if (hasFrame && previewImage && frameConfig) {
    return (
      <div 
        className={`w-14 h-14 rounded-md overflow-hidden flex-shrink-0 relative flex items-center justify-center ${
          isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        }`}
        style={{
          background: 'linear-gradient(180deg, #E8E2DC 0%, #D4CEC8 100%)',
        }}
      >
        {/* Frame with visualization inside */}
        <div
          className="relative flex items-center justify-center"
          style={{
            background: frameConfig.gradient,
            boxShadow: frameConfig.shadow,
            padding: '3px',
            borderRadius: '1px',
          }}
        >
          {/* Mat/inner border */}
          <div
            style={{
              background: '#FAFAFA',
              padding: '1px',
            }}
          >
            {/* Print visualization */}
            <img
              src={previewImage}
              alt={gameTitle || 'Chess Vision'}
              className="w-8 h-10 object-cover"
              style={{
                display: 'block',
              }}
            />
          </div>
        </div>
        
        {/* Active indicator glow */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none rounded-md ring-2 ring-primary/50 animate-pulse" />
        )}
      </div>
    );
  }

  // Standard version (no frame) - clean print preview
  return (
    <div 
      className={`w-14 h-14 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0 relative border border-border/50 ${
        isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
    >
      {previewImage ? (
        <img
          src={previewImage}
          alt={gameTitle || 'Chess Vision'}
          className="w-full h-full object-cover"
        />
      ) : productImage ? (
        <img
          src={productImage}
          alt="Product"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      
      {/* Active indicator glow */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none rounded-md ring-2 ring-primary/50 animate-pulse" />
      )}
    </div>
  );
};

export default CartItemThumbnail;
