import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // your frontend dev port
    proxy: {
      "/api": {
        target: "http://localhost:4000", // backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Optimize production build
    minify: "esbuild", // Fast and efficient minification
    sourcemap: false, // Disable source maps to reduce size
    cssCodeSplit: true, // Split CSS for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
    // Target modern browsers for smaller output
    target: "esnext",
  },
});
