/**
 * Stockfish Engine Status Component
 * 
 * Displays the current status of the Stockfish WASM engine
 * with loading state, version info, and analysis progress.
 */

import { useStockfishAnalysis } from '@/hooks/useStockfishAnalysis';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Cpu, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface StockfishStatusProps {
  className?: string;
  showVersion?: boolean;
  compact?: boolean;
}

export function StockfishStatus({ 
  className = '', 
  showVersion = true,
  compact = false 
}: StockfishStatusProps) {
  const { isReady, isAnalyzing, error, progress, engineVersion } = useStockfishAnalysis();
  
  if (compact) {
    return (
      <Badge 
        variant={isReady ? "default" : error ? "destructive" : "secondary"}
        className={`gap-1.5 ${className}`}
      >
        {isReady ? (
          <>
            <Cpu className="h-3 w-3" />
            <span>SF16</span>
          </>
        ) : error ? (
          <>
            <XCircle className="h-3 w-3" />
            <span>Error</span>
          </>
        ) : (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading</span>
          </>
        )}
      </Badge>
    );
  }
  
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {isReady ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : error ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        
        <span className="text-sm font-medium">
          {isReady 
            ? 'Engine Ready' 
            : error 
              ? 'Engine Error' 
              : 'Loading Engine...'}
        </span>
        
        {showVersion && isReady && (
          <Badge variant="outline" className="text-xs">
            {engineVersion}
          </Badge>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      
      {isAnalyzing && progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Analyzing moves...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
