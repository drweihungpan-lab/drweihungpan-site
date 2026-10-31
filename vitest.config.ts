import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // One `astro build` for the whole suite; see tests/global-setup.ts.
    globalSetup: ['./tests/global-setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
});
