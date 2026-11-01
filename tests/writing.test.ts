import type { CheerioAPI } from 'cheerio';
import { describe, expect, it } from 'vitest';
import { allRoutes, page, routeExists } from './site';

const hrefsIn = ($: CheerioAPI, selector: string): string[] =>
  $(selector)
    .map((_, element) => $(element).attr('href') ?? '')
    .get();

/**
 * The writing section: the index, the faith stream, and the rule that keeps
 * the faith item out of the navigation until there is something behind it.
 *
 * Every assertion reads the built HTML. The faith stream's two branches —
 * published and empty — cannot both exist in one build, so the empty branch is
 * asserted against a second build; see `tests/writing-build.ts`.
 */

describe('the writing index', () => {
  it('exists in English', () => {
    expect(routeExists('/writing/')).toBe(true);
  });

  /**
   * The spec gives Traditional Chinese to exactly five pages — home,
   * engineering, statistics, contact, about — and the writing index is not one
   * of them. Asserted rather than assumed, because a Chinese index would have
   * to be maintained alongside the English one and nobody asked for it.
   */
  it('has no Traditional Chinese counterpart', () => {
    expect(routeExists('/zh/writing/')).toBe(false);
  });

  /** The reader's path to it: the spec wants his writing reachable from the main navigation. */
  it('is reachable from the main navigation', () => {
    const navigated = page('/')('header nav a[href]:not([hreflang])')
      .map((_, element) => page('/')(element).attr('href'))
      .get();

    expect(navigated).toContain('/writing/');
  });
});

/**
 * The ownership decision, as a reader can observe it.
 *
 * Professional pieces stay on the platform that already publishes them, so the
 * index links out; faith pieces are hosted here. Both halves are asserted,
 * because a future change that quietly started hosting professional pieces
 * would put them in the same place as the faith stream and undo the separation
 * the design built.
 */
describe('professional writing', () => {
  it('is linked off this site from the index', () => {
    const offSite = hrefsIn(page('/writing/'), 'main a[href]').filter((href) =>
      /^https?:\/\//.test(href),
    );

    expect(offSite.length).toBeGreaterThan(0);
  });

  it('is the only writing the index sends a reader off-site for', () => {
    const onSite = hrefsIn(page('/writing/'), 'main a[href]').filter((href) =>
      href.startsWith('/'),
    );

    expect(onSite.filter((href) => !href.startsWith('/writing/faith/'))).toEqual([]);
  });

  it('is hosted nowhere on this site', () => {
    const hostedUnderWriting = allRoutes().filter(
      (route) =>
        route.startsWith('/writing/') && route !== '/writing/' && !route.startsWith('/writing/faith/'),
    );

    expect(hostedUnderWriting).toEqual([]);
  });
});

/** The entry routes this build emitted, discovered rather than written down. */
const faithEntryRoutes = (): string[] =>
  allRoutes().filter((route) => route.startsWith('/writing/faith/') && route !== '/writing/faith/');

describe('the faith stream', () => {
  it('is hosted on this site', () => {
    expect(routeExists('/writing/faith/')).toBe(true);
    expect(faithEntryRoutes().length).toBeGreaterThan(0);
  });

  /** Traditional Chinese is written for exactly five pages, and this is not one. */
  it('has no Traditional Chinese counterpart', () => {
    expect(allRoutes().filter((route) => route.startsWith('/zh/writing/'))).toEqual([]);
  });

  /**
   * The index is generated from the collection, so it offers every entry the
   * build emitted and nothing that was not built. Both halves are the reason
   * publishing an entry needs no page edit.
   */
  it('lists every published entry and nothing that was not built', () => {
    const listed = hrefsIn(page('/writing/faith/'), 'main a[href^="/writing/faith/"]');

    expect([...new Set(listed)].sort()).toEqual(faithEntryRoutes().sort());
  });

  /**
   * Written as one test over a discovered list rather than `it.each`, because
   * a faith stream with nothing in it is a legitimate state of this site — and
   * `it.each([])` errors instead of reporting it.
   */
  it('renders each published entry from its markdown', () => {
    for (const route of faithEntryRoutes()) {
      const $ = page(route);

      // The frontmatter title is the page's heading and its browser-tab title.
      const heading = $('main h1').text().trim();
      expect(heading, route).not.toBe('');
      expect($('title').text(), route).toContain(heading);

      // The frontmatter date, in a form a machine can read as well as a reader.
      expect($('main time[datetime]').attr('datetime'), route).toMatch(/^\d{4}-\d{2}-\d{2}/);

      // The markdown body became prose, not an unrendered blob of source text.
      const prose = $('main p')
        .map((_, element) => $(element).text().trim())
        .get()
        .filter((text) => text.length > 40);
      expect(prose.length, route).toBeGreaterThan(0);

      // The entry is reachable back from the stream it belongs to.
      expect(hrefsIn($, 'main a[href="/writing/faith/"]').length, route).toBeGreaterThan(0);
    }
  });
});

/**
 * The criterion the spec states twice, in the branch this build can show.
 *
 * The other branch — no entry published, no item in the navigation — cannot
 * exist in the same build as this one, and is asserted against a build of its
 * own in `tests/writing-publishing.test.ts`.
 */
describe('the faith navigation item', () => {
  it('is in the main navigation while a faith entry is published', () => {
    expect(routeExists('/writing/faith/')).toBe(true);

    expect(hrefsIn(page('/'), 'header nav a[href]:not([hreflang])')).toContain('/writing/faith/');
  });
});

/**
 * The separation this whole section is shaped around: a Client evaluating a
 * consultant meets no faith content while doing it. The faith stream is a
 * clearly labelled door in the navigation and on the about page, never
 * something encountered on the way through an offer.
 *
 * Written as one test over the service pages this build emitted, so the ticket
 * that adds them inherits the rule and does not have to find this file. It is
 * vacuous until the first service page exists, which is why it loops rather
 * than using `it.each` — an empty `it.each` errors instead of passing.
 */
describe('no service page', () => {
  const servicePages = (): string[] => allRoutes().filter((route) => route.includes('/services/'));

  it('links into the faith stream or carries faith-stream content', () => {
    for (const route of servicePages()) {
      const $ = page(route);

      expect(hrefsIn($, 'main a[href]').filter((href) => href.includes('/writing/faith')), route).toEqual(
        [],
      );

      expect($('main').text(), route).not.toMatch(/faith|信仰|Glaube/i);
    }
  });
});
