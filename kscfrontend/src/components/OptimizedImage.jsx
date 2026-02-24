// Enhanced Image Component with WebP support and responsive images
import React, { useState } from "react";
import useInView from "../hooks/useInView";

/**
 * OptimizedImage - Enhanced image component with:
 * - Lazy loading
 * - WebP support with fallback
 * - Responsive srcset
 * - Loading states
 * - Error handling
 */
export default function OptimizedImage({ 
  src, 
  alt = "", 
  className = "", 
  style = {},
  width,
  height,
  sizes,
  priority = false,
  onLoad,
  onError,
  fetchPriority = "auto",
  ...props 
}) {
  const [ref, inView] = useInView({ rootMargin: priority ? "0px" : "200px" });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate WebP version if image is JPG/PNG
  const getWebPSrc = (originalSrc) => {
    if (!originalSrc || originalSrc.endsWith('.webp') || originalSrc.endsWith('.svg')) {
      return null;
    }
    return originalSrc.replace(/\\.(jpg|jpeg|png)$/i, '.webp');
  };

  // Generate responsive srcset for different screen sizes
  const generateSrcSet = (originalSrc) => {
    // Disable srcset generation to avoid broken image references
    // Only return the original source
    return undefined;
  };

  const handleLoad = (event) => {
    setIsLoaded(true);
    if (onLoad) onLoad(event);
  };

  const handleError = (event) => {
    setHasError(true);
    if (onError) onError(event);
  };

  const webpSrc = getWebPSrc(src);
  const shouldLoad = priority || inView;

  return (
    <div ref={ref} className={className} style={{ display: "block", position: "relative", ...style }}>
      {shouldLoad ? (
        <picture>
          {/* WebP source for modern browsers */}
          {webpSrc && !hasError && (
            <source srcSet={webpSrc} type="image/webp" />
          )}
          
          {/* Original format as fallback */}
          <img 
            src={src} 
            srcSet={generateSrcSet(src)}
            sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : fetchPriority}
            decoding={priority ? "sync" : "async"}
            onLoad={handleLoad}
            onError={handleError}
            style={{ 
              width: "100%", 
              height: "100%", 
              display: "block",
              opacity: priority ? 1 : (isLoaded ? 1 : 0),
              transition: priority ? 'none' : 'opacity 0.2s ease-in',
            }} 
            {...props} 
          />
        </picture>
      ) : (
        <div style={{ width: '100%', height: height || '200px', background: '#f0f0f0' }} />
      )}
    </div>
  );
}

/**
 * Background Image with lazy loading
 */
export function OptimizedBackgroundImage({ 
  src, 
  children, 
  className = "",
  style = {},
  ...props
}) {
  const [ref, inView] = useInView({ rootMargin: "100px" });
  const [bgLoaded, setBgLoaded] = useState(false);

  React.useEffect(() => {
    if (inView && src && !bgLoaded) {
      const img = new Image();
      img.onload = () => setBgLoaded(true);
      img.src = src;
    }
  }, [inView, src, bgLoaded]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        backgroundImage: bgLoaded ? `url(${src})` : 'none',
        backgroundColor: bgLoaded ? 'transparent' : '#f0f0f0',
        transition: 'opacity 0.3s ease-in-out',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
