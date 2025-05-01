import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],

    server: {
      port: 5173,
      open: true,
    },

    // vite defaults
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
    },

    base: "/",

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      css: false, // faster
    },
  };
});
