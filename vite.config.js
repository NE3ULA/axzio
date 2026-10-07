import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";

// Short commit hash baked into the build so any client (browser tab,
// home-screen app, desktop) can show exactly which build it runs.
// Verified: the GitHub Pages workflow checks out git history, so this
// resolves in CI as well as locally.
let buildSha = "dev";
try {
  buildSha = execSync("git rev-parse --short HEAD").toString().trim() || "dev";
} catch {
  /* no git — dev fallback */
}

// AXZIO v1 — static SPA build. No SSR, no router; hash-based routing so the
// built files work from any static host.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset URLs so the build works from any static host and any
  // subpath (GitHub Pages project sites, file drops, etc.).
  base: "./",
  build: {
    outDir: "dist",
  },
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
});
