import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Frame, Check, Truck, Info, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FrameOption {
  id: string;
  name: string;
  color: string;
  colorHex: string;
  price: number;
  description: string;
}

interface FrameAddOnProps {
  selectedSize: string;
  onFrameSelect: (frame: FrameOption | null) => void;
  selectedFrame: FrameOption | null;
  framedItemCount: number; // Track framed items in cart for free shipping
}

const FRAME_OPTIONS: FrameOption[] = [
  {
    id: 'natural',
    name: 'Natural Wood',
    color: 'Natural',
    colorHex: '#D4A574',
    price: 45,
    description: 'Warm, organic finish that complements any decor',
  },
  {
    id: 'black',
    name: 'Classic Black',
    color: 'Black',
    colorHex: '#1A1A1A',
    price: 45,
    description: 'Timeless elegance for modern and traditional spaces',
  },
  {
    id: 'white',
    name: 'Gallery White',
    color: 'White',
    colorHex: '#F5F5F5',
    price: 45,
    description: 'Clean, museum-quality presentation',
  },
  {
    id: 'walnut',
    name: 'Rich Walnut',
    color: 'Walnut',
    colorHex: '#5D4037',
    price: 55,
    description: 'Premium dark wood with sophisticated grain',
  },
  {
    id: 'gold',
    name: 'Champagne Gold',
    color: 'Gold',
    colorHex: '#D4AF37',
    price: 65,
    description: 'Luxurious metallic finish for statement pieces',
  },
];

// Extra shipping for framed orders (waived at 3+ framed items)
const FRAME_SHIPPING_COST = 12.99;
const FREE_SHIPPING_THRESHOLD = 3;

export const FrameAddOn: React.FC<FrameAddOnProps> = ({
  selectedSize,
  onFrameSelect,
  selectedFrame,
  framedItemCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate if free shipping applies
  const qualifiesForFreeShipping = framedItemCount >= FREE_SHIPPING_THRESHOLD;
  const itemsUntilFreeShipping = FREE_SHIPPING_THRESHOLD - framedItemCount;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Frame className="h-5 w-5 text-primary" />
            <span className="font-medium">Add Matching Frame</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-accent/50 transition-colors">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">Premium wooden frames, ready to hang. Perfectly sized for your print.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Frames add {!qualifiesForFreeShipping ? `$${FRAME_SHIPPING_COST} shipping` : 'FREE shipping'} (heavier package).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Frame selection toggle */}
        <div className="flex gap-2">
          <Button
            variant={selectedFrame === null ? "default" : "outline"}
            size="sm"
            onClick={() => onFrameSelect(null)}
            className="flex-1"
          >
            No Frame
          </Button>
          <Button
            variant={selectedFrame !== null ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (selectedFrame === null) {
                onFrameSelect(FRAME_OPTIONS[0]);
              }
              setIsExpanded(true);
            }}
            className="flex-1 gap-2"
          >
            <Frame className="h-3 w-3" />
            Add Frame +${FRAME_OPTIONS[0].price}
          </Button>
        </div>

        {/* Frame options - expandable */}
        <AnimatePresence>
          {(selectedFrame !== null || isExpanded) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">Choose your frame style:</p>
                
                <div className="grid grid-cols-5 gap-2">
                  {FRAME_OPTIONS.map((frame) => {
                    const isSelected = selectedFrame?.id === frame.id;
                    
                    return (
                      <TooltipProvider key={frame.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onFrameSelect(frame)}
                              className={`
                                relative p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-1
                                ${isSelected 
                                  ? 'border-primary bg-primary/5 shadow-md' 
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }
                              `}
                            >
                              {/* Frame preview */}
                              <div 
                                className="w-8 h-8 rounded border-2 shadow-inner"
                                style={{ 
                                  borderColor: frame.colorHex,
                                  backgroundColor: frame.id === 'white' ? '#fafafa' : 'transparent',
                                }}
                              >
                                <div className="w-full h-full rounded-sm bg-gradient-to-br from-muted/50 to-muted" />
                              </div>
                              
                              <span className="text-[10px] font-medium text-center leading-tight">
                                {frame.color}
                              </span>
                              
                              {frame.price > 45 && (
                                <span className="text-[8px] text-primary">+${frame.price - 45}</span>
                              )}
                              
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                                >
                                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                </motion.div>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{frame.name}</p>
                            <p className="text-xs text-muted-foreground">{frame.description}</p>
                            <p className="text-xs font-bold mt-1">+${frame.price}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>

                {/* Shipping info for frames */}
                <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                  qualifiesForFreeShipping 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {qualifiesForFreeShipping ? (
                    <>
                      <Gift className="h-4 w-4" />
                      <span>
                        <span className="font-bold">FREE frame shipping!</span> You have {framedItemCount}+ framed prints.
                      </span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4" />
                      <span>
                        Frames add <span className="font-bold">${FRAME_SHIPPING_COST}</span> shipping.
                        {itemsUntilFreeShipping > 0 && (
                          <> Add <span className="font-bold">{itemsUntilFreeShipping} more</span> framed print{itemsUntilFreeShipping > 1 ? 's' : ''} for FREE shipping!</>
                        )}
                      </span>
                    </>
                  )}
                </div>

                {/* Price summary */}
                {selectedFrame && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Frame add-on:</span>
                    <span className="font-bold text-primary">+${selectedFrame.price}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export const FRAME_OPTIONS_EXPORT = FRAME_OPTIONS;
export const FRAME_SHIPPING_COST_EXPORT = FRAME_SHIPPING_COST;
export const FREE_SHIPPING_THRESHOLD_EXPORT = FREE_SHIPPING_THRESHOLD;

export default FrameAddOn;
