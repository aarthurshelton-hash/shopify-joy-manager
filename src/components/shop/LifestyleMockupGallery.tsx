import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, Frame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import product mockups using actual PrintReadyVisualization
import naturalFrameCanvas from '@/assets/mockups/natural-frame-canvas.jpg';
import blackFrameProduct from '@/assets/mockups/black-frame-product.jpg';
import whiteFrameLifestyle from '@/assets/mockups/white-frame-lifestyle.jpg';
import walnutFrameDetail from '@/assets/mockups/walnut-frame-detail.jpg';
import goldFrameOffice from '@/assets/mockups/gold-frame-office.jpg';
import unframedCanvasLean from '@/assets/mockups/unframed-canvas-lean.jpg';
import canvasMacroCloseup from '@/assets/mockups/canvas-macro-closeup.jpg';
import handsCanvasPrint from '@/assets/mockups/hands-canvas-print.jpg';

// Import lifestyle room mockups
import bedroomNaturalFrame from '@/assets/mockups/bedroom-natural-frame.jpg';
import restaurantBlackFrame from '@/assets/mockups/restaurant-black-frame.jpg';
import galleryWallCollection from '@/assets/mockups/gallery-wall-collection.jpg';
import hotelLobbyGold from '@/assets/mockups/hotel-lobby-gold.jpg';
import studioLoftCanvas from '@/assets/mockups/studio-loft-canvas.jpg';
import libraryWalnutFrame from '@/assets/mockups/library-walnut-frame.jpg';

export interface MockupImage {
  id: string;
  src: string;
  title: string;
  setting: string;
  frame?: string;
  mood: string;
  description: string;
}

export const lifestyleMockups: MockupImage[] = [
  // Product-focused mockups
  {
    id: 'natural-frame-canvas',
    src: naturalFrameCanvas,
    title: 'Natural Wood Frame',
    setting: 'Wall Display',
    frame: 'Natural Wood',
    mood: 'Warm & Inviting',
    description: 'Premium canvas print in natural oak frame showing visible canvas texture and warm gallery lighting',
  },
  {
    id: 'black-frame-product',
    src: blackFrameProduct,
    title: 'Classic Black Frame',
    setting: 'Product Shot',
    frame: 'Classic Black',
    mood: 'Modern Elegance',
    description: 'Sleek matte black frame with canvas print, studio lighting highlighting canvas weave and clean frame lines',
  },
  {
    id: 'white-frame-lifestyle',
    src: whiteFrameLifestyle,
    title: 'Gallery White Frame',
    setting: 'Living Room',
    frame: 'Gallery White',
    mood: 'Contemporary',
    description: 'Clean white frame in elegant living space with natural light reflecting off premium canvas surface',
  },
  {
    id: 'walnut-frame-detail',
    src: walnutFrameDetail,
    title: 'Rich Walnut Frame',
    setting: 'Dark Background',
    frame: 'Rich Walnut',
    mood: 'Luxurious',
    description: 'Deep walnut wood grain frame with studio lighting showcasing print quality and craftsmanship',
  },
  {
    id: 'gold-frame-office',
    src: goldFrameOffice,
    title: 'Champagne Gold Frame',
    setting: 'Modern Office',
    frame: 'Champagne Gold',
    mood: 'Premium',
    description: 'Elegant champagne gold frame in luxury office setting with metallic shimmer and canvas texture visible',
  },
  {
    id: 'unframed-canvas-lean',
    src: unframedCanvasLean,
    title: 'Unframed Canvas',
    setting: 'Leaning Display',
    mood: 'Artist Studio',
    description: 'Gallery-wrapped canvas print leaning against wall showing wrapped edges, thickness and canvas material quality',
  },
  {
    id: 'canvas-macro-closeup',
    src: canvasMacroCloseup,
    title: 'Canvas Texture Detail',
    setting: 'Macro Close-up',
    mood: 'Material Quality',
    description: 'Extreme macro showing individual canvas threads, ink saturation and archival print quality',
  },
  {
    id: 'hands-canvas-print',
    src: handsCanvasPrint,
    title: 'Canvas in Hand',
    setting: 'Product Demo',
    mood: 'Authentic Scale',
    description: 'Hands holding the canvas print showing thickness, wrapped edges and real-world scale',
  },
  // Lifestyle room mockups
  {
    id: 'bedroom-natural-frame',
    src: bedroomNaturalFrame,
    title: 'Bedroom Sanctuary',
    setting: 'Modern Bedroom',
    frame: 'Natural Wood',
    mood: 'Peaceful',
    description: 'Print as bedroom centerpiece above the bed with soft morning light illuminating the artwork',
  },
  {
    id: 'restaurant-black-frame',
    src: restaurantBlackFrame,
    title: 'Fine Dining',
    setting: 'Restaurant',
    frame: 'Classic Black',
    mood: 'Sophisticated',
    description: 'Upscale restaurant with exposed brick, warm ambient lighting highlighting the framed art',
  },
  {
    id: 'gallery-wall-collection',
    src: galleryWallCollection,
    title: 'Gallery Collection',
    setting: 'Art Gallery',
    frame: 'Gallery White',
    mood: 'Museum Quality',
    description: 'Multiple prints displayed in professional gallery setting with museum lighting',
  },
  {
    id: 'hotel-lobby-gold',
    src: hotelLobbyGold,
    title: 'Luxury Hotel',
    setting: 'Hotel Lobby',
    frame: 'Champagne Gold',
    mood: 'Prestigious',
    description: 'Grand hotel lobby with marble surfaces and the gold-framed print as a statement piece',
  },
  {
    id: 'studio-loft-canvas',
    src: studioLoftCanvas,
    title: 'Artist Loft',
    setting: 'Creative Studio',
    mood: 'Artistic',
    description: 'Industrial loft workspace with large canvas print, natural light through warehouse windows',
  },
  {
    id: 'library-walnut-frame',
    src: libraryWalnutFrame,
    title: 'Private Library',
    setting: 'Home Study',
    frame: 'Rich Walnut',
    mood: 'Scholarly',
    description: 'Classic study with dark wood bookshelves and the walnut-framed print as focal art',
  },
];

