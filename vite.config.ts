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
    // NOTE: targets here are for the *legacy* bundle; keep them broad to support older iPhones.
    legacy({
      targets: ["defaults", "not IE 11"],
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
    // Hidden source maps: emitted but not referenced from bundles. Available
    // to error-reporting tools without exposing source to casual viewers, and
    // suppresses Lighthouse's valid-source-maps nag.
    sourcemap: "hidden",
    // Prevent Rollup from auto-injecting <link rel="modulepreload"> for the
    // huge csc-city / csc-state / csc-country chunks whenever a parent chunk
    // (EnhancedFormDropdowns) is preloaded. Without this, the 8 MB city
    // dataset gets fetched on /businesses even though the dynamic import()
    // inside csc-lazy.ts is never reached. We strip these chunks from the
    // dependency list so they only load when the dynamic import actually
    // resolves them.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !/csc-(city|state|country)/.test(d)),
    },
    rollupOptions: {
      output: {
        // Split the heavy country-state-city dataset into its own chunks so the
        // 8 MB city dataset only loads when a city dropdown is opened.
        manualChunks(id) {
          if (id.includes("country-state-city/lib/city")) return "csc-city";
          if (id.includes("country-state-city/lib/state")) return "csc-state";
          if (id.includes("country-state-city/lib/country")) return "csc-country";
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
}));

