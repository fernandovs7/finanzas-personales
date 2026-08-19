import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "./",
  plugins: [react()],
  build: {
    outDir: isGitHubPagesBuild
      ? "dist"
      : resolve(
          "/Users/fernandovargas/Documents/Codex/2026-08-17/referenced-chatgpt-conversation-this-is-an/outputs/finanzas-app"
        ),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@supabase")) return "supabase";
          return undefined;
        }
      }
    }
  }
});
