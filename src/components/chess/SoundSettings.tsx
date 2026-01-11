import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundStore } from '@/stores/soundStore';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export const SoundSettings = () => {
  const { enabled, volume, setEnabled, setVolume } = useSoundStore();

  const VolumeIcon = !enabled || volume === 0 
    ? VolumeX 
    : volume < 0.5 
      ? Volume1 
      : Volume2;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Sound settings"
        >
          <VolumeIcon className="h-4 w-4" />
          {!enabled && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-4" align="end">
        <div className="flex items-center justify-between">
          <span className="text-sm font-display uppercase tracking-wider">
            Game Sounds
          </span>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Toggle sounds"
          />
        </div>
        
        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-serif">Volume</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Slider
                  value={[volume]}
                  onValueChange={([v]) => setVolume(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="flex-1"
                  aria-label="Volume"
                />
                <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-serif">
                  Sounds include moves, captures, check, checkmate, and game results.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
};
