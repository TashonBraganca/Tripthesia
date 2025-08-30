'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
// Simplified skeleton component
const Skeleton = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <div 
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    style={style}
  />
);

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Generate blur placeholder if not provided
  const generateBlurDataURL = useCallback((w: number, h: number) => {
    if (blurDataURL) return blurDataURL;
    
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g">
            <stop stop-color="#f3f4f6" offset="20%" />
            <stop stop-color="#e5e7eb" offset="50%" />
            <stop stop-color="#f3f4f6" offset="70%" />
          </linearGradient>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#g)" />
      </svg>`
    ).toString('base64')}`;
  }, [blurDataURL]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
    
    // Fallback to a placeholder image
    setCurrentSrc('/images/placeholder.jpg');
  }, [onError]);

  // Update src when prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  if (hasError && currentSrc === '/images/placeholder.jpg') {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width: width || '100%', height: height || 200 }}
      >
        <div className="text-gray-400 dark:text-gray-500 text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <Skeleton 
          className="absolute inset-0 z-10" 
          style={{ width: width || '100%', height: height || 200 }}
        />
      )}
      
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ objectFit }}
        priority={priority}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={width && height ? generateBlurDataURL(width, height) : undefined}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

// Lazy loading wrapper for images outside viewport
interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
}

export function LazyImage({
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}: LazyImageProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={imgRef} className={props.className}>
      {shouldLoad ? (
        <OptimizedImage {...props} />
      ) : (
        <Skeleton 
          style={{ 
            width: props.width || '100%', 
            height: props.height || 200 
          }} 
        />
      )}
    </div>
  );
}

// Gallery component with progressive loading
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export function ImageGallery({ 
  images, 
  columns = 3, 
  gap = 4, 
  className = '' 
}: ImageGalleryProps) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6); // Load first 6 images

  const handleImageLoad = useCallback(() => {
    setLoadedCount(prev => prev + 1);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 6, images.length));
  }, [images.length]);

  // Auto-load more images when user scrolls near bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.offsetHeight;
      
      if (scrollTop + windowHeight >= docHeight - 1000) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return (
    <div className={className}>
      <div 
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-${gap}`}
      >
        {images.slice(0, visibleCount).map((image, index) => (
          <LazyImage
            key={`${image.src}-${index}`}
            src={image.src}
            alt={image.alt}
            width={image.width || 400}
            height={image.height || 300}
            className="rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
            onLoad={handleImageLoad}
            priority={index < 3} // Prioritize first 3 images
          />
        ))}
      </div>

      {/* Load more indicator */}
      {visibleCount < images.length && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Images ({visibleCount} of {images.length})
          </button>
        </div>
      )}

      {/* Loading progress */}
      {loadedCount < visibleCount && (
        <div className="text-center mt-4 text-gray-600">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading images... {loadedCount}/{visibleCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Responsive image with multiple breakpoints
interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'sizes'> {
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveImage({ 
  breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 },
  width,
  ...props 
}: ResponsiveImageProps) {
  const generateSizes = () => {
    const { sm, md, lg, xl } = breakpoints;
    return `(max-width: ${sm}px) 100vw, (max-width: ${md}px) 50vw, (max-width: ${lg}px) 33vw, (max-width: ${xl}px) 25vw, ${width}px`;
  };

  return (
    <OptimizedImage
      {...props}
      width={width}
      sizes={generateSizes()}
    />
  );
}

export default OptimizedImage;