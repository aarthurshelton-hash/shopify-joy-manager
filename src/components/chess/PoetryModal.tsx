import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PenTool, Feather, Quote, Copy, Check } from 'lucide-react';
import { getGamePoetry, getPoetryStyleLabel, GamePoetry } from '@/lib/chess/gamePoetry';
import { toast } from 'sonner';

interface PoetryModalProps {
  gameId: string | null;
  gameTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

const styleIcons: Record<string, React.ReactNode> = {
  'haiku': '🎋',
  'couplet': '🪶',
  'quatrain': '📜',
  'free verse': '🌊',
  'epigram': '💎',
  'sonnet fragment': '🌹',
};

const styleDescriptions: Record<string, string> = {
  'haiku': 'A traditional Japanese form: 3 lines capturing a moment in time',
  'couplet': 'Two rhyming lines that complete a thought',
  'quatrain': 'Four lines weaving narrative and emotion',
  'free verse': 'Unbound by form, flowing with the game\'s spirit',
  'epigram': 'A brief, witty observation distilled to its essence',
  'sonnet fragment': 'An excerpt from a larger poetic tradition',
};

export const PoetryModal: React.FC<PoetryModalProps> = ({
  gameId,
  gameTitle,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  
  const poetry = gameId ? getGamePoetry(gameId) : null;
  const styleLabel = gameId ? getPoetryStyleLabel(gameId) : null;

  const handleCopy = () => {
    if (poetry) {
      const textToCopy = `${poetry.poem}\n\n— "${gameTitle || 'Chess Vision'}" | En Pensent`;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Poetry copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!poetry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-primary/20 bg-gradient-to-b from-card to-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Feather className="h-5 w-5 text-primary" />
            </motion.div>
            Poetry of the Game
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game Title */}
          {gameTitle && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Inspired by</p>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {gameTitle}
              </h3>
            </div>
          )}

          {/* Poetry Display */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative p-6 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 border border-primary/20"
          >
            {/* Quote decoration */}
            <Quote className="absolute top-3 left-3 h-6 w-6 text-primary/20" />
            <Quote className="absolute bottom-3 right-3 h-6 w-6 text-primary/20 rotate-180" />

            {/* The poem */}
            <div className="relative z-10 text-center px-4">
              {poetry.poem.split('\n').map((line, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.15 }}
                  className="font-serif text-lg md:text-xl leading-relaxed text-foreground italic"
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </motion.div>

          {/* Style Badge and Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-2"
          >
            <Badge 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/30 gap-2"
            >
              <span>{styleIcons[poetry.style] || '✨'}</span>
              {styleLabel}
            </Badge>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {styleDescriptions[poetry.style]}
            </p>
          </motion.div>

          {/* Copy Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 group"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="h-4 w-4 group-hover:text-primary transition-colors" />
                  </motion.div>
                )}
              </AnimatePresence>
              {copied ? 'Copied!' : 'Copy Poetry'}
            </Button>
          </div>

          {/* Attribution */}
          <p className="text-center text-xs text-muted-foreground">
            ♔ En Pensent — Where Every Game Becomes Art ♚
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Compact poetry preview card for embedding in vision experience
export const PoetryPreviewCard = React.forwardRef<
  HTMLButtonElement,
  {
    gameId: string | null;
    gameTitle?: string;
    onOpenModal: () => void;
  }
>(function PoetryPreviewCard({ gameId, gameTitle, onOpenModal }, ref) {
  const poetry = gameId ? getGamePoetry(gameId) : null;
  const styleLabel = gameId ? getPoetryStyleLabel(gameId) : null;

  if (!poetry) return null;

  const firstLine = poetry.poem.split('\n')[0];

  return (
    <button
      ref={ref}
      onClick={onOpenModal}
      className="w-full text-left p-4 rounded-lg bg-gradient-to-r from-primary/5 via-transparent to-amber-500/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 group cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Feather className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Poetry</span>
            <Badge variant="secondary" className="text-[10px] py-0">
              {styleIcons[poetry.style]} {styleLabel}
            </Badge>
          </div>
          <p className="font-serif text-sm text-foreground italic truncate">
            "{firstLine}..."
          </p>
          <p className="text-xs text-primary/70 mt-1 group-hover:text-primary transition-colors">
            Click to read full poem →
          </p>
        </div>
      </div>
    </button>
  );
});

export default PoetryModal;
