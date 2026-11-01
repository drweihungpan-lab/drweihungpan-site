import { describe, expect, it } from 'vitest';
import { allRoutes, page, routeExists } from './site';

/**
 * The Workshop offer page and the quiet consulting page.
 *
 * The buyer here is not a Researcher: it is a team lead with a training budget
 * who wants to judge the material before anyone gets a sales call. So the
 * assertions are the four things that let them do that without emailing —
 * audience, duration, format and learning outcomes per Workshop; the Course
 * syllabus and the public repository it is taught from; whether delivery is
 * even feasible in their country, their room and their language; and where he
 * has taught before.
 *
 * Both pages are English only. The spec puts Traditional Chinese for them out
 * of scope, so they are also live negative cases for the language-switcher
 * rule in `tests/i18n.test.ts`.
 */
const WORKSHOPS = '/services/workshops/';
const CONSULTING = '/services/consulting/';

const ROUTES = [WORKSHOPS, CONSULTING] as const;

describe('the Workshop and consulting pages', () => {
  it.each(ROUTES)('%s is built in English', (route) => {
    expect(routeExists(route)).toBe(true);
  });

  it.each(ROUTES)('%s has no Traditional Chinese counterpart', (route) => {
    expect(routeExists(`/zh${route}`)).toBe(false);
    expect(page(route)('main').text()).not.toMatch(/\p{Script=Han}/u);
  });

  /**
   * The navigation is derived from the routes the build emitted, so these
   * pages appear in the chrome because they exist, with no edit to
   * `src/lib/navigation.ts`. Asserted because it is the claim that makes
   * adding a page cheap.
   */
  it.each(ROUTES)('%s is reachable from the main navigation', (route) => {
    const $ = page('/');
    const linked = $('header nav a[href]')
      .map((_, element) => $(element).attr('href'))
      .get();

    expect(linked).toContain(route);
  });

  /**
   * A page must never link to a page that was not built. `/contact/` is still
   * another ticket's page, so this proves today that neither page ships a
   * dangling link, and after that ticket lands it proves the link resolves.
   */
  it.each(ROUTES)('%s links only to pages that were built', (route) => {
    const $ = page(route);
    const internal = $('main a[href^="/"]')
      .map((_, element) => $(element).attr('href') ?? '')
      .get();

    for (const target of internal) expect(routeExists(target), target).toBe(true);
  });
});

/**
 * The two Course pages of the approved design were deliberately removed: a
 * Course is free material and sells nothing on its own, so its syllabus
 * belongs on the page that is selling the Workshop derived from it. Asserted
 * at the output seam, because the thing to prevent is a future ticket quietly
 * reintroducing the split.
 */
describe('no separate Course route', () => {
  it('is built', () => {
    expect(allRoutes().filter((route) => route.includes('/courses/'))).toEqual([]);
    expect(routeExists('/courses/3r')).toBe(false);
    expect(routeExists('/courses/clinical-data')).toBe(false);
  });
});

/** One Workshop as a buyer meets it: a labelled region with its own facts. */
interface WorkshopBlock {
  title: string;
  /** The labelled facts it states, by label. */
  details: Record<string, string>;
  /** What the team can do afterwards. */
  outcomes: string[];
  links: string[];
  /** Everything the region says, for assertions that span its parts. */
  text: string;
}

/**
 * Every Workshop the page offers, read back out of the shipped HTML.
 *
 * A Workshop is a region labelled by its own heading that states labelled
 * facts, so a test can ask "what does this Workshop say its duration is"
 * without knowing anything about the markup beyond those two semantics. The
 * call to action is a labelled region too, and is excluded by having no facts
 * of its own.
 */
function workshopBlocks(): WorkshopBlock[] {
  const $ = page(WORKSHOPS);

  return $('main section[aria-labelledby]')
    .filter((_, section) => $(section).find('dl dt').length > 0)
    .map((_, section) => {
      const details: Record<string, string> = {};
      $(section)
        .find('dt')
        .each((__, term) => {
          details[$(term).text().trim()] = $(term).next('dd').text().replace(/\s+/g, ' ').trim();
        });

      return {
        title: $(`#${$(section).attr('aria-labelledby')}`).text().trim(),
        details,
        outcomes: $(section)
          .find('ul li')
          .map((__, item) => $(item).text().replace(/\s+/g, ' ').trim())
          .get(),
        links: $(section)
          .find('a[href]')
          .map((__, anchor) => $(anchor).attr('href') ?? '')
          .get(),
        text: $(section).text().replace(/\s+/g, ' ').trim(),
      };
    })
    .get();
}

/**
 * Everything written under the `h2` whose text matches, as a visitor reads it:
 * from that heading to the next one.
 */
function sectionText(route: string, heading: RegExp): string {
  const $ = page(route);
  const found = $('main h2').filter((_, element) => heading.test($(element).text()));

  expect(found.length, `no section heading matching ${heading}`).toBe(1);
  return found.nextUntil('h2').text().replace(/\s+/g, ' ').trim();
}

