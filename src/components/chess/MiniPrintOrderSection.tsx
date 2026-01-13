import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Printer, ChevronRight, Frame, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WallMockup, RoomSetting, FrameStyleOption } from '@/components/shop/WallMockup';
import PrintReadyVisualization from './PrintReadyVisualization';
import { SquareData, GameData } from '@/lib/chess/gameSimulator';
import { FRAME_STYLES, getBaseFramePrice } from '@/lib/shop/framePricing';
import { useTimeline } from '@/contexts/TimelineContext';
import { useLegendHighlight } from '@/contexts/LegendHighlightContext';

interface ExportState {
  currentMove: number;
  lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
  compareMode: boolean;
  darkMode: boolean;
}

interface MiniPrintOrderSectionProps {
  board: SquareData[][];
  gameData: GameData;
  totalMoves: number;
  darkMode?: boolean;
  onOrderPrint?: (exportState: ExportState) => void;
  className?: string;
}

const MINI_FRAME_OPTIONS: FrameStyleOption[] = FRAME_STYLES.slice(0, 4).map(f => ({
  id: f.id,
  colorHex: f.color,
}));

export const MiniPrintOrderSection: React.FC<MiniPrintOrderSectionProps> = ({
  board,
  gameData,
  totalMoves,
  darkMode = false,
  onOrderPrint,
  className = '',
}) => {
  const { currentMove } = useTimeline();
  const { lockedPieces, compareMode } = useLegendHighlight();
  const [selectedFrame, setSelectedFrame] = useState<FrameStyleOption | null>(MINI_FRAME_OPTIONS[0]);
  const [roomSetting] = useState<RoomSetting>('living');

  const handleOrderPrint = () => {
    const exportState: ExportState = {
      currentMove: currentMove >= totalMoves ? totalMoves : currentMove,
      lockedPieces: lockedPieces.map(p => ({
        pieceType: p.pieceType,
        pieceColor: p.pieceColor,
      })),
      compareMode,
      darkMode,
    };
    onOrderPrint?.(exportState);
  };

  // Filter board to current move
  const filteredBoard = useMemo(() => {
    if (currentMove >= totalMoves) return board;
    return board.map(rank =>
      rank.map(square => ({
        ...square,
        visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
      }))
    );
  }, [board, currentMove, totalMoves]);

  // Mini visualization for the mockup
  const miniVisualization = useMemo(() => (
    <PrintReadyVisualization
      board={filteredBoard}
      gameData={gameData}
      size={100}
      darkMode={darkMode}
      compact
    />
  ), [filteredBoard, gameData, darkMode]);

  const basePrice = 29.99; // Starting price for 8x10
  const framePrice = selectedFrame ? getBaseFramePrice('8x10') : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-amber-500/5 to-orange-500/5 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Printer className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-display text-sm font-medium">Premium Print</h4>
            <p className="text-xs text-muted-foreground">Museum-quality canvas</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
          From ${basePrice.toFixed(0)}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex gap-4 items-center">
        {/* Wall Mockup */}
        <div className="shrink-0 scale-[0.85] origin-left -ml-2">
          <WallMockup
            sizeLabel="8x10"
            roomSetting={roomSetting}
            visualizationElement={miniVisualization}
            selectedFrame={selectedFrame}
          />
        </div>

        {/* Right Side */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Frame Quick Select */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <Frame className="h-3 w-3" />
              Frame Style
            </p>
            <div className="flex gap-1.5">
              {MINI_FRAME_OPTIONS.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedFrame?.id === frame.id
                      ? 'border-primary ring-2 ring-primary/30 scale-110'
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: frame.colorHex }}
                  title={frame.id.charAt(0).toUpperCase() + frame.id.slice(1)}
                />
              ))}
              <button
                onClick={() => setSelectedFrame(null)}
                className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center text-[8px] font-medium ${
                  !selectedFrame
                    ? 'border-primary ring-2 ring-primary/30 scale-110 bg-background'
                    : 'border-border hover:border-primary/50 bg-muted'
                }`}
                title="No frame"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              <Package className="h-2.5 w-2.5 mr-1" />
              Free US Shipping
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              6 Sizes Available
            </Badge>
          </div>

          {/* CTA */}
          <Button 
            size="sm" 
            className="w-full gap-2 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
            onClick={handleOrderPrint}
          >
            <Printer className="h-4 w-4" />
            Order Print
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MiniPrintOrderSection;
