/**
 * The two languages this site ships, and the rules that keep them honest.
 *
 * English is served at the root, Traditional Chinese under `/zh/`. A page
 * exists in Chinese only where a file exists for it, so nothing ever links to
 * a page that is not there.
 */
import { getRelativeLocaleUrl } from 'astro:i18n';
import { faithStreamRoutes } from './writing';

export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * The BCP 47 language tag for a locale.
 *
 * `Astro.currentLocale` is a routing segment, not a language tag: it yields
 * `'zh'`, which denotes Chinese without saying which script. Traditional
 * Chinese is `zh-Hant`, and a screen reader needs the tag, not the segment.
 */
const languageTags: Record<Locale, string> = { en: 'en', zh: 'zh-Hant' };

export function languageTag(locale: Locale): string {
  return languageTags[locale];
}

/** Narrows `Astro.currentLocale` to a known locale, falling back to English. */
export function resolveLocale(value: string | undefined): Locale {
  return (locales as readonly string[]).includes(value ?? '') ? (value as Locale) : defaultLocale;
}

/** The language a visitor would switch to from this one. */
export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh' : 'en';
}

/** A locale-aware href: `href('zh', 'contact')` -> `/zh/contact/`. */
export function href(locale: Locale, path = ''): string {
  return getRelativeLocaleUrl(locale, path);
}

/**
 * Every route this site builds.
 *
 * Astro has no "does this route exist" API, so the set is derived from the
 * page files at build time. `import.meta.glob` is evaluated by Vite against
 * the filesystem; only the keys are used, so no page module is ever loaded.
 *
 * Dynamic routes (`[slug].astro`) appear here literally and will not match a
 * concrete pathname. A collection-backed page must find its counterpart
 * through the collection instead.
 */
const pageFiles = Object.keys(import.meta.glob('/src/pages/**/*.astro'));

/**
 * A page file answers for a static page, because the file and the route are
 * the same thing. A collection-backed route is not: the faith stream's page
 * file is always there and its route is built only while a faith entry is
 * published. Such a route has to say so, derived from the collection — which
 * is what makes the faith navigation item appear only when there is something
 * behind it. See `src/lib/writing.ts`.
 */
export const routes: ReadonlySet<string> = new Set([
  ...pageFiles.map(
    (file) =>
      `${file.replace('/src/pages', '').replace(/\.astro$/, '').replace(/\/index$/, '')}/`.replace(
        /^\/?/,
        '/',
      ),
  ),
  ...faithStreamRoutes,
]);

/** Normalises a pathname to the trailing-slash form the route set uses. */
function normalise(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

/** Whether this site builds a page at this pathname. */
export function routeExists(pathname: string): boolean {
  return routes.has(normalise(pathname));
}

/**
 * The same page in the other language, or `undefined` when it does not exist.
 *
 * This is the mechanism behind the rule that a language switcher appears if
 * and only if there is somewhere to switch to. Callers render nothing when it
 * returns `undefined`.
 */
export function counterpart(pathname: string): string | undefined {
  const here = normalise(pathname);
  const isZh = here === '/zh/' || here.startsWith('/zh/');
  const there = isZh ? here.slice('/zh'.length) || '/' : `/zh${here}`;
  return routes.has(there) ? there : undefined;
}

/** Page chrome that must read in both languages. Page copy lives in pages. */
export const chrome: Record<Locale, { skipToContent: string; siteName: string }> = {
  en: { skipToContent: 'Skip to content', siteName: 'Dr. Wei-Hung Pan' },
  zh: { skipToContent: '跳到主要內容', siteName: 'Dr. Wei-Hung Pan' },
};