/** The items listed under the `h2` whose text matches. */
function sectionItems(route: string, heading: RegExp): string[] {
  const $ = page(route);
  const found = $('main h2').filter((_, element) => heading.test($(element).text()));

  return found
    .nextUntil('h2')
    .find('li')
    .map((_, item) => $(item).text().replace(/\s+/g, ' ').trim())
    .get();
}

/**
 * The four facts a team lead needs in order to match a Workshop to their team
 * without a sales call (user story 38). They are asserted as labelled facts
 * rather than as words somewhere in the prose, because a buyer comparing two
 * Workshops is scanning for the one line that disqualifies one of them.
 */
describe('each Workshop', () => {
  it('is offered as its own labelled region', () => {
    expect(workshopBlocks().length).toBeGreaterThanOrEqual(2);

    for (const workshop of workshopBlocks()) expect(workshop.title).not.toBe('');
  });

  it.each(['Audience', 'Duration', 'Format'])('states its %s', (label) => {
    for (const workshop of workshopBlocks()) {
      expect(workshop.details[label], `${workshop.title}: no ${label}`).toBeTruthy();
      expect(workshop.details[label].length).toBeGreaterThan(20);
    }
  });

  it('states learning outcomes a buyer can match against their team', () => {
    for (const workshop of workshopBlocks()) {
      expect(workshop.outcomes.length, workshop.title).toBeGreaterThanOrEqual(3);
      for (const outcome of workshop.outcomes) expect(outcome).not.toBe('');
    }
  });

  /** A duration is a quantity of time, not "flexible" or "to be agreed". */
  const TIME =
    /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen)\s+(?:hours?|days?|half-days?|sessions?)\b/i;

  it('states a duration as a quantity of teaching time', () => {
    for (const workshop of workshopBlocks()) {
      expect(workshop.details['Duration'], workshop.title).toMatch(TIME);
    }
  });

  /**
   * The gate against the one way this page could mislead a buyer: a Workshop
   * sold as a length the material does not have.
   *
   * The duration is the page's own copy — it is the offer, not a historical
   * fact — but the Course it is derived from states its teaching time in the
   * teaching record, and the page renders that line from the data. So the
   * length sold must appear twice inside the same region: once as what is
   * bought, once in the Course's own words. Change the hours in
   * `src/data/teaching.yaml` and this fails until the offer is changed with
   * it.
   */
  it('sells the same number of hours the Course it comes from is taught in', () => {
    for (const workshop of workshopBlocks()) {
      const sold = workshop.details['Duration'].match(TIME);
      expect(sold, workshop.title).not.toBeNull();

      const stated = workshop.text.split(String(sold?.[0])).length - 1;
      expect(stated, `${workshop.title}: "${sold?.[0]}" is not what the Course states`).toBe(2);
    }
  });
});

/**
 * User story 37: the buyer reads the real Course material before contacting
 * anyone. That is the whole commercial logic of the page — the Course is the
 * evidence, the Workshop is what is sold — so the syllabus summary and the
 * public repository are asserted per Workshop rather than somewhere on the
 * page.
 */
