import { useEffect } from 'react';

/**
 * Hook to preload images for faster rendering
 * @param {string | string[]} imageSrcs - Single image URL or array of image URLs
 * @param {boolean} isPriority - Whether to preload immediately (true) or on idle (false)
 */
export function useImagePreload(imageSrcs, isPriority = false) {
  useEffect(() => {
    if (!imageSrcs) return;

    const srcs = Array.isArray(imageSrcs) ? imageSrcs : [imageSrcs];
    
    const preloadImage = (src) => {
      if (!src) return;
      
      const img = new Image();
      img.src = src;
      // For WebP variant if available
      if (!src.endsWith('.webp') && !src.endsWith('.svg')) {
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const webpImg = new Image();
        webpImg.src = webpSrc;
      }
    };

    if (isPriority) {
      // Preload immediately for priority images
      srcs.forEach(preloadImage);
    } else {
      // Use requestIdleCallback for non-critical images
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => srcs.forEach(preloadImage));
      } else {
        // Fallback: schedule after a delay
        setTimeout(() => srcs.forEach(preloadImage), 2000);
      }
    }
  }, [imageSrcs, isPriority]);
}

/**
 * Hook to add link rel="preload" tags to document head
 * @param {string | string[]} imageSrcs - Image URLs to preload
 * @param {string} type - Image MIME type (default: 'image/jpeg')
 */
export function useHeadPreload(imageSrcs, type = 'image/jpeg') {
  useEffect(() => {
    if (!imageSrcs || typeof document === 'undefined') return;

    const srcs = Array.isArray(imageSrcs) ? imageSrcs : [imageSrcs];
    const links = [];

    srcs.forEach(src => {
      if (!src) return;

      // Create preload link
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.type = type;
      document.head.appendChild(link);
      links.push(link);

      // Also preload WebP variant if applicable
      if (!src.endsWith('.webp') && !src.endsWith('.svg')) {
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const webpLink = document.createElement('link');
        webpLink.rel = 'preload';
        webpLink.as = 'image';
        webpLink.href = webpSrc;
        webpLink.type = 'image/webp';
        document.head.appendChild(webpLink);
        links.push(webpLink);
      }
    });

    // Cleanup: Remove preload links on unmount (optional)
    return () => {
      links.forEach(link => {
        if (link.parentNode === document.head) {
          document.head.removeChild(link);
        }
      });
    };
  }, [imageSrcs, type]);
}

/**
 * Batch preload multiple images with priority
 * Useful for preloading first few news items or staff photos
 * @param {Array<{src: string, type?: string}>} images - Array of image objects
 */
export function useBatchImagePreload(images = []) {
  useEffect(() => {
    if (!images || images.length === 0) return;

    images.forEach((image, index) => {
      if (!image?.src) return;

      // Load first 3 images immediately, rest on idle
      const isPriority = index < 3;
      const preload = () => {
        const img = new Image();
        img.src = image.src;
      };

      if (isPriority) {
        preload();
      } else if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preload);
      } else {
        setTimeout(preload, index * 500);
      }
    });
  }, [images]);
}

export default useImagePreload;
