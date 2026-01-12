import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sample page previews - these would come from actual generated spreads
const SAMPLE_PAGES = [
  {
    id: 1,
    title: "The Immortal Game",
    year: "2013",
    opponent: "Sergey Karjakin",
    preview: "A masterpiece of positional chess with stunning sacrifices.",
  },
  {
    id: 2,
    title: "Opera House Attack",
    year: "2014",
    opponent: "Viswanathan Anand",
    preview: "World Championship brilliance with the Norwegian star.",
  },
  {
    id: 3,
    title: "Endgame Mastery",
    year: "2016",
    opponent: "Wesley So",
    preview: "A clinic in technical endgame technique.",
  },
  {
    id: 4,
    title: "The Berlin Wall",
    year: "2018",
    opponent: "Fabiano Caruana",
    preview: "Defending against the world's top challenger.",
  },
  {
    id: 5,
    title: "Tactical Fireworks",
    year: "2019",
    opponent: "Ding Liren",
    preview: "Explosive combinations against China's best.",
  },
];

interface BookFlipPreviewProps {
  className?: string;
}

export const BookFlipPreview: React.FC<BookFlipPreviewProps> = ({ className = '' }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const nextPage = () => {
    if (isFlipping || currentPage >= SAMPLE_PAGES.length - 1) return;
    setDirection(1);
    setIsFlipping(true);
    setCurrentPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (isFlipping || currentPage <= 0) return;
    setDirection(-1);
    setIsFlipping(true);
    setCurrentPage((prev) => prev - 1);
  };

  const pageVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
      transformOrigin: direction > 0 ? 'left center' : 'right center',
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      transformOrigin: 'center center',
    },
    exit: (direction: number) => ({
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
      transformOrigin: direction > 0 ? 'right center' : 'left center',
    }),
  };

  const page = SAMPLE_PAGES[currentPage];

  return (
    <div className={`relative ${className}`}>
      {/* Book container with 3D perspective */}
      <div 
        className="relative mx-auto"
        style={{ 
          perspective: '1200px',
          maxWidth: '320px',
        }}
      >
        {/* Book shadow */}
        <div className="absolute inset-0 translate-y-4 bg-gradient-to-b from-amber-900/20 to-amber-900/5 rounded-lg blur-xl" />
        
        {/* Book spine */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-800 to-amber-700 rounded-l-sm shadow-inner z-10" />
        
        {/* Page container */}
        <div 
          className="relative ml-3 bg-gradient-to-br from-amber-50 via-cream-50 to-orange-50 rounded-r-lg overflow-hidden shadow-2xl border border-amber-200"
          style={{ 
            transformStyle: 'preserve-3d',
            minHeight: '400px',
          }}
        >
          {/* Page texture overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMDMiLz48L3N2Zz4=')] opacity-50" />
          
          <AnimatePresence 
            mode="wait" 
            custom={direction}
            onExitComplete={() => setIsFlipping(false)}
          >
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                rotateY: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="p-6 relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Left page - Visualization preview */}
              <div className="mb-4">
                <div className="aspect-square bg-gradient-to-br from-blue-600 via-purple-500 to-red-500 rounded-lg shadow-lg relative overflow-hidden">
                  {/* Simulated chess visualization pattern */}
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-30">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`${(Math.floor(i / 8) + i % 8) % 2 === 0 ? 'bg-white/20' : 'bg-black/20'}`}
                      />
                    ))}
                  </div>
                  
                  {/* Heat map simulation */}
                  <div className="absolute inset-0 bg-gradient-radial from-orange-400/40 via-transparent to-blue-400/40" />
                  
                  {/* Page number */}
                  <div className="absolute bottom-2 right-2 text-white/80 text-xs font-mono">
                    {(currentPage + 1) * 2 - 1}
                  </div>
                </div>
              </div>
              
              {/* Right page - Game info */}
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-600 uppercase tracking-wider">Game #{page.id}</span>
                </div>
                
                <h3 className="font-serif text-xl font-bold text-amber-900">
                  {page.title}
                </h3>
                
                <p className="text-sm text-amber-700">
                  vs {page.opponent} • {page.year}
                </p>
                
                <p className="text-xs text-amber-600/80 italic leading-relaxed">
                  {page.preview}
                </p>
                
                {/* Haiku placeholder */}
                <div className="pt-3 border-t border-amber-200/50">
                  <p className="text-xs text-amber-700/70 font-serif italic leading-relaxed">
                    Pieces dance like flames<br />
                    Strategy blooms on the board<br />
                    Victory awaits
                  </p>
                </div>
                
                {/* Page number */}
                <p className="text-xs text-amber-500 font-mono pt-2">
                  {(currentPage + 1) * 2}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Page curl effect */}
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-amber-100 to-transparent rounded-bl-lg shadow-inner pointer-events-none" />
        </div>
      </div>
      
      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={prevPage}
          disabled={currentPage === 0 || isFlipping}
          className="h-10 w-10 rounded-full border-amber-300 hover:bg-amber-50 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5 text-amber-700" />
        </Button>
        
        {/* Page indicators */}
        <div className="flex items-center gap-2">
          {SAMPLE_PAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (isFlipping) return;
                setDirection(index > currentPage ? 1 : -1);
                setIsFlipping(true);
                setCurrentPage(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentPage 
                  ? 'bg-amber-600 scale-125' 
                  : 'bg-amber-300 hover:bg-amber-400'
              }`}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={nextPage}
          disabled={currentPage === SAMPLE_PAGES.length - 1 || isFlipping}
          className="h-10 w-10 rounded-full border-amber-300 hover:bg-amber-50 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5 text-amber-700" />
        </Button>
      </div>
      
      {/* Page count */}
      <p className="text-center text-xs text-amber-600 mt-2">
        Preview {currentPage + 1} of {SAMPLE_PAGES.length} • 100 spreads in full book
      </p>
    </div>
  );
};

export default BookFlipPreview;