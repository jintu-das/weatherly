import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/embed.ts",
      name: "WeatherlyWidget",
      formats: ["iife"],
      fileName: () => "weatherly-widget.js",
    },
    outDir: "dist/embed",
    emptyOutDir: false,
  },
});
