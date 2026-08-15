import React from 'react';

/**
 * Integrative step marker — instead of a standalone "How It Works" section,
 * these markers attach directly to the real interactive UI (uploader, palette
 * selector, print gallery) so first-time visitors learn the journey by doing it.
 */
export const StepMarker: React.FC<{
  number: string;
  title: string;
  description: string;
  className?: string;
}> = ({ number, title, description, className = '' }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-display text-sm font-bold text-primary">
      {number}
    </span>
    <div className="text-left">
      <p className="font-display text-sm uppercase tracking-wider text-foreground leading-tight">
        {title}
      </p>
      <p className="text-xs text-muted-foreground font-serif leading-snug">{description}</p>
    </div>
  </div>
);

export default StepMarker;
