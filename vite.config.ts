import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite-plus";

/** The development manifest also lets a local dev server of the viewer (any port) ask. */
const DEV_MATCHES = ["http://localhost/*"];

/**
 * The extension is one service worker. `dist/` is what Chrome loads
 * (unpacked) and what is zipped for the Web Store: the manifest and icons
 * come from `public/`, the worker from `src/background.ts`.
 *
 * `vp build` is the production build: only https://view.graphcal.org/ may
 * ask it. `vp build --mode development` (`pnpm run build:dev`) also answers
 * `http://localhost`, in its manifest and in the worker's sender check; it is
 * never uploaded (scripts/store-zip.mjs refuses it).
 */
export default defineConfig(({ mode }) => {
  const development = mode === "development";
  return {
    define: { __GRAPHCAL_BUILD__: JSON.stringify(development ? "development" : "production") },
    plugins: [
      {
        name: "graphcal-development-manifest",
        apply: "build",
        writeBundle(options) {
          if (!development) return;
          const path = `${options.dir ?? "dist"}/manifest.json`;
          const manifest = JSON.parse(readFileSync(path, "utf8"));
          manifest.externally_connectable.matches.push(...DEV_MATCHES);
          writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
        },
      },
    ],
    build: {
      target: "es2023",
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        input: { background: "src/background.ts" },
        output: { entryFileNames: "[name].js", format: "es" },
      },
    },
    test: { include: ["src/**/*.test.ts"] },
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
  };
});
