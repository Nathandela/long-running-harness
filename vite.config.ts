import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { build as esbuild } from "esbuild";

/**
 * Vite plugin that bundles AudioWorklet processors emitted via
 * `new URL("./foo-processor.ts", import.meta.url)`.
 *
 * Vite copies these as raw .ts assets. This plugin replaces them
 * with esbuild-bundled .js files and patches the references.
 */
function audioWorkletBundle(): Plugin {
  return {
    name: "audio-worklet-bundle",
    apply: "build",

    async generateBundle(_opts, bundle) {
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (
          asset.type !== "asset" ||
          !fileName.endsWith(".ts") ||
          !fileName.includes("-processor")
        )
          continue;

        // Find the original source path from the asset
        const source =
          typeof asset.source === "string"
            ? asset.source
            : new TextDecoder().decode(asset.source);

        // Bundle with esbuild
        const result = await esbuild({
          stdin: { contents: source, resolveDir: resolve("src/audio/synth"), loader: "ts" },
          bundle: true,
          format: "esm",
          write: false,
        });

        const jsFileName = fileName.replace(/\.ts$/, ".js");

        // Emit bundled JS asset
        this.emitFile({
          type: "asset",
          fileName: jsFileName,
          source: result.outputFiles[0].text,
        });

        // Remove original .ts asset
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete bundle[fileName];

        // Patch references in all JS chunks
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== "chunk") continue;
          const tsRef = fileName.split("/").pop() ?? "";
          const jsRef = jsFileName.split("/").pop() ?? "";
          if (chunk.code.includes(tsRef)) {
            chunk.code = chunk.code.replaceAll(tsRef, jsRef);
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [audioWorkletBundle(), react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      "@audio": resolve(import.meta.dirname, "src/audio"),
      "@ui": resolve(import.meta.dirname, "src/ui"),
      "@state": resolve(import.meta.dirname, "src/state"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
