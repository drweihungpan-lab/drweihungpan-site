/**
 * What the site chrome offers a visitor, in both languages.
 *
 * The information architecture is declared here once, as paths relative to a
 * language root, and every item is filtered through `routeExists` before it is
 * rendered. Two consequences are the point of this module:
 *
 *   - A page a later ticket adds appears in the navigation on its own, with no
 *     edit here and none to `SiteHeader.astro`. A page that does not exist is
 *     never linked, so the build cannot ship a broken internal link.
 *   - The Chinese navigation shrinks to the five pages Traditional Chinese is
 *     written for, because the other counterparts are not built. The same list
 *     serves both languages without a second, drifting copy.
 *
 * Labels are carried for both languages even where only one is built: the
 * label is then ready when the counterpart arrives, and an unused Chinese
 * label costs a few glyphs in the font subset and nothing else.
 */
import { type Locale, href, routeExists } from './i18n';

/** A link the chrome renders: an href that was built, and its label. */
export interface NavLink {
  href: string;
  label: string;
}

interface Declared {
  /** Path under the language root, without surrounding slashes. */
  path: string;
  labels: Record<Locale, string>;
}

/**
 * The main navigation, in the order the spec's architecture lists it.
 *
 * `services/consulting` is listed but deliberately unpromoted: it carries no
 * homepage card. `writing/faith` is the conditional faith item — it is linked
 * only once a faith entry exists, because the page is only built then, so the
 * site never shows an empty section.
 */
const primary: readonly Declared[] = [
  { path: 'services/engineering', labels: { en: 'Engineering', zh: '資料工程' } },
  { path: 'services/statistics', labels: { en: 'Analysis', zh: '統計分析' } },
  { path: 'services/workshops', labels: { en: 'Workshops', zh: '企業課程' } },
  { path: 'services/consulting', labels: { en: 'Consulting', zh: '顧問服務' } },
  { path: 'teaching', labels: { en: 'Teaching', zh: '教學紀錄' } },
  { path: 'writing', labels: { en: 'Writing', zh: '文章' } },
  { path: 'writing/faith', labels: { en: 'Faith', zh: '信仰' } },
  { path: 'about', labels: { en: 'About', zh: '關於' } },
  { path: 'contact', labels: { en: 'Contact', zh: '聯絡' } },
];

/**
 * The legal pages, which every page must reach.
 *
 * They are English and German only — the spec puts a Chinese Impressum out of
 * scope — so the Chinese labels name the language a visitor is about to get
 * rather than promising a page in theirs.
 */
const legal: readonly Declared[] = [
  { path: 'impressum', labels: { en: 'Impressum', zh: 'Impressum（德文）' } },
  { path: 'privacy', labels: { en: 'Privacy notice', zh: '隱私權聲明（英文）' } },
];

function build(declared: readonly Declared[], locale: Locale): NavLink[] {
  return declared
    .map((item) => ({ href: href(locale, item.path), label: item.labels[locale] }))
    .filter((link) => routeExists(link.href));
}

/** The main navigation for this language: only the pages that were built. */
export function primaryNav(locale: Locale): NavLink[] {
  return build(primary, locale);
}

/**
 * The legal links, labelled for this language but always pointing at the one
 * English-and-German Impressum and the one English privacy notice.
 */
export function legalNav(locale: Locale): NavLink[] {
  return legal
    .map((item) => ({ href: href('en', item.path), label: item.labels[locale] }))
    .filter((link) => routeExists(link.href));
}

/** Chrome wording that is not a page label. Page copy lives in pages. */
export const chromeText: Record<
  Locale,
  {
    /** `aria-label` on the main navigation landmark. */
    primaryNavLabel: string;
    /** `aria-label` on the legal navigation landmark in the footer. */
    legalNavLabel: string;
    /** `aria-label` on the language switcher landmark. */
    languageNavLabel: string;
    /** The switcher's own link text, written in the language it leads to. */
    switchTo: Record<Locale, string>;
  }
> = {
  en: {
    primaryNavLabel: 'Main',
    legalNavLabel: 'Legal',
    languageNavLabel: 'Language',
    switchTo: { en: 'English', zh: '中文' },
  },
  zh: {
    primaryNavLabel: '主要導覽',
    legalNavLabel: '法律資訊',
    languageNavLabel: '語言',
    switchTo: { en: 'English', zh: '中文' },
  },
};