describe('the Course behind each Workshop', () => {
  const REPOSITORIES = [
    'https://github.com/drweihungpan-lab/3R-teaching',
    'https://github.com/drweihungpan-lab/clinical-data-teaching',
  ];

  /**
   * A summary, not a link with a label: the buyer has to be able to tell from
   * the page what the material covers before deciding whether to open it. So
   * each Workshop carries a Course sub-heading with real prose under it.
   */
  it('is summarised inside each Workshop rather than only named', () => {
    const $ = page(WORKSHOPS);

    $('main section[aria-labelledby]')
      .filter((_, section) => $(section).find('dl dt').length > 0)
      .each((_, section) => {
        const heading = $(section)
          .find('h3')
          .filter((__, element) => /course/i.test($(element).text()));
        expect(heading.length).toBe(1);

        const summary = heading
          .nextUntil('h3')
          .filter('p')
          .map((__, element) => $(element).text().replace(/\s+/g, ' ').trim())
          .get()
          .join(' ');

        expect(summary.length).toBeGreaterThan(200);
      });
  });

  it('is linked as a public repository from each Workshop', () => {
    for (const workshop of workshopBlocks()) {
      const repositories = workshop.links.filter((link) => /^https:\/\/github\.com\//.test(link));
      expect(repositories.length, workshop.title).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(REPOSITORIES)('%s is reachable from the page', (repository) => {
    const $ = page(WORKSHOPS);
    const linked = $('main a[href]')
      .map((_, anchor) => $(anchor).attr('href'))
      .get();

    expect(linked).toContain(repository);
  });

  /**
   * The links are read out of the teaching record rather than written into
   * this page, so the URL a buyer clicks here is the same string the record
   * shows. Asserted across the two pages, because a hardcoded copy passes
   * every other test in this file and sends a buyer to a 404 the day a
   * repository is renamed.
   */
  it('is linked to the same URL the teaching record shows', () => {
    const hrefsOn = (route: string): string[] => {
      const $ = page(route);
      return $('main a[href^="https://github.com/"]')
        .map((_, anchor) => $(anchor).attr('href') ?? '')
        .get();
    };

    const record = hrefsOn('/teaching/');
    expect(record.length).toBeGreaterThan(0);

    for (const link of hrefsOn(WORKSHOPS)) expect(record).toContain(link);
  });
});

/**
 * User story 39: is delivery even feasible? Three axes, each stated plainly
 * and in one place, so a buyer in Taipei with a remote team does not have to
 * infer an answer from a page written for a room in Berlin.
 */
describe('delivery', () => {
  const axes = [/on-site/i, /remote/i, /Taiwan/, /Germany/, /Mandarin/, /English/];

  it.each(axes)('names the option matching %s', (option) => {
    expect(sectionText(WORKSHOPS, /delivery/i)).toMatch(option);
  });
});

/** User story 40: where he has taught before, so a buyer can judge delivery. */
describe('the teaching record', () => {
  it('is linked from the Workshop page', () => {
    const $ = page(WORKSHOPS);
    const internal = $('main a[href^="/"]')
      .map((_, anchor) => $(anchor).attr('href'))
      .get();

    expect(internal).toContain('/teaching/');
  });
});

/**
 * Platform material development is inbound-only: the spec allows it one
 * sentence and no more — no card, no section of its own, no pursuit. It is
 * asserted because the failure mode is a later edit growing it into an offer
 * the owner never decided to sell.
 */
describe('platform material development', () => {
  it('gets one sentence and nothing else', () => {
    const $ = page(WORKSHOPS);
    const mentions = $('main p')
      .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter((text) => /platform/i.test(text));

    expect(mentions).toHaveLength(1);
    expect(mentions[0].split(/[.!?](?:\s|$)/).filter(Boolean)).toHaveLength(1);
  });

  it('gets no heading, no list and no second mention', () => {
    const $ = page(WORKSHOPS);
    const headings = $('main h2, main h3')
      .map((_, element) => $(element).text())
      .get()
      .filter((text) => /platform/i.test(text));

    const items = $('main li')
      .map((_, element) => $(element).text())
      .get()
      .filter((text) => /platform/i.test(text));

    expect(headings).toEqual([]);
    expect(items).toEqual([]);
    expect($('main').text().match(/platform/gi)).toHaveLength(1);
  });
});

/**
 * The quiet offer. Its scope is what the page is for; the explicit refusal is
 * what makes it honest — a company whose question is a regulatory submission
 * should learn that from the page rather than from a reply days later (user
 * story 29). The exclusion is a decision, not copy: see ADR-0001 and §3 of the
 * design file.
 */
describe('the consulting page', () => {
  it('states its scope as named deliverables', () => {
    const scope = sectionItems(CONSULTING, /scope/i);

    expect(scope.length).toBeGreaterThanOrEqual(3);
    for (const item of scope) expect(item.length).toBeGreaterThan(20);
  });

  it.each([/study design/i, /sample size/i, /analysis plan/i])(
    'names the deliverable matching %s',
    (deliverable) => {
      expect(sectionItems(CONSULTING, /scope/i).some((item) => deliverable.test(item))).toBe(true);
    },
  );

  it('says plainly what is not offered', () => {
    const refused = sectionItems(CONSULTING, /not (?:do|offer)/i);

    expect(refused.length).toBeGreaterThanOrEqual(3);
    for (const item of refused) expect(item.length).toBeGreaterThan(20);
  });

  it('excludes regulatory submission work explicitly', () => {
    const refused = sectionItems(CONSULTING, /not (?:do|offer)/i);
    const regulatory = refused.filter((item) => /regulator/i.test(item));

    expect(regulatory).toHaveLength(1);
    expect(regulatory[0]).toMatch(/submission/i);
  });

  /**
   * ADR-0001 keeps this offer listed and unpromoted: it is in the navigation,
   * which is derived from the routes that were built, and it gets no homepage
   * card. The card half is the homepage's own ticket, so what is asserted here
   * is the rule rather than the implementation — the page must not acquire a
   * route into it from the homepage's own content.
   */
  it('is listed in the navigation but carries no homepage card', () => {
    const $ = page('/');
    const inContent = $('main a[href]')
      .map((_, anchor) => $(anchor).attr('href') ?? '')
      .get()
      .filter((link) => link.includes('consulting'));

    expect(inContent).toEqual([]);
  });
});

/**
 * The site-wide rules in `tests/services.test.ts` run over every route
 * containing `/services/`, so both pages are already covered by the "no faith
 * content and no link into the faith stream" gate and by the "names no
 * employer" gate. What is asserted here is only that they are inside that
 * net — duplicating the content rules would give two places to change when
 * one of them moves.
 */
describe('the site-wide service-page rules', () => {
  it.each(ROUTES)('cover %s', (route) => {
    expect(allRoutes().filter((built) => built.includes('/services/'))).toContain(route);
  });
});
