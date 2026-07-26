import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "./lib/trpc";
import App from "./App";
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "https://kangaruai-assistant.onrender.com/api/trpc",
      transformer: superjson,
      headers() {
        // Get JWT token from localStorage or sessionStorage
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </QueryClientProvider>
  </trpc.Provider>
);
