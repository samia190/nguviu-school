import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./responsive.css";
import "./styles/mobile-optimization.css";
import { BrowserRouter } from "react-router-dom";
import { registerServiceWorker } from "./utils/serviceWorkerRegistration";
import { initPerformanceMonitoring } from "./utils/performance";
import { resolveApiUrl } from "./utils/api";

const root = createRoot(document.getElementById("root"));

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const inputUrl = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input && typeof input === "object" && "url" in input
        ? input.url
        : undefined;

  if (typeof inputUrl === "string" && inputUrl.startsWith("/api") && !inputUrl.startsWith("//")) {
    const resolvedUrl = resolveApiUrl(inputUrl);

    if (typeof input === "string") {
      return originalFetch(resolvedUrl, init);
    }
    if (input instanceof URL) {
      return originalFetch(new URL(resolvedUrl), init);
    }
    if (input instanceof Request) {
      return originalFetch(new Request(resolvedUrl, input), init);
    }
    return originalFetch(resolvedUrl, init);
  }

  return originalFetch(input, init);
};

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Register service worker for offline support and caching (production only)
if (import.meta.env.PROD) {
  registerServiceWorker();
}

// Initialize performance monitoring (development only)
if (import.meta.env.DEV) {
  initPerformanceMonitoring();
}
