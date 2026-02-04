/**
 * App Loading Shell
 * Shown while initial app bundle loads
 */
export function AppLoadingShell() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="space-y-6 text-center">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-amber-400/30 animate-spin" style={{ animationDuration: '2s' }} />
        </div>
        
        {/* Brand */}
        <div>
          <h1 className="text-2xl font-bold tracking-wider uppercase">En Pensent</h1>
          <p className="text-sm text-muted-foreground mt-1">Loading Experience...</p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]" style={{
            width: '30%',
            animation: 'loading 2s ease-in-out infinite'
          }} />
        </div>
        
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(170%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * Page Loading Skeleton
 * Shown while page components load
 */
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-border/40 bg-background/95 backdrop-blur" />
      
      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Component Loading Spinner
 * For inline component loading states
 */
export function ComponentLoader({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/**
 * Error Loading State
 * Shown when a component fails to load
 */
export function ErrorLoadState({ 
  onRetry, 
  message = "Failed to load" 
}: { 
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <div className="p-8 text-center space-y-4">
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-primary hover:underline text-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
