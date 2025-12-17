'use client';

import * as React from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { useLazyLoad, useImagePreload } from '@/hooks/usePerformance';

// =============================================================================
// Types
// =============================================================================

export interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  /** Show blur placeholder while loading */
  showBlur?: boolean;
  /** Custom blur data URL */
  blurDataURL?: string;
  /** Lazy load the image */
  lazy?: boolean;
  /** Root margin for lazy loading */
  lazyRootMargin?: string;
  /** Show skeleton while loading */
  showSkeleton?: boolean;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Fallback src if image fails */
  fallbackSrc?: string;
  /** Aspect ratio (e.g., "16/9", "1/1", "4/3") */
  aspectRatio?: string;
  /** Container className */
  containerClassName?: string;
}

// =============================================================================
// Default blur placeholder (tiny 1x1 transparent PNG)
// =============================================================================

const DEFAULT_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// =============================================================================
// Image Skeleton
// =============================================================================

function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-amari-sand animate-pulse rounded-inherit',
        className
      )}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// OptimizedImage Component
// =============================================================================

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  showBlur = true,
  blurDataURL = DEFAULT_BLUR_DATA_URL,
  lazy = true,
  lazyRootMargin = '200px',
  showSkeleton = true,
  onLoad,
  onError,
  fallbackSrc,
  aspectRatio,
  className,
  containerClassName,
  fill,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(src);

  // Lazy loading
  const { ref, shouldLoad } = useLazyLoad({
    rootMargin: lazyRootMargin,
    freezeOnceVisible: true,
  });

  // Reset state when src changes
  React.useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    }
    onError?.();
  };

  const shouldRender = !lazy || shouldLoad;
  const showPlaceholder = !isLoaded && showSkeleton;

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : undefined;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'relative overflow-hidden',
        fill && 'w-full h-full',
        containerClassName
      )}
      style={aspectRatioStyle}
    >
      {/* Skeleton placeholder */}
      {showPlaceholder && <ImageSkeleton />}

      {/* Actual image */}
      {shouldRender && !hasError && (
        <Image
          src={currentSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          placeholder={showBlur ? 'blur' : 'empty'}
          blurDataURL={showBlur ? blurDataURL : undefined}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-amari-sand/50 text-amari-muted text-sm'
          )}
          role="img"
          aria-label={`Failed to load: ${alt}`}
        >
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Preloaded Image (eager loading with status)
// =============================================================================

export interface PreloadedImageProps extends Omit<OptimizedImageProps, 'lazy'> {
  /** Priority loading hint */
  priority?: boolean;
}

export function PreloadedImage({
  src,
  priority = true,
  ...props
}: PreloadedImageProps) {
  const { loaded, error } = useImagePreload(src as string);

  return (
    <OptimizedImage
      src={src}
      lazy={false}
      showSkeleton={!loaded && !error}
      priority={priority}
      {...props}
    />
  );
}

// =============================================================================
// Avatar Image (optimized for circular avatars)
// =============================================================================

export interface AvatarImageProps extends Omit<OptimizedImageProps, 'aspectRatio'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitials?: string;
}

const AVATAR_SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
} as const;

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallbackInitials,
  className,
  containerClassName,
  ...props
}: AvatarImageProps) {
  const [showFallback, setShowFallback] = React.useState(!src);
  const dimension = AVATAR_SIZES[size];

  if (showFallback || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          'bg-amari-sage/20 text-amari-sage font-semibold',
          containerClassName
        )}
        style={{ width: dimension, height: dimension }}
        role="img"
        aria-label={alt}
      >
        {fallbackInitials || alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('rounded-full object-cover', className)}
      containerClassName={cn('rounded-full', containerClassName)}
      onError={() => setShowFallback(true)}
      {...props}
    />
  );
}
