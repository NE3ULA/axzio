import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
});
