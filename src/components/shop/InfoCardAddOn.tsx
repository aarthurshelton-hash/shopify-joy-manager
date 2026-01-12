import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Info, Crown, Sparkles, Lock, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisionInfoCardPreview } from './VisionInfoCardPreview';
import { SquareData } from '@/lib/chess/gameSimulator';
import { MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';

interface InfoCardAddOnProps {
  isPremium: boolean;
  onAddInfoCard: (include: boolean) => void;
  includeInfoCard: boolean;
  onUpgradePremium?: () => void;
  // Preview data props
  board?: SquareData[][];
  gameData?: {
    white?: string;
    black?: string;
    event?: string;
    date?: string;
    result?: string;
  };
  moveHistory?: MoveHistoryEntry[];
  totalMoves?: number;
  whitePalette?: Record<string, string>;
  blackPalette?: Record<string, string>;
  darkMode?: boolean;
}

// Price for the physical info card add-on
const INFO_CARD_PRICE = 9.99;

export const InfoCardAddOn: React.FC<InfoCardAddOnProps> = ({
  isPremium,
  onAddInfoCard,
  includeInfoCard,
  onUpgradePremium,
  board,
  gameData,
  moveHistory,
  totalMoves = 0,
  whitePalette,
  blackPalette,
  darkMode = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Allow preview if we have palettes (even without board, we can show a sample)
  const canPreview = whitePalette && blackPalette;

  return (
    <>
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-medium text-sm">Vision Data Card</span>
                <p className="text-[10px] text-muted-foreground">Printed companion piece</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Preview Button */}
              {canPreview && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/10"
                        onClick={() => setShowPreview(true)}
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Preview your Vision Card</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => setShowDetails(!showDetails)}
                      className="p-1 rounded-full hover:bg-accent/50 transition-colors"
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm font-medium">Vision Data Card</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A beautiful 3.5×2" printed card with all the game data, color legend, 
                      piece statistics, and territory analysis from your visualization.
                    </p>
                    <p className="text-xs text-primary mt-1 font-medium">
                      Perfect for including with your print order!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Preview of what's included */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
                  <p className="font-medium">Includes:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Full color legend with piece activity stats
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Territory control analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Game phase timeline breakdown
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      MVP piece highlight
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Premium matte 3.5×2" cardstock
                    </li>
                  </ul>
                  
                  {/* Preview button in details */}
                  {canPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      className="w-full mt-2 gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      Preview Your Card
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isPremium ? (
            <div className="flex gap-2">
              <Button
                variant={!includeInfoCard ? "default" : "outline"}
                size="sm"
                onClick={() => onAddInfoCard(false)}
                className="flex-1"
              >
                No Card
              </Button>
              <Button
                variant={includeInfoCard ? "default" : "outline"}
                size="sm"
                onClick={() => onAddInfoCard(true)}
                className="flex-1 gap-2"
              >
                {includeInfoCard && <Check className="h-3 w-3" />}
                Add Card +${INFO_CARD_PRICE}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onUpgradePremium}
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Lock className="h-3 w-3" />
              <span>Visionary Exclusive</span>
              <Crown className="h-3 w-3" />
            </Button>
          )}

          {/* Always show Preview Button when we have palette data */}
          {canPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="w-full gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
            >
              <Eye className="h-4 w-4 text-primary" />
              Preview Your Vision Card
            </Button>
          )}

          {/* Price display */}
          {includeInfoCard && isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between pt-2 border-t"
            >
              <span className="text-sm text-muted-foreground">Info Card add-on:</span>
              <span className="font-bold text-primary">+${INFO_CARD_PRICE}</span>
            </motion.div>
          )}

          {/* Premium upsell for free users */}
          {!isPremium && (
            <p className="text-[10px] text-muted-foreground text-center">
              Upgrade to Visionary Premium to unlock this collector's add-on
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Vision Data Card Preview
            </DialogTitle>
          </DialogHeader>
          
          {canPreview && whitePalette && blackPalette && (
            <VisionInfoCardPreview
              board={board}
              gameData={gameData}
              moveHistory={moveHistory}
              totalMoves={totalMoves || 50}
              whitePalette={whitePalette}
              blackPalette={blackPalette}
              darkMode={darkMode}
              showSpecs={true}
            />
          )}
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="flex-1"
            >
              Close
            </Button>
            {isPremium && !includeInfoCard && (
              <Button
                onClick={() => {
                  onAddInfoCard(true);
                  setShowPreview(false);
                }}
                className="flex-1 gap-2"
              >
                <Check className="h-4 w-4" />
                Add to Order +${INFO_CARD_PRICE}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const INFO_CARD_PRICE_EXPORT = INFO_CARD_PRICE;

export default InfoCardAddOn;
