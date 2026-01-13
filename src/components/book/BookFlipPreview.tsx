import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import actual spread preview images
import spread1 from '@/assets/book/spread-preview-1.png';
import spread2 from '@/assets/book/spread-preview-2.png';
import spread3 from '@/assets/book/spread-preview-3.png';
import frontCover from '@/assets/book/carlsen-cover-v2.jpg';
import backCover from '@/assets/book/carlsen-back-cover.jpg';

type PageType = 'cover' | 'spread' | 'back';

interface PageData {
  id: number;
  type: PageType;
  image: string;
  title: string;
  year?: string;
  opponent?: string;
  pageNumber?: number;
}

// Sample pages including covers
const BOOK_PAGES: PageData[] = [
  {
    id: 0,
    type: 'cover',
    image: frontCover,
    title: "Front Cover",
  },
  {
    id: 1,
    type: 'spread',
    image: spread1,
    title: "Breaking the Wall",
    year: "2016",
    opponent: "Sergey Karjakin",
    pageNumber: 6,
  },
  {
    id: 2,
    type: 'spread',
    image: spread2,
    title: "The 136-Move Epic",
    year: "2021",
    opponent: "Ian Nepomniachtchi",
    pageNumber: 10,
  },
  {
    id: 3,
    type: 'spread',
    image: spread3,
    title: "The Berlin Endgame",
    year: "2013",
    opponent: "Viswanathan Anand",
    pageNumber: 14,
  },
  {
    id: 4,
    type: 'back',
    image: backCover,
    title: "Back Cover",
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
    if (isFlipping || currentPage >= BOOK_PAGES.length - 1) return;
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
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const page = BOOK_PAGES[currentPage];
  const isCover = page.type === 'cover' || page.type === 'back';

  const getPageLabel = () => {
    if (page.type === 'cover') return 'Front Cover';
    if (page.type === 'back') return 'Back Cover';
    return `Spread ${currentPage} of 3`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Book container with realistic perspective */}
      <div 
        className="relative mx-auto"
        style={{ 
          perspective: '1500px',
          maxWidth: '100%',
        }}
      >
        {/* Ambient shadow */}
        <div className="absolute inset-x-4 bottom-0 h-8 bg-black/20 blur-xl rounded-full transform translate-y-4" />
        
        {/* Open book container */}
        <div 
          className={`relative rounded-lg shadow-2xl overflow-hidden ${
            isCover 
              ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
              : 'bg-gradient-to-b from-amber-100 to-amber-50'
          }`}
          style={{ 
            transformStyle: 'preserve-3d',
            transform: 'rotateX(5deg)',
          }}
        >
          {/* Book binding/spine shadow - only for spreads */}
          {!isCover && (
            <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 z-10 shadow-inner" />
          )}
          
          {/* Page content area */}
          <div className="relative">
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
                  rotateY: { type: 'spring', stiffness: 200, damping: 25 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                }}
                className="relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Image */}
                <div className="relative">
                  <img 
                    src={page.image}
                    alt={page.title}
                    className={`w-full h-auto block ${
                      isCover ? 'aspect-[3/4] object-contain mx-auto py-4' : ''
                    }`}
                    style={{ 
                      aspectRatio: isCover ? '3/4' : '16/9',
                      objectFit: isCover ? 'contain' : 'cover',
                      maxHeight: isCover ? '500px' : 'auto',
                    }}
                  />
                  
                  {/* Page texture overlay - only for spreads */}
                  {!isCover && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
                      
                      {/* Paper grain texture */}
                      <div 
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                      />
                      
                      {/* Center binding shadow */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none" />
                    </>
                  )}
                  
                  {/* Cover badge overlay */}
                  {page.type === 'cover' && (
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                        100 Masterpieces
                      </span>
                    </div>
                  )}
                  
                  {/* Back cover info */}
                  {page.type === 'back' && (
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="inline-block bg-slate-800/80 text-amber-200 text-xs font-medium px-4 py-2 rounded-full">
                        Premium Hardcover • Museum-Quality Print
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Game info bar - only for spreads */}
                {page.type === 'spread' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-12">
                    <div className="flex items-end justify-between text-white">
                      <div>
                        <p className="text-xs uppercase tracking-wider opacity-70 mb-1">
                          Game #{page.id} • Page {page.pageNumber}
                        </p>
                        <h3 className="font-serif text-lg font-bold">
                          {page.title}
                        </h3>
                        <p className="text-sm opacity-80">
                          vs {page.opponent} • {page.year}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-60">
                        <BookOpen className="w-3 h-3" />
                        <span>En Pensent Visualization</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Page corners curl effect - only for spreads */}
          {!isCover && (
            <>
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-lg pointer-events-none" 
                   style={{ boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.05)' }} />
              <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-amber-50 to-transparent rounded-br-lg pointer-events-none"
                   style={{ boxShadow: 'inset -2px 2px 6px rgba(0,0,0,0.05)' }} />
            </>
          )}
        </div>
      </div>
      
      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={prevPage}
          disabled={currentPage === 0 || isFlipping}
          className="h-12 w-12 rounded-full border-amber-300 bg-white hover:bg-amber-50 disabled:opacity-30 shadow-md"
        >
          <ChevronLeft className="h-6 w-6 text-amber-700" />
        </Button>
        
        {/* Page indicators */}
        <div className="flex items-center gap-3">
          {BOOK_PAGES.map((pageData, index) => (
            <button
              key={index}
              onClick={() => {
                if (isFlipping) return;
                setDirection(index > currentPage ? 1 : -1);
                setIsFlipping(true);
                setCurrentPage(index);
              }}
              className={`transition-all duration-300 rounded-sm ${
                index === currentPage 
                  ? 'w-8 h-3 bg-amber-600' 
                  : pageData.type === 'cover' || pageData.type === 'back'
                    ? 'w-3 h-3 bg-amber-500/60 hover:bg-amber-500'
                    : 'w-3 h-3 bg-amber-300 hover:bg-amber-400'
              }`}
              title={pageData.type === 'cover' ? 'Front Cover' : pageData.type === 'back' ? 'Back Cover' : pageData.title}
            />
          ))}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={nextPage}
          disabled={currentPage === BOOK_PAGES.length - 1 || isFlipping}
          className="h-12 w-12 rounded-full border-amber-300 bg-white hover:bg-amber-50 disabled:opacity-30 shadow-md"
        >
          <ChevronRight className="h-6 w-6 text-amber-700" />
        </Button>
      </div>
      
      {/* Page count indicator */}
      <p className="text-center text-sm text-amber-700 mt-4 font-medium">
        {getPageLabel()}
        <span className="text-amber-500 font-normal"> • 100 spreads in full book</span>
      </p>
    </div>
  );
};

export default BookFlipPreview;
