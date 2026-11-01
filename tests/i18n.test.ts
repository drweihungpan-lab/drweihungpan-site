import { describe, expect, it } from 'vitest';
import { allRoutes, page, routeExists } from './site';

/**
 * The language rule as the spec states it, restated here rather than imported
 * from `src/lib/i18n.ts`. A test that asked the implementation what it thinks
 * the counterpart is could never disagree with it.
 */
const isChinese = (route: string): boolean => route === '/zh/' || route.startsWith('/zh/');

const counterpartOf = (route: string): string =>
  isChinese(route) ? route.slice('/zh'.length) || '/' : `/zh${route}`;

const languageOf = (route: string): string => (isChinese(route) ? 'zh-Hant' : 'en');

describe('the homepage in two languages', () => {
  it('is served in English at the root', () => {
    expect(routeExists('/')).toBe(true);
  });

  it('is served in Traditional Chinese under its prefix', () => {
    expect(routeExists('/zh/')).toBe(true);
    expect(page('/zh/')('html').attr('lang')).toBe('zh-Hant');
  });
});

describe('every built page', () => {
  it.each(allRoutes())('%s declares the language it is written in', (route) => {
    expect(page(route)('html').attr('lang')).toBe(languageOf(route));
  });

  /**
   * The rule a visitor cares about: never offer a language that is not there.
   * Written over every built page, so a page a later ticket adds is covered
   * without editing this test.
   */
  it.each(allRoutes())(
    '%s points at the other language if and only if that page was built',
    (route) => {
      const counterpart = counterpartOf(route);
      const $ = page(route);
      const announced = $('link[rel="alternate"][hreflang]')
        .map((_, element) => $(element).attr('href'))
        .get();

      expect(announced).toEqual(routeExists(counterpart) ? [counterpart] : []);

      if (announced.length === 1) {
        expect($('link[rel="alternate"]').attr('hreflang')).toBe(languageOf(counterpart));
      }
    },
  );

  /**
   * The same rule as the head link, but the half a visitor can see and click:
   * a switcher appears on a page if and only if its counterpart was built, so
   * nobody is offered a language that is not there. Both branches are live —
   * the homepage has a counterpart; `/404`, `/impressum/` and `/privacy/` do
   * not — and a page a later ticket adds is covered without editing this test.
   */
  it.each(allRoutes())(
    '%s offers a visible language switcher if and only if that page was built',
    (route) => {
      const counterpart = counterpartOf(route);
      const switcher = page(route)('header nav[aria-label] a[hreflang]');

      if (!routeExists(counterpart)) {
        expect(switcher).toHaveLength(0);
        return;
      }

      expect(switcher).toHaveLength(1);
      expect(switcher.attr('href')).toBe(counterpart);
      expect(switcher.attr('hreflang')).toBe(languageOf(counterpart));

      // Labelled in the language it leads to, so it reads to the visitor it is for.
      expect(switcher.text().trim()).not.toBe('');
    },
  );
});
