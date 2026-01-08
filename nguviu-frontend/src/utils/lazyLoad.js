// Lazy Loading Wrapper for React Components
import { Suspense, lazy } from "react";

/**
 * Loading fallback component
 */
function LoadingFallback({ message = "Loading..." }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "200px",
      padding: "2rem",
    }}>
      <div style={{
        textAlign: "center",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 1rem",
        }}></div>
        <p>{message}</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * Lazy load a component with Suspense
 * Usage: const MyComponent = lazyLoad(() => import('./MyComponent'))
 */
export function lazyLoad(importFunc, fallback = <LoadingFallback />) {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy component before it's needed
 * Usage: preloadComponent(() => import('./MyComponent'))
 */
export function preloadComponent(importFunc) {
  importFunc();
}

/**
 * Lazy load multiple components
 * Usage:
 * const components = lazyLoadMultiple({
 *   About: () => import('./About'),
 *   Contact: () => import('./Contact'),
 * });
 */
export function lazyLoadMultiple(components) {
  const result = {};
  Object.keys(components).forEach((key) => {
    result[key] = lazyLoad(components[key]);
  });
  return result;
}

export { LoadingFallback };
