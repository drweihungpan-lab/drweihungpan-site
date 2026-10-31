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
});
