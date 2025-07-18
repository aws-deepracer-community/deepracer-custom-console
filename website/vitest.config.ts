/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false, // Disable CSS processing to avoid JSDOM parsing issues
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Exclude E2E tests from Vitest
      '**/*.config.*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'e2e/', // Exclude E2E from coverage
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/',
      ],
    },
  },
})
