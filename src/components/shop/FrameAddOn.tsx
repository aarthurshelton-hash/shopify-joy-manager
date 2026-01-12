import React, { useState, useMemo } from 'react';
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
import {
  FRAME_STYLES,
  getFramePricesForSize,
  getBaseFramePrice,
  FRAME_SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  type FrameStyle,
} from '@/lib/shop/framePricing';

export interface FrameOption {
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
  framedItemCount: number;
}

export const FrameAddOn: React.FC<FrameAddOnProps> = ({
  selectedSize,
  onFrameSelect,
  selectedFrame,
  framedItemCount,
}) => {
  // Calculate dynamic prices based on selected size
  const frameOptions = useMemo(() => {
    return getFramePricesForSize(selectedSize);
  }, [selectedSize]);

  const basePrice = useMemo(() => {
    return getBaseFramePrice(selectedSize);
  }, [selectedSize]);
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
              if (selectedFrame === null && frameOptions.length > 0) {
                onFrameSelect(frameOptions[0]);
              }
              setIsExpanded(true);
            }}
            className="flex-1 gap-2"
          >
            <Frame className="h-3 w-3" />
            Add Frame +${basePrice.toFixed(2)}
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Choose your frame style:</p>
                  <p className="text-[10px] text-muted-foreground/70">Prices vary by size</p>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {frameOptions.map((frame) => {
                    const isSelected = selectedFrame?.id === frame.id;
                    const priceDiff = frame.price - basePrice;
                    
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
                              
                              {priceDiff > 0.5 && (
                                <span className="text-[8px] text-primary">+${priceDiff.toFixed(0)}</span>
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
                            <p className="text-xs font-bold mt-1">+${frame.price.toFixed(2)}</p>
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
                    <span className="text-sm text-muted-foreground">Frame add-on ({selectedSize}):</span>
                    <span className="font-bold text-primary">+${selectedFrame.price.toFixed(2)}</span>
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

// Re-export from pricing module for backward compatibility
export { FRAME_STYLES as FRAME_OPTIONS_EXPORT } from '@/lib/shop/framePricing';
export { FRAME_SHIPPING_COST as FRAME_SHIPPING_COST_EXPORT, FREE_SHIPPING_THRESHOLD as FREE_SHIPPING_THRESHOLD_EXPORT } from '@/lib/shop/framePricing';

export default FrameAddOn;
