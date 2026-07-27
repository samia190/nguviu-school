import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { trpc } from "./lib/trpc";
import App from "./App";
import "./index.css";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_TRPC_URL,

      transformer: superjson,

      headers() {
        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        return token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {};
      },

      fetch(input, init) {
        return fetch(input, {
          ...init,
          credentials: "include",
        });
      },
    }),
  ],
});


createRoot(document.getElementById("root")!).render(
  <trpc.Provider
    client={trpcClient}
    queryClient={queryClient}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);