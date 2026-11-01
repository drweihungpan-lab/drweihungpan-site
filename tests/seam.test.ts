import { describe, expect, inject, it } from 'vitest';
import { allRoutes, routeExists } from './site';

/**
 * The seam's own guarantee. Every other test file in this suite reads the
 * output of one build; this one checks that there really was only one, so
 * that adding an assertion stays free and the suite stays worth extending.
 */
describe('the test seam', () => {
  it('builds the site once, however many test files assert against it', () => {
    expect(inject('setupRuns')).toBe(1);
  });

  it('gives every test file the same built site to read', () => {
    expect(routeExists('/')).toBe(true);
    expect(allRoutes().length).toBeGreaterThan(0);
  });
});
