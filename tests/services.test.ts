import { describe, expect, it } from 'vitest';
import { allRoutes, page, routeExists } from './site';

/**
 * The two lead offer pages: Engineering and Analysis, in both languages.
 *
 * These are the pages the site is commercially for, so the assertions here are
 * about what a Researcher can read, not about how the page was built: the
 * deliverables each offer names, the credit policy, the absence of prices, the
 * one call to action, and the things the pages promise *not* to do.
 *
 * Every expectation is written per language, because the Chinese pages are
 * native copy rather than a translation and a shared pattern would quietly
 * force them back into the English page's shape.
 */

/** The four routes this ticket builds, keyed by offer and language. */
const ENGINEERING = { en: '/services/engineering/', zh: '/zh/services/engineering/' } as const;
const ANALYSIS = { en: '/services/statistics/', zh: '/zh/services/statistics/' } as const;

const ALL = [ENGINEERING.en, ENGINEERING.zh, ANALYSIS.en, ANALYSIS.zh] as const;

/** The headings a page offers below its title — how it names its deliverables. */
function sections(route: string): string[] {
  const $ = page(route);
  return $('main h2, main h3')
    .map((_, element) => $(element).text().trim())
    .get();
}

/** Whether exactly one of a page's sections is about this thing. */
function namesOne(route: string, pattern: RegExp): boolean {
  return sections(route).filter((heading) => pattern.test(heading)).length === 1;
}

describe('the lead offer pages', () => {
  it.each(ALL)('%s is built', (route) => {
    expect(routeExists(route)).toBe(true);
  });
});

/**
 * ADR-0001 fixes Engineering's four deliverables. They are asserted as named
 * sections rather than as words somewhere in the prose: a Researcher with
 * unusable data is scanning for the one that is their problem, and a phrase
 * buried in a paragraph is not a named deliverable.
 */
describe('Engineering', () => {
  const deliverables = {
    en: [/pipeline/i, /reproducible/i, /app|dashboard/i, /registry|cohort/i],
    zh: [/資料流程/, /可重現/, /應用程式|介面/, /登錄|資料庫/],
  } as const;

  it.each(deliverables.en)('names, in English, the deliverable matching %s', (pattern) => {
    expect(namesOne(ENGINEERING.en, pattern)).toBe(true);
  });

  it.each(deliverables.zh)('names, in Chinese, the deliverable matching %s', (pattern) => {
    expect(namesOne(ENGINEERING.zh, pattern)).toBe(true);
  });
});

/**
 * Analysis covers five things, and Coaching is one of them rather than a
 * consolation prize in a footnote: ADR-0002 leans on it, because a Researcher
 * whose own competence is being graded is sold Coaching or nothing.
 */
describe('Analysis', () => {
  const coverage = {
    en: [/study design/i, /results/i, /publication/i, /review/i, /coaching/i],
    zh: [/研究設計/, /結果/, /投稿/, /審稿/, /一對一指導/],
  } as const;

  it.each(coverage.en)('names, in English, the service matching %s', (pattern) => {
    expect(namesOne(ANALYSIS.en, pattern)).toBe(true);
  });

  it.each(coverage.zh)('names, in Chinese, the service matching %s', (pattern) => {
    expect(namesOne(ANALYSIS.zh, pattern)).toBe(true);
  });
});

/** Every paragraph of a page's own content. */
function paragraphs(route: string): string[] {
  const $ = page(route);
  return $('main p')
    .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
    .get();
}

/** Every item of every list in a page's own content. */
function listItems(route: string): string[] {
  const $ = page(route);
  return $('main li')
    .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
    .get();
}

/**
 * The credit policy, ADR-0002.
 *
 * Three things about it are decisions, not prose, and each is asserted: it is
 * **one** paragraph, so a Researcher can read the whole rule before deciding
 * to email; it decides the three cases in advance, so no engagement has to
 * negotiate them; and it governs Analysis only, so it does not leak onto the
 * Engineering page where no authorship question exists.
 *
 * If this test fails because the copy was reworded, the ADR is the thing to
 * check first: the page and ADR-0002 must say the same thing in both
 * languages.
 */
