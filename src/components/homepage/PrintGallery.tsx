import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Frame } from 'lucide-react';

import bedroomNaturalFrame from '@/assets/mockups/bedroom-natural-frame.jpg';
import blackFrameProduct from '@/assets/mockups/black-frame-product.jpg';
import canvasMacroCloseup from '@/assets/mockups/canvas-macro-closeup.jpg';
import galleryWallCollection from '@/assets/mockups/gallery-wall-collection.jpg';
import goldFrameOffice from '@/assets/mockups/gold-frame-office.jpg';
import hotelLobbyGold from '@/assets/mockups/hotel-lobby-gold.jpg';
import libraryWalnutFrame from '@/assets/mockups/library-walnut-frame.jpg';
import naturalFrameCanvas from '@/assets/mockups/natural-frame-canvas.jpg';
import restaurantBlackFrame from '@/assets/mockups/restaurant-black-frame.jpg';
import studioLoftCanvas from '@/assets/mockups/studio-loft-canvas.jpg';
import unframedCanvasLean from '@/assets/mockups/unframed-canvas-lean.jpg';
import whiteFrameLifestyle from '@/assets/mockups/white-frame-lifestyle.jpg';

const slides = [
  { src: galleryWallCollection, caption: 'Gallery Wall Collection' },
  { src: bedroomNaturalFrame, caption: 'Natural Frame — Bedroom' },
  { src: blackFrameProduct, caption: 'Black Frame' },
  { src: canvasMacroCloseup, caption: 'Canvas Macro Detail' },
  { src: goldFrameOffice, caption: 'Gold Frame — Office' },
  { src: hotelLobbyGold, caption: 'Gold Frame — Hotel Lobby' },
  { src: libraryWalnutFrame, caption: 'Walnut Frame — Library' },
  { src: naturalFrameCanvas, caption: 'Natural Frame Canvas' },
  { src: restaurantBlackFrame, caption: 'Black Frame — Restaurant' },
  { src: studioLoftCanvas, caption: 'Studio Loft Canvas' },
  { src: unframedCanvasLean, caption: 'Unframed Canvas' },
  { src: whiteFrameLifestyle, caption: 'White Frame Lifestyle' },
];

const PrintGallery: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setIndex(prev => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, paused]);

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-to-b from-background to-muted/20 py-12 md:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-display uppercase tracking-widest mb-3">
            <Frame className="h-3.5 w-3.5" />
            Museum-Quality Prints
          </div>
          <h2 className="text-2xl md:text-4xl font-royal font-bold tracking-wide text-foreground">
            Your Vision, Framed
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-serif mt-2 max-w-xl mx-auto">
            Archival paper, fade-resistant inks, and handcrafted frames — shipped worldwide.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <div className="relative h-[280px] sm:h-[400px] md:h-[480px] rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <img
                  src={slides[index].src}
                  alt={slides[index].caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <p className="text-white text-sm md:text-lg font-display tracking-wide drop-shadow-lg">
                    {slides[index].caption}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav arrows */}
          <button
            onClick={prev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white transition-colors z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white transition-colors z-10"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrintGallery;
