import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "";

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: apiUrl
        ? undefined
        : {
            "/api": {
              target: "http://localhost:4000",
              changeOrigin: true,
              secure: false,
            },
          },
    },
  });
};
