import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import logo from '@/assets/en-pensent-logo-new.png';

interface ArtisticQRCodeProps {
  url: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  small: { qr: 48, logo: 12, container: 'p-1', text: 'text-[4px]' },
  medium: { qr: 64, logo: 16, container: 'p-1.5', text: 'text-[5px]' },
  large: { qr: 80, logo: 20, container: 'p-2', text: 'text-[6px]' },
};

export const ArtisticQRCode = ({ 
  url, 
  size = 'small',
  showLabel = true,
  className = ''
}: ArtisticQRCodeProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const config = sizeConfig[size];

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: config.qr * 2, // 2x for retina
      margin: 0,
      color: {
        dark: '#D4AF37', // Brand gold
        light: '#00000000' // Transparent
      },
      errorCorrectionLevel: 'H' // High - allows for logo overlay
    }).then(setQrDataUrl).catch(console.error);
  }, [url, config.qr]);

  if (!qrDataUrl) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-primary/10 blur-md rounded-lg" />
      
      {/* QR Container with glass effect */}
      <div className={`relative bg-black/70 backdrop-blur-sm rounded-lg ${config.container} border border-primary/20`}>
        {/* QR Code */}
        <div className="relative">
          <img 
            src={qrDataUrl} 
            alt="Scan to view digital version"
            style={{ width: config.qr, height: config.qr }}
            className="block"
          />
          
          {/* Logo overlay in center of QR */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <div 
              className="rounded-full bg-black border border-primary/40 flex items-center justify-center overflow-hidden"
              style={{ width: config.logo, height: config.logo }}
            >
              <img 
                src={logo} 
                alt="En Pensent" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* Subtle label */}
        {showLabel && (
          <p className={`${config.text} text-primary/50 text-center mt-0.5 font-display tracking-widest uppercase`}>
            Scan
          </p>
        )}
      </div>
    </div>
  );
};

export default ArtisticQRCode;
