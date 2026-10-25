import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getPaletteArt, getPaletteDisplayName } from '@/lib/marketplace/paletteArtMap';

interface PaletteBackdropProps {
  paletteId?: string;
}

/**
 * Full-page themed background for official En Pensent palettes.
 * Fixed behind the page so the layout never moves; switching palettes
 * only cross-fades the artwork. Includes a small gold "En Pensent" tag.
 */
const PaletteBackdrop: React.FC<PaletteBackdropProps> = ({ paletteId }) => {
  const art = getPaletteArt(paletteId);
  const name = getPaletteDisplayName(paletteId);

  useEffect(() => {
    if (!art) return;
    document.documentElement.classList.add('ep-palette-bg');
    return () => document.documentElement.classList.remove('ep-palette-bg');
  }, [art]);

  if (!art || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div
          key={paletteId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${art})` }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />
      <div className="fixed bottom-3 left-3 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-display">
        <span
          style={{
            background: 'linear-gradient(135deg, #F5D77A, #D4AF37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          En Pensent · Intrinsic Palette{name ? ` · ${name}` : ''}
        </span>
      </div>
    </div>,
    document.body,
  );
};

export default PaletteBackdrop;
