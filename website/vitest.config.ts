/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Suppress stderr output from jsdom for expected test errors
    silent: true,
    reporters: ["default"],
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        console: true,
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    css: false, // Disable CSS processing to avoid JSDOM parsing issues
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**", // Exclude E2E tests from Vitest
      "**/*.config.*",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "../coverage", // This will put coverage in workspace root
      exclude: [
        "node_modules/",
        "src/test/",
        "e2e/", // Exclude E2E from coverage
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.cjs",
        "**/index.ts", // Exclude all index.ts files from coverage
        "dist/",
        "coverage/",
      ],
    },
  },
});