interface LifestyleMockupGalleryProps {
  className?: string;
  compact?: boolean;
  showTitle?: boolean;
  maxImages?: number;
  autoplay?: boolean;
  onImageClick?: (mockup: MockupImage) => void;
}

const LifestyleMockupGallery: React.FC<LifestyleMockupGalleryProps> = ({
  className,
  compact = false,
  showTitle = true,
  maxImages,
  autoplay = false,
  onImageClick,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const displayMockups = maxImages ? lifestyleMockups.slice(0, maxImages) : lifestyleMockups;

  // Autoplay for carousel mode
  React.useEffect(() => {
    if (!autoplay || selectedIndex !== null) return;
    
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % displayMockups.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay, selectedIndex, displayMockups.length]);

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? displayMockups.length - 1 : selectedIndex - 1);
    } else {
      setActiveIndex(activeIndex === 0 ? displayMockups.length - 1 : activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === displayMockups.length - 1 ? 0 : selectedIndex + 1);
    } else {
      setActiveIndex(activeIndex === displayMockups.length - 1 ? 0 : activeIndex + 1);
    }
  };

  if (compact) {
    // Compact carousel mode for homepage/banners
    return (
      <div className={cn("relative overflow-hidden rounded-xl", className)}>
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <AnimatePresence mode="wait">
            <motion.img
              key={displayMockups[activeIndex].id}
              src={displayMockups[activeIndex].src}
              alt={displayMockups[activeIndex].title}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            />
          </AnimatePresence>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* Content overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-white font-display text-lg md:text-xl font-bold">
                {displayMockups[activeIndex].title}
              </h3>
              <div className="flex items-center gap-2">
                {displayMockups[activeIndex].frame && (
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    <Frame className="h-3 w-3 mr-1" />
                    {displayMockups[activeIndex].frame}
                  </Badge>
                )}
                <Badge className="bg-primary/80 text-primary-foreground text-xs">
                  {displayMockups[activeIndex].mood}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {displayMockups.map((_, i) => (
              <button
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  i === activeIndex ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                )}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full gallery grid mode
  return (
    <div className={cn("space-y-4", className)}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">See Your Art in Any Space</h2>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {displayMockups.map((mockup, index) => (
          <motion.div
            key={mockup.id}
            className="group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer bg-muted"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (onImageClick) {
                onImageClick(mockup);
              } else {
                setSelectedIndex(index);
              }
            }}
          >
            <img
              src={mockup.src}
              alt={mockup.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Info on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="text-white text-sm font-medium">{mockup.title}</div>
              {mockup.frame && (
                <div className="text-white/70 text-xs mt-0.5">{mockup.frame} Frame</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            <motion.div
              className="relative max-w-5xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/10"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <div className="relative">
                <img
                  src={displayMockups[selectedIndex].src}
                  alt={displayMockups[selectedIndex].title}
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
                
                {/* Navigation arrows */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white bg-black/30 hover:bg-black/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-white bg-black/30 hover:bg-black/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
              
              {/* Caption */}
              <div className="mt-4 text-center text-white">
                <h3 className="text-xl font-display font-bold">{displayMockups[selectedIndex].title}</h3>
                <p className="text-white/70 mt-1">{displayMockups[selectedIndex].description}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {displayMockups[selectedIndex].frame && (
                    <Badge className="bg-white/20 border-white/30">
                      <Frame className="h-3 w-3 mr-1" />
                      {displayMockups[selectedIndex].frame}
                    </Badge>
                  )}
                  <Badge variant="secondary">{displayMockups[selectedIndex].mood}</Badge>
                </div>
              </div>
              
              {/* Thumbnail strip */}
              <div className="flex items-center justify-center gap-2 mt-4 overflow-x-auto py-2">
                {displayMockups.map((mockup, i) => (
                  <button
                    key={mockup.id}
                    className={cn(
                      "w-16 h-12 rounded-md overflow-hidden flex-shrink-0 transition-all",
                      i === selectedIndex 
                        ? "ring-2 ring-white ring-offset-2 ring-offset-black" 
                        : "opacity-50 hover:opacity-75"
                    )}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <img
                      src={mockup.src}
                      alt={mockup.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LifestyleMockupGallery;
