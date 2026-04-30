import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

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
    // Sentry source-map upload + release creation. Only registered when
    // SENTRY_AUTH_TOKEN is present at build time — local dev builds and
    // forks without secrets skip this step silently.
    process.env.SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: "tajdeed-tech",
        project: "mpn",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          // We emit hidden sourcemaps for production (see build.sourcemap below);
          // upload them so Sentry can symbolicate, then they remain unreferenced
          // from the deployed bundles.
          assets: "./dist/**",
        },
        // Release name follows VITE_APP_VERSION when set; otherwise the plugin
        // auto-generates one from the git commit.
        release: process.env.VITE_APP_VERSION
          ? { name: process.env.VITE_APP_VERSION }
          : undefined,
      }),
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
        // Vendor + dataset chunking. The csc-* rules MUST stay first because
        // the modulePreload filter above relies on those exact chunk names —
        // see the comment block above for why.
        manualChunks(id) {
          // Heavy dataset — kept lazy by csc-lazy.ts dynamic imports.
          if (id.includes("country-state-city/lib/city")) return "csc-city";
          if (id.includes("country-state-city/lib/state")) return "csc-state";
          if (id.includes("country-state-city/lib/country")) return "csc-country";

          if (!id.includes("node_modules")) return undefined;

          // React core — used on every route, perfect long-cache candidate.
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          // Router — small but landing-only paths still pay for it.
          if (id.includes("/node_modules/react-router")) return "vendor-router";

          // Supabase — only the landing page touches it via AuthContext, but
          // every authenticated route uses it heavily. Split so cold-loads
          // amortize across routes and updates don't bust the React vendor.
          if (id.includes("/node_modules/@supabase/")) return "vendor-supabase";

          // React Query — used on every page-level data fetch hook.
          if (id.includes("/node_modules/@tanstack/")) return "vendor-query";

          // Sentry — heavy SDK; should be its own chunk so the source-map
          // upload step still walks ./dist/** cleanly. Replay + browser
          // tracing are the bulk; isolating them avoids polluting React vendor.
          if (id.includes("/node_modules/@sentry/")) return "vendor-sentry";

          // Radix primitives — most pages eventually pull a handful in. Keep
          // them out of the per-route chunks so the same ~30 KB doesn't get
          // duplicated across Search/Profile/Settings/etc.
          if (id.includes("/node_modules/@radix-ui/")) return "vendor-radix";
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
}));

