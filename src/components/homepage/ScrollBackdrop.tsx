import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const LAYERS = ['/brand/hero.jpg', '/brand/import.jpg', '/brand/hall.jpg'];

/**
 * Fixed full-page En Pensent artwork that cross-fades as the page scrolls.
 * Layout never moves; only the artwork changes with scroll progress.
 */
const ScrollBackdrop: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add('ep-palette-bg');
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      document.documentElement.classList.remove('ep-palette-bg');
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  const pos = progress * (LAYERS.length - 1);

  return createPortal(
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black" aria-hidden="true">
      {LAYERS.map((src, i) => {
        const opacity = Math.max(0, 1 - Math.abs(pos - i));
        return (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${src})`, opacity, transition: 'opacity 150ms linear' }}
          />
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/65" />
    </div>,
    document.body,
  );
};

export default ScrollBackdrop;
