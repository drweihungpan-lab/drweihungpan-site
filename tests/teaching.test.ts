import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { afterAll, describe, expect, it } from 'vitest';
import { page, routeExists } from './site';

/** The one file the whole record is edited in. */
const DATA = join(process.cwd(), 'src/data/teaching.yaml');

const builds: string[] = [];

afterAll(() => {
  for (const directory of builds) rmSync(directory, { recursive: true, force: true });
});

/**
 * Builds the site again from a rewritten data file, into its own output
 * directory, and returns what happened.
 *
 * This is the only way to assert the two claims this ticket is really about:
 * that the Workshop figure is *derived* — it moves when the data moves, so a
 * future hardcoded number fails instead of quietly going stale — and that a
 * malformed entry stops the build. Both are properties of the build itself,
 * not of one page's markup, so one build cannot demonstrate either.
 *
 * `--outDir` keeps `dist/` — which every other test reads — untouched, and
 * `--force` clears the content-layer cache so the rewritten file is really the
 * one that is read. The original file is restored whatever happens.
 */
function rebuildWith(data: string): { failed: boolean; log: string; page: cheerio.CheerioAPI } {
  const original = readFileSync(DATA, 'utf8');
  const out = mkdtempSync(join(process.cwd(), 'dist-variant-'));
  builds.push(out);

  try {
    writeFileSync(DATA, data);
    execFileSync('npx', ['astro', 'build', '--force', '--outDir', out], {
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    });
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string };
    return {
      failed: true,
      log: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
      page: cheerio.load(''),
    };
  } finally {
    writeFileSync(DATA, original);
  }

  return {
    failed: false,
    log: '',
    page: cheerio.load(readFileSync(join(out, 'teaching', 'index.html'), 'utf8')),
  };
}

/** The Workshop figure the page states, read out of its prose. */
function statedWorkshops($: cheerio.CheerioAPI): number {
  const stated = $('main').text().match(/(\d+)\s+Workshops?\b/);

  expect(stated, `no Workshop figure in: ${$('main p').first().text()}`).not.toBeNull();
  return Number(stated?.[1]);
}

/** How many Workshop entries the page actually lists. */
function listedWorkshops($: cheerio.CheerioAPI): number {
  return $('main section')
    .filter((_, section) => $(section).find('h2').first().text().trim() === 'Workshops')
    .find('article').length;
}

/**
 * The teaching record: where he has taught, with dates and venues.
 *
 * Two visitors are served by one page. A team lead with a training budget is
 * asking whether he can hold a room; a hiring manager is verifying delivery
 * experience against a claim. Both need the same thing — dated sessions at
 * named venues — so the page is one record rather than two.
 *
 * It is English only. The spec puts Traditional Chinese for the teaching
 * record out of scope, so this page is also a live negative case for the
 * language-switcher rule in `tests/i18n.test.ts`.
 */
describe('the teaching record', () => {
  it('exists in English and has no Traditional Chinese counterpart', () => {
    expect(routeExists('/teaching')).toBe(true);
    expect(routeExists('/zh/teaching')).toBe(false);
  });

  /**
   * The navigation is derived from the routes the build emitted, so a page
   * appearing in the chrome is a consequence of the page existing. Asserted
   * because it is the claim that makes adding a page cheap.
   */
  it('is reachable from the main navigation', () => {
    const linked = page('/')('header nav a[href]')
      .map((_, element) => page('/')(element).attr('href'))
      .get();

    expect(linked).toContain('/teaching/');
  });
});

/** One rendered session: its kind section, and the labelled details it carries. */
interface RenderedSession {
  kind: string;
  title: string;
  details: Record<string, string>;
  links: { label: string; href: string | undefined }[];
}

/**
 * Every session the record renders, read back out of the shipped HTML.
 *
 * Sessions are `article` elements under the `h2` of the kind they belong to,
 * and each carries its facts as a labelled description list, so a test can ask
 * "what does this entry say its venue is" without knowing anything about the
 * page's markup beyond those two semantics.
 */