describe('the credit policy', () => {
  const policy = {
    en: {
      route: ANALYSIS.en,
      rule: [/my name can appear/i, /teach you to run it/i, /Analysis only/i],
      cases: [/thesis/i, /supervisor/i, /stays Coaching/i],
    },
    zh: {
      route: ANALYSIS.zh,
      rule: [/我的名字可以出現/, /教你自己跑/, /只適用於統計分析/],
      cases: [/學位論文/, /指導教授/, /一對一指導/],
    },
  } as const;

  it.each(['en', 'zh'] as const)('states the whole rule in one paragraph (%s)', (language) => {
    const { route, rule } = policy[language];
    const stating = paragraphs(route).filter((text) => rule.every((part) => part.test(text)));

    expect(stating).toHaveLength(1);
  });

  it.each(['en', 'zh'] as const)('decides three cases in advance (%s)', (language) => {
    const { route, cases } = policy[language];
    const items = listItems(route);
    const decided = cases.map((pattern) => items.filter((item) => pattern.test(item)).length);

    expect(decided).toEqual([1, 1, 1]);
  });

  /**
   * ADR-0002 limits the rule to Analysis: nobody is credited as the author of
   * a data pipeline, and a policy repeated where it does not apply reads as a
   * disclaimer rather than as a decision.
   */
  it.each([ENGINEERING.en, ENGINEERING.zh])('is not restated on %s', (route) => {
    const restated = [...paragraphs(route), ...listItems(route)].filter((text) =>
      /my name can appear|我的名字可以出現/.test(text),
    );

    expect(restated).toEqual([]);
  });
});

/**
 * The items listed under the section whose heading matches, read as a visitor
 * reads them: everything between this heading and the next one.
 */
function sectionItems(route: string, heading: RegExp): string[] {
  const $ = page(route);
  const found = $('main h2').filter((_, element) => heading.test($(element).text()));
  return found
    .nextUntil('h2')
    .find('li')
    .add(found.nextUntil('h2').filter('li'))
    .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
    .get();
}

/**
 * How the two offers are sold. Three decisions from the spec, each one a thing
 * a Researcher can check before spending an email: fixed scope rather than
 * hours, a quote rather than a price list, and a plain statement of what is
 * not on offer.
 */
describe('both offer pages', () => {
  const terms = {
    '/services/engineering/': { scope: /fixed-scope/i, quote: /quote/i, refuses: /do not do/i },
    '/services/statistics/': { scope: /fixed-scope/i, quote: /quote/i, refuses: /do not do/i },
    '/zh/services/engineering/': { scope: /固定範圍/, quote: /報價/, refuses: /不做/ },
    '/zh/services/statistics/': { scope: /固定範圍/, quote: /報價/, refuses: /不做/ },
  } as const;

  /**
   * The price gate looks for an amount, not for the word "price": the copy has
   * to be able to say "never an hourly rate" while no rate is ever published.
   */
  const AN_AMOUNT = /(?:[€$£¥]|EUR|USD|TWD|NT\$)\s?[\d,.]*\d|\d[\d,.]*\s?(?:元|歐元|美元|euros?)/i;

  it.each(ALL)('%s sells a fixed scope rather than hours', (route) => {
    expect(page(route)('main').text()).toMatch(terms[route].scope);
  });

  it.each(ALL)('%s asks for an enquiry instead of publishing a price', (route) => {
    const text = page(route)('main').text();

    expect(text).toMatch(terms[route].quote);
    expect(text.match(AN_AMOUNT)).toBe(null);
  });

  it.each(ALL)('%s says plainly what is not on offer', (route) => {
    expect(sectionItems(route, terms[route].refuses).length).toBeGreaterThanOrEqual(3);
  });
});

/**
 * The call to action, and the one rule that keeps it honest while
 * `/contact/` is still another ticket's page.
 *
 * A service page gets exactly one action, into contact, and the page must not
 * ship a link to a page that was never built — the same if-and-only-if rule
 * the language switcher already follows. `ContactCallToAction` therefore
 * renders a link when the contact page exists and the same sentence without
 * one when it does not, so the day contact is built the link appears with no
 * edit here and no edit to either offer page.
 *
 * Both branches are asserted by one expectation, so this test keeps its teeth
 * after the contact ticket lands: today it proves no dangling link, and then
 * it proves the link is there.
 */
