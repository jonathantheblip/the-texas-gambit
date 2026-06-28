import { defineConfig } from 'vitest/config';

// Pure-logic tests for the locks + core contracts. Node env, no plugins needed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
