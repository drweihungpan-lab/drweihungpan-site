import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // One `astro build` for the whole suite; see tests/global-setup.ts.
    globalSetup: ['./tests/global-setup.ts'],
    include: ['tests/**/*.test.ts'],

    /*
     * Test files run one at a time.
     *
     * Most of this suite only reads `dist/`, and would be happy in parallel.
     * A few files have to build the site again, because a rule has branches
     * one build cannot show at once — an empty faith stream, a malformed
     * entry, a different teaching record. Those builds share one project
     * root, so they share `.astro/`'s content store and the Vite cache, and
     * two of them also rewrite a data file in the working tree while they
     * run. Overlapping, they read each other's content and fail in ways that
     * have nothing to do with what they assert.
     *
     * The honest fix is to stop them overlapping. Reading `dist/` is cheap
     * enough that serialising the rest costs almost nothing.
     */
    fileParallelism: false,
  },
});
