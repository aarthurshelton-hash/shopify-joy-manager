import React, { useMemo } from 'react';
import { getLifestyleForPalette } from '@/lib/lifestyleImages';
import { cn } from '@/lib/utils';

interface LifestyleStripProps {
  paletteId?: string;
  count?: number;
  heading?: string;
  subheading?: string;
  className?: string;
}

const LifestyleStrip: React.FC<LifestyleStripProps> = ({ paletteId, count = 3, heading, subheading, className }) => {
  const images = useMemo(() => getLifestyleForPalette(paletteId, count), [paletteId, count]);
  if (images.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {heading && (
        <div className="text-center">
          <h4 className="font-display text-sm tracking-wide text-foreground">{heading}</h4>
          {subheading && <p className="text-xs text-muted-foreground font-serif mt-0.5">{subheading}</p>}
        </div>
      )}
      <div className={cn('grid gap-2 items-start', count === 1 ? 'grid-cols-1' : count === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
        {images.map((img, i) => (
          <figure
            key={img.id}
            className={cn(
              'relative overflow-hidden rounded-lg border border-border/50',
              count === 3 && i === 0 && 'col-span-2 sm:col-span-1'
            )}
          >
            <img src={img.src} alt={img.title} loading="lazy" className="block h-auto w-full" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-[10px] text-white font-display tracking-wide truncate">
              {img.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
};

export default LifestyleStrip;
