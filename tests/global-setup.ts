/**
 * Builds the site once per `vitest run`, before any test file is collected.
 *
 * Vitest runs a global setup once in the main process, so a suite of any size
 * pays for exactly one `astro build`. Every test file then only reads `dist/`.
 * `tests/seam.test.ts` asserts that, because the cost of this seam is the
 * build, and a build that quietly started running per file would make adding
 * assertions expensive — which is how a suite stops being added to.
 *
 * `SKIP_BUILD=1` reuses an existing `dist/`, so a pipeline can build once and
 * share the output between this suite and the budget runner. `npm run verify`
 * does exactly that.
 */
import { execFileSync } from 'node:child_process';
import type { TestProject } from 'vitest/node';

/**
 * Counted on `globalThis` rather than in a module variable, so the count
 * survives this module being re-instantiated and reflects invocations of the
 * setup itself.
 */
const BUILD_COUNT = Symbol.for('drweihungpan-site/astro-build-count');
const counter = globalThis as typeof globalThis & { [BUILD_COUNT]?: number };

export default function setup(project: TestProject): void {
  counter[BUILD_COUNT] = (counter[BUILD_COUNT] ?? 0) + 1;

  const reusedExistingBuild = Boolean(process.env.SKIP_BUILD);
  if (!reusedExistingBuild) {
    execFileSync('npx', ['astro', 'build'], {
      stdio: 'inherit',
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    });
  }

  project.provide('setupRuns', counter[BUILD_COUNT]);
  project.provide('reusedExistingBuild', reusedExistingBuild);
}

declare module 'vitest' {
  interface ProvidedContext {
    /** How many times the global setup has run in this process. Must be 1. */
    setupRuns: number;
    /** Whether `SKIP_BUILD` asked the suite to reuse an existing `dist/`. */
    reusedExistingBuild: boolean;
  }
}
