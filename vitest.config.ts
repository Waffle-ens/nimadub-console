import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts', 'src/types/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
      all: true,
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
