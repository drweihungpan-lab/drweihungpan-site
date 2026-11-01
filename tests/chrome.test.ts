import type { CheerioAPI } from 'cheerio';
import { describe, expect, it } from 'vitest';
import { allRoutes, assetExists, page, routeExists, styles } from './site';

/**
 * The chrome every page wears: the header navigation and the footer.
 *
 * Every rule here is written over `allRoutes()` and over the information
 * architecture the spec fixes, never over a hand-written list of pages. A page
 * a later ticket adds therefore has to satisfy these rules, and the ticket that
 * adds it has no reason to touch this file.
 */

/**
 * The architecture from the spec, as paths under a language root.
 *
 * Restated here rather than imported from `src/lib/navigation.ts`: a test that
 * asked the navigation what it thinks the architecture is could never disagree
 * with it. `writing/faith` is the conditional faith item, and `services/
 * consulting` is listed but carries no homepage card.
 */
const ARCHITECTURE = [
  'services/engineering',
  'services/statistics',
  'services/workshops',
  'services/consulting',
  'teaching',
  'writing',
  'writing/faith',
  'about',
  'contact',
] as const;

const isChinese = (route: string): boolean => route === '/zh/' || route.startsWith('/zh/');

/** The language root a page of this route belongs to. */
const rootOf = (route: string): string => (isChinese(route) ? '/zh/' : '/');

const hrefsIn = ($: CheerioAPI, selector: string): string[] =>
  $(selector)
    .map((_, element) => $(element).attr('href') ?? '')
    .get();

describe('the header', () => {
  it.each(allRoutes())('%s links back to the homepage of its own language', (route) => {
    expect(page(route)(`header a[href="${rootOf(route)}"]`).length).toBeGreaterThanOrEqual(1);
  });

  /**
   * The navigation offers exactly the architecture's pages that were built in
   * this page's language — all of them, and nothing else. Both halves matter:
   * the first is how a later page becomes reachable without an edit here, and
   * the second is why Traditional Chinese shows only the five pages it is
   * written for instead of linking a page that does not exist.
   *
   * The language switcher is the one header link carrying `hreflang`, and is
   * excluded here; `tests/i18n.test.ts` owns it.
   */
  it.each(allRoutes())('%s navigates to every built page of its language', (route) => {
    const expected = ARCHITECTURE.map((path) => `${rootOf(route)}${path}/`)
      .filter(routeExists)
      .sort();

    const navigated = hrefsIn(page(route), 'header nav a[href]:not([hreflang])').sort();

    expect(navigated).toEqual(expected);
  });
});

describe('every link in the chrome', () => {
  /**
   * The chrome is the one part of the site that appears on pages its author
   * never saw, so a stale link there breaks every page at once rather than
   * one.
   */
  it.each(allRoutes())('%s points only at pages and assets the build emitted', (route) => {
    const $ = page(route);
    const internal = [...hrefsIn($, 'header a[href]'), ...hrefsIn($, 'footer a[href]')].filter(
      (href) => href.startsWith('/'),
    );

    expect(internal.length).toBeGreaterThan(0);

    const broken = internal.filter(
      (href) => !routeExists(href) && !assetExists(href.replace(/^\//, '')),
    );

    expect(broken).toEqual([]);
  });

  /**
   * Focus visibility, as far as the shipped artefact can show it: the
   * stylesheet every page loads declares a two-pixel focus ring, and nothing
   * in it takes the ring away again. The remaining half — that the ring has
   * enough contrast against the surface it sits on, in both colour schemes —
   * belongs to the budget runner, which can measure colour.
   */
  it.each(allRoutes())('%s shows a keyboard visitor where the focus is', (route) => {
    const css = styles(route);

    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px\s+solid/);
    expect(css).not.toMatch(/outline(-style)?:\s*(none|0)\b/);
  });

  /**
   * A focus ring is worth nothing on a link the keyboard cannot reach. Every
   * navigation and footer link must therefore be a real anchor with a real
   * destination and must not have been taken out of the tab order.
   */
  it.each(allRoutes())('%s keeps every navigation and footer link tabbable', (route) => {
    const $ = page(route);
    const links = $('header a, footer a');

    expect(links.length).toBeGreaterThan(0);

    const unreachable = links
      .map((_, element) => {
        const link = $(element);
        const tabindex = link.attr('tabindex') ?? '0';
        return !link.attr('href') || tabindex.startsWith('-') ? link.text().trim() : '';
      })
      .get()
      .filter(Boolean);

    expect(unreachable).toEqual([]);
  });
});

/**
 * The analytics this site uses is cookie-free, and that is the whole reason a
 * visitor is never interrupted by a consent banner. The rule is asserted over
 * every page so that adding a cookie-setting script fails here, loudly, rather
 * than quietly costing the site its banner-free reading experience.
 */
describe('no page interrupts a visitor about cookies', () => {
  it.each(allRoutes())('%s ships no cookie banner and sets no cookie', (route) => {
    const $ = page(route);

    expect($('dialog, [role="dialog"], [role="alertdialog"]')).toHaveLength(0);

    const scripted = $('script')
      .map((_, element) => $(element).html() ?? '')
      .get()
      .join('\n');
    expect(scripted).not.toMatch(/document\.cookie|localStorage|navigator\.sendBeacon/);

    const controls = $('button, [role="button"], input[type="submit"], input[type="button"]')
      .map(
        (_, element) =>
          `${$(element).text()} ${$(element).attr('value') ?? ''} ${$(element).attr('aria-label') ?? ''}`,
      )
      .get()
      .filter((label) => /cookie|consent|einwillig|zustimm/i.test(label));

    expect(controls).toEqual([]);
  });
});