describe('the call to action', () => {
  const contactFor = (route: string): string =>
    route.startsWith('/zh/') ? '/zh/contact/' : '/contact/';

  it.each(ALL)('%s offers one region a visitor can act in', (route) => {
    const $ = page(route);
    const action = $('main section[aria-labelledby]');

    expect(action).toHaveLength(1);
    expect($(`#${action.attr('aria-labelledby')}`).text().trim()).not.toBe('');
  });

  it.each(ALL)('%s leads into contact if and only if contact was built', (route) => {
    const $ = page(route);
    const internal = $('main a[href^="/"]')
      .map((_, element) => $(element).attr('href'))
      .get();

    const contact = contactFor(route);
    expect(internal).toEqual(routeExists(contact) ? [contact] : []);
  });
});

/**
 * Every service page the site builds, found rather than listed, so the two
 * site-wide rules below cover a service page a later ticket adds — the
 * Workshop page, the consulting page — without an edit here. That is the point
 * of them: the spec calls both out because a future change would otherwise
 * break them silently.
 */
const serviceRoutes = (): string[] => allRoutes().filter((route) => route.includes('/services/'));

/**
 * No Client is ambushed while evaluating an offer: a service page carries no
 * faith content and no link into the faith stream.
 *
 * Scoped to each page's own content. The faith navigation item is site-wide
 * chrome that appears only once a faith entry is published, and it is governed
 * by the navigation's own rules; what this guards is the offer copy, which is
 * where a well-meant sentence would actually ambush somebody.
 */
describe('no service page', () => {
  const FAITH_WORDS =
    /faith|christian|church|\bgod\b|bible|gospel|prayer|scripture|信仰|基督|教會|上帝|聖經|禱告|福音/i;

  it.each(serviceRoutes())('%s contains no faith content', (route) => {
    expect(page(route)('main').text()).not.toMatch(FAITH_WORDS);
  });

  it.each(serviceRoutes())('%s contains no link into the faith stream', (route) => {
    const $ = page(route);
    const intoFaith = $('main a[href]')
      .map((_, element) => $(element).attr('href') ?? '')
      .get()
      .filter((href) => href.includes('faith'));

    expect(intoFaith).toEqual([]);
  });

  /**
   * The owner's employer is named on the about page and nowhere near an offer,
   * so his exposure stays as low as a public site allows. No employer name
   * exists anywhere in this repository to grep for, so the rule is asserted on
   * the shapes a named employer takes: a company's legal form, or a sentence
   * that places him inside one.
   */
  it.each(serviceRoutes())('%s names no employer', (route) => {
    const text = page(route)('main').text();

    expect(text).not.toMatch(/\b(?:GmbH|AG|SE|Inc\.|Ltd\.|LLC|N\.V\.|S\.A\.|股份有限公司)\b/);
    expect(text).not.toMatch(
      /my employer|i work (?:at|for)|employed (?:at|by)|day job|現職|任職於|我的雇主/i,
    );
  });
});

/**
 * The Chinese pages are written for a Taiwanese Researcher, not translated for
 * one. That is a content decision, so it is asserted as content: each Chinese
 * page names circumstances its English counterpart never mentions — the
 * national claims database as a data source, a promotion review as the real
 * deadline, the IRB submission as the point of no return, and a quotation
 * itemised for grant accounting.
 *
 * A sentence-by-sentence translation of the English page would carry none of
 * them, which is exactly why this test fails for one. The second expectation
 * keeps the pair honest in the other direction too: these are not sentences
 * the English page has in Chinese words.
 */
describe('the Chinese offer pages', () => {
  const natively = [
    { zh: ENGINEERING.zh, en: ENGINEERING.en, markers: [/健保資料庫/, /核銷/, /計畫結案/] },
    { zh: ANALYSIS.zh, en: ANALYSIS.en, markers: [/升等/, /IRB/, /口試/, /核銷/] },
  ];

  it.each(natively)('$zh is written for its own market', ({ zh, en, markers }) => {
    const chinese = page(zh)('main').text();
    const english = page(en)('main').text();

    expect(chinese).toMatch(/\p{Script=Han}/u);
    expect(english).not.toMatch(/\p{Script=Han}/u);

    for (const marker of markers) {
      expect(chinese).toMatch(marker);
      expect(english).not.toMatch(marker);
    }
  });
});
