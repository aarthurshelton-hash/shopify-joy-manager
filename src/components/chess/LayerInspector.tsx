import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquareVisit } from '@/lib/chess/gameSimulator';
import { ScrollArea } from '@/components/ui/scroll-area';

const PIECE_NAMES: Record<string, string> = {
  k: 'King',
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
  p: 'Pawn',
};

interface LayerInspectorProps {
  selectedSquare: { row: number; col: number } | null;
  layers: SquareVisit[];
  onRemoveLayer: (index: number) => void;
  onClose: () => void;
}

export const LayerInspector: React.FC<LayerInspectorProps> = ({
  selectedSquare,
  layers,
  onRemoveLayer,
  onClose,
}) => {
  if (!selectedSquare) {
    return (
      <div className="p-4 rounded-lg border border-border/50 bg-card/50">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold uppercase tracking-wider text-xs">Layer Inspector</h3>
        </div>
        <p className="text-xs text-muted-foreground font-serif text-center py-4">
          Click a square to inspect its layers
        </p>
      </div>
    );
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const squareName = `${files[selectedSquare.col]}${8 - selectedSquare.row}`;

  return (
    <div className="p-4 rounded-lg border border-primary/30 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold uppercase tracking-wider text-xs">
            Square {squareName.toUpperCase()}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>

      {layers.length === 0 ? (
        <p className="text-xs text-muted-foreground font-serif text-center py-4">
          No color layers on this square
        </p>
      ) : (
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            <AnimatePresence>
              {layers.map((layer, index) => (
                <motion.div
                  key={`${layer.moveNumber}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/30 group"
                >
                  {/* Color swatch */}
                  <div
                    className="w-6 h-6 rounded-md shadow-sm border border-white/20 flex-shrink-0"
                    style={{ backgroundColor: layer.hexColor }}
                  />
                  
                  {/* Layer info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-display uppercase tracking-wide truncate">
                      {layer.color === 'w' ? 'White' : 'Black'} {PIECE_NAMES[layer.piece]}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Layer {index + 1} • Move #{layer.moveNumber}
                    </p>
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveLayer(index)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {layers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground text-center">
            {layers.length} layer{layers.length !== 1 ? 's' : ''} • Outermost shown first
          </p>
        </div>
      )}
    </div>
  );
};
