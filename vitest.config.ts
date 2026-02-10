import { defineConfig } from 'vitest/config';

// Separate config for tests — devvit plugin only supports `vite build`
export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
  },
});
