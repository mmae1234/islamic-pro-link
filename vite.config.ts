import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: false,
  },
  plugins: [
    react(),
    // Ensures compatibility with older iOS Safari/WebKit builds that can otherwise blank-screen.
    legacy({
      targets: ["iOS >= 12", "Safari >= 12", "Chrome >= 60", "Firefox >= 60", "Edge >= 79"],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Keep JS output conservative for mobile Safari.
    target: "es2015",
  },
}));