function renderedSessions(): RenderedSession[] {
  const $ = page('/teaching/');
  const sessions: RenderedSession[] = [];

  $('main section').each((_, section) => {
    const kind = $(section).find('h2').first().text().trim();

    $(section)
      .find('article')
      .each((__, article) => {
        const details: Record<string, string> = {};
        $(article)
          .find('dt')
          .each((___, term) => {
            details[$(term).text().trim()] = $(term).next('dd').text().trim();
          });

        sessions.push({
          kind,
          title: $(article).find('h3').first().text().trim(),
          details,
          links: $(article)
            .find('a')
            .map((___, anchor) => ({
              label: $(anchor).text().trim(),
              href: $(anchor).attr('href'),
            }))
            .get(),
        });
      });
  });

  return sessions;
}

describe('the sessions in the record', () => {
  /**
   * The three kinds are the vocabulary of `GLOSSARY.md`: a **Course** is the
   * public material, a **Workshop** is the paid group delivery derived from
   * one, and a talk is a single speaking engagement. They are separated on the
   * page because a training buyer and a hiring manager read them differently.
   */
  it('separates Courses, Workshops and talks', () => {
    const kinds = new Set(renderedSessions().map((session) => session.kind));

    expect(kinds).toContain('Courses');
    expect(kinds).toContain('Workshops');
    expect(kinds).toContain('Talks');
  });

  it('places every session under exactly one kind', () => {
    const $ = page('/teaching/');

    expect($('main article').length).toBeGreaterThan(0);
    expect($('main section article').length).toBe($('main article').length);
    expect(renderedSessions().length).toBe($('main article').length);
  });

  /**
   * The hiring manager's requirement, and the reason the schema makes both
   * fields mandatory: a session nobody can date or place is not evidence of
   * delivery experience.
   */
  it('gives every session a date and a venue', () => {
    expect(renderedSessions().length).toBeGreaterThan(0);

    for (const session of renderedSessions()) {
      expect(session.title).not.toBe('');
      expect(session.details['Date']).toBeTruthy();
      expect(session.details['Venue']).toBeTruthy();
    }
  });

  /** A machine-readable date, so the record is parseable and sortable. */
  it('marks up each known date as a machine-readable date', () => {
    const $ = page('/teaching/');
    const stamps = $('main time')
      .map((_, element) => $(element).attr('datetime'))
      .get();

    expect(stamps.length).toBeGreaterThan(0);
    for (const stamp of stamps) expect(stamp).toMatch(/^\d{4}(-\d{2}){0,2}$/);
  });

  /**
   * A training buyer judges quality by reading the real material, so the
   * public Course repositories are linked from the record as well as from the
   * Workshop page.
   */
  it('links the public Course repositories and the slides that exist', () => {
    const labels = (session: RenderedSession): string[] =>
      session.links.map((link) => link.label);
    const sessions = renderedSessions();

    const repositories = sessions.filter((session) => labels(session).includes('Course repository'));
    const slides = sessions.filter((session) => labels(session).includes('Slides'));

    expect(repositories.length).toBeGreaterThan(0);
    expect(slides.length).toBeGreaterThan(0);

    const hrefs = sessions.flatMap((session) => session.links.map((link) => link.href));
    expect(hrefs).toContain('https://github.com/drweihungpan-lab/3R-teaching');
    expect(hrefs).toContain('https://github.com/drweihungpan-lab/clinical-data-teaching');
  });

  /**
   * The other half of that rule, and the one a page gets wrong: a session with
   * no slides must render no "Slides" affordance at all, rather than a label
   * with nothing behind it or a link to nowhere. Both branches are live in the
   * data — some sessions carry both links, some carry one, some carry none.
   */
  it('renders no affordance for a link a session does not have', () => {
    const sessions = renderedSessions();

    expect(sessions.some((session) => session.links.length === 0)).toBe(true);
    expect(sessions.some((session) => session.links.length === 1)).toBe(true);

    for (const link of sessions.flatMap((session) => session.links)) {
      expect(link.label).not.toBe('');
      expect(link.href).toMatch(/^https:\/\/\S+$/);
    }

    // An empty paragraph is the usual shape of a link row that rendered with
    // nothing in it, so it is asserted away over the whole page.
    const $ = page('/teaching/');
    const blank = $('main p')
      .map((_, element) => $(element).text().trim())
      .get()
      .filter((text) => text === '');

    expect(blank).toEqual([]);
  });

  /** The venues the design file evidences, which are why the page is credible. */
  it('names the venues he has actually taught at', () => {
    const venues = renderedSessions().map((session) => session.details['Venue'] ?? '');

    expect(venues.some((venue) => venue.includes('National Tsing Hua University'))).toBe(true);
    expect(
      venues.some((venue) => venue.includes('University of Europe for Applied Sciences')),
    ).toBe(true);
    expect(venues.some((venue) => venue.includes('Berliner Hochschule für Technik'))).toBe(true);
  });
});

