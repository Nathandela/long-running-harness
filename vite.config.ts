import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      "@audio": resolve(import.meta.dirname, "src/audio"),
      "@ui": resolve(import.meta.dirname, "src/ui"),
      "@state": resolve(import.meta.dirname, "src/state"),
    },
  },
});
