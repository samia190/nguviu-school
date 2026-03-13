import React from "react";

/**
 * Catches errors thrown during rendering of lazy-loaded page chunks.
 * Without this, a failed dynamic import (e.g. 404 JS chunk after a new deployment)
 * unmounts the entire React tree and shows a blank white page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Page render failed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: "#555", marginBottom: 24 }}>
            This page failed to load. This can happen after a site update.
          </p>
          <button
            onClick={() => {
              // Clear all service-worker caches then hard-reload so fresh
              // assets are fetched from the network.
              if ("caches" in window) {
                caches.keys().then((names) =>
                  Promise.all(names.map((n) => caches.delete(n)))
                ).then(() => window.location.reload());
              } else {
                window.location.reload();
              }
            }}
            style={{
              padding: "10px 28px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
