import { useState, useEffect, useCallback } from 'react';

interface UseImageLoaderOptions {
  src: string;
  placeholderSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function useImageLoader({ src, placeholderSrc, onLoad, onError }: UseImageLoaderOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };

    img.src = src;

    // If image is cached, onload might not fire
    if (img.complete) {
      setCurrentSrc(src);
      setIsLoading(false);
      onLoad?.();
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholderSrc, onLoad, onError]);

  const retry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError?.();
    };
    img.src = src;
  }, [src, onLoad, onError]);

  return { isLoading, hasError, currentSrc, retry };
}

// Preload critical images
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(
    srcs.map(src => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = src;
      });
    })
  );
}

// Image with loading skeleton
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderColor?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  className = '',
  containerClassName = '',
  placeholderColor = 'bg-muted',
  ...props 
}: LazyImageProps) {
  const { isLoading, hasError, currentSrc, retry } = useImageLoader({ src });

  return (
    <div className={`relative ${containerClassName}`}>
      {isLoading && (
        <div className={`absolute inset-0 ${placeholderColor} animate-pulse`} />
      )}
      {hasError ? (
        <div 
          className="absolute inset-0 bg-muted flex items-center justify-center cursor-pointer"
          onClick={retry}
        >
          <span className="text-xs text-muted-foreground">Failed to load. Click to retry.</span>
        </div>
      ) : (
        <img
          src={currentSrc || src}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
}