/**
 * The claim this ticket exists for.
 *
 * The homepage numbers band says "15+ Workshops delivered" and links here, so
 * the figure has to be the length of this list rather than a number somebody
 * typed into the homepage. `workshopCount()` in `src/lib/teaching.ts` is the
 * one accessor both pages read, and this page states the figure too — which is
 * what lets the rule be tested without the homepage existing yet.
 */
describe('the derived Workshop count', () => {
  it('matches the number of Workshops the record lists', () => {
    const $ = page('/teaching/');

    expect(listedWorkshops($)).toBeGreaterThan(0);
    expect(statedWorkshops($)).toBe(listedWorkshops($));
  });

  /**
   * The regression test against a future hardcoded number: add one Workshop to
   * the data and nothing else, and the figure must move with it. A hardcoded
   * count passes the test above and fails this one.
   *
   * It also verifies the owner's five-minute promise literally — the only edit
   * made here is one entry appended to the data file, with no page touched.
   */
  it('moves when a Workshop is added to the data, with no page change', { timeout: 120_000 }, () => {
    const added = `${readFileSync(DATA, 'utf8')}
- id: workshop-added-by-a-test
  kind: workshop
  title: A Workshop added by a test
  venue: A venue added by a test
  date: "2025-06"
`;
    const before = page('/teaching/');
    const after = rebuildWith(added);

    expect(after.failed, after.log).toBe(false);
    expect(statedWorkshops(after.page)).toBe(statedWorkshops(before) + 1);
    expect(listedWorkshops(after.page)).toBe(listedWorkshops(before) + 1);
    expect(after.page('main').text()).toContain('A venue added by a test');
  });
});

/**
 * The owner's rule that a mistake never reaches a visitor: the schema in
 * `src/collections/teaching.ts` is a build gate, not documentation.
 */
describe('a malformed entry', () => {
  const cases: { what: string; entry: string; expected: RegExp }[] = [
    {
      what: 'a kind that is not one of the three',
      entry: `- id: bad-kind
  kind: seminar
  title: Something
  venue: Somewhere
  date: "2024-01"
`,
      expected: /kind/i,
    },
    {
      what: 'a session with no venue',
      entry: `- id: no-venue
  kind: talk
  title: Something
  date: "2024-01"
`,
      expected: /venue/i,
    },
    {
      what: 'a date that is not a date',
      entry: `- id: bad-date
  kind: talk
  title: Something
  venue: Somewhere
  date: last spring
`,
      expected: /date/i,
    },
    {
      what: 'a mistyped key, which would otherwise drop a link silently',
      entry: `- id: mistyped-key
  kind: talk
  title: Something
  venue: Somewhere
  date: "2024-01"
  repo: https://example.com/
`,
      expected: /repo/i,
    },
  ];

  it.each(cases)('fails the build: $what', { timeout: 120_000 }, ({ entry, expected }) => {
    const result = rebuildWith(`${readFileSync(DATA, 'utf8')}\n${entry}`);

    expect(result.failed).toBe(true);
    expect(result.log).toMatch(/does not match collection schema/);
    expect(result.log).toMatch(expected);
  });
});
