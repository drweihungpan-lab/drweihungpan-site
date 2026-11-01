import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // One `astro build` for the whole suite; see tests/global-setup.ts.
    globalSetup: ['./tests/global-setup.ts'],
    include: ['tests/**/*.test.ts'],

    // Test files run one at a time, deliberately.
    //
    // The build-gate tests — the ones proving a malformed entry fails the
    // build, and that adding a session moves the derived Workshop count —
    // edit a file under `src/data/` and run a real `astro build`, then put
    // the file back. Two of those running at once see each other's edits and
    // share Astro's content store, so one fails for the other's reason.
    //
    // The whole suite reads one build that `globalSetup` already made, so
    // serialising costs a few seconds and buys tests that mean what they say.
    fileParallelism: false,
  },
});
