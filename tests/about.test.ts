import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, allRoutes, assetExists, page, routeExists } from './site';

describe('the about page', () => {
  it('exists in English and in Traditional Chinese', () => {
    expect(routeExists('/about')).toBe(true);
    expect(routeExists('/zh/about')).toBe(true);
  });
});

/**
 * The records a hiring manager came for. They are held once as
 * language-neutral data, so the only thing that can differ between the two
 * about pages is the prose around them — never the entries themselves.
 */
describe.each(['career', 'publications', 'awards'])('the %s record', (record) => {
  const entries = (route: string): string[] =>
    page(route)(`#${record} li`)
      .map((_, element) => page(route)(element).text().replace(/\s+/g, ' ').trim())
      .get();

  it('renders the same number of entries in both languages', () => {
    const english = entries('/about/');

    expect(english.length).toBeGreaterThan(0);
    expect(entries('/zh/about/')).toHaveLength(english.length);
  });
});

describe('the career timeline', () => {
  const timeline = (route: string): string =>
    page(route)('#career').text().replace(/\s+/g, ' ');

  it.each(['/about/', '/zh/about/'])('%s starts at 2012 and is dated throughout', (route) => {
    const text = timeline(route);
    const years = text.match(/\b(19|20)\d{2}\b/g) ?? [];

    expect(years.length).toBeGreaterThanOrEqual(2);
    expect(Math.min(...years.map(Number))).toBe(2012);
  });

  /**
   * A Taiwanese Researcher places him by recognising NHRI, so the institution
   * has to be on the Chinese page too, not only the English one. The records
   * are language-neutral precisely so that an institution name cannot be lost
   * in one language.
   */
  it.each(['/about/', '/zh/about/'])('%s names NHRI', (route) => {
    expect(timeline(route)).toContain('NHRI');
  });
});

describe('the faith paragraph', () => {
  const faith = (route: string) => page(route)('h2#faith-heading').parent();

  it.each([
    ['/about/', 'Christian'],
    ['/zh/about/', '基督徒'],
  ])('%s names his faith in a paragraph of its own, from day one', (route, named) => {
    const paragraph = faith(route).find('p').text().replace(/\s+/g, ' ').trim();

    expect(paragraph).toContain(named);
    expect(paragraph.length).toBeGreaterThan(80);
  });

  /**
   * It points at the faith stream the moment the stream is built, and at
   * nothing that was not built before then. The stream belongs to another
   * ticket, so both branches are real: the rule is stated as "a link into the
   * writing the stream lives in, if there is one", never a hardcoded path
   * that could 404.
   */
  it.each(['/about/', '/zh/about/'])('%s links into the writing it mentions', (route) => {
    const linked = faith(route)
      .find('a[href]')
      .map((_, element) => page(route)(element).attr('href') ?? '')
      .get();

    for (const href of linked) {
      expect(routeExists(href)).toBe(true);
    }

    if (routeExists('/writing/faith/')) {
      expect(linked).toContain('/writing/faith/');
    }
  });
});

/**
 * The exposure rule: the current employer is named on the about page and
 * nowhere else on the site, so the name never sits beside an offer.
 *
 * The name itself is the owner's to supply, so the test reads it from the one
 * record that holds it rather than hardcoding a company; while it is
 * unsupplied, what the page renders is the marked placeholder, and the rule
 * is asserted against that. Written over `allRoutes()`, so a later ticket
 * that puts the employer on the homepage fails here.
 */
describe('the current employer', () => {
  const PLACEHOLDER = 'TO BE SUPPLIED';

  const career: { employer?: boolean; organisation: string | { unknown: string } }[] = JSON.parse(
    readFileSync(join(process.cwd(), 'src/data/career.json'), 'utf8'),
  );

  const marked = career.filter((position) => position.employer);

  it('is marked on exactly one career position', () => {
    expect(marked).toHaveLength(1);
  });

  const employer = marked[0]?.organisation;
  const named =
    typeof employer === 'string' ? employer : `[${PLACEHOLDER}: ${employer?.unknown ?? ''}]`;

  it('is named on the about page in both languages', () => {
    expect(named.length).toBeGreaterThan(0);
    expect(page('/about/')('body').text()).toContain(named);
    expect(page('/zh/about/')('body').text()).toContain(named);
  });

  it.each(allRoutes().filter((route) => route !== '/about/' && route !== '/zh/about/'))(
    '%s does not name it',
    (route) => {
      expect(page(route)('body').text()).not.toContain(named);
    },
  );
});

/**
 * The PDF CV a hiring manager forwards to a colleague.
 *
 * It is a static asset at a stable path, generated from the same records the
 * about page renders by `scripts/build-cv-pdf.mjs`, so a new paper reaches
 * the CV and both languages from one edit. Its text streams are left
 * uncompressed, which is what lets this suite read what it says.
 */
describe('the PDF CV', () => {
  const cv = (): string => readFileSync(join(DIST, 'cv.pdf'), 'latin1');

  /**
   * What the document says, as continuous text: every drawn string in order,
   * joined, so a phrase still reads as one phrase where the layout wrapped it
   * across two lines.
   */
  const cvText = (): string =>
    (cv().match(/\((.*?)\) Tj/g) ?? [])
      .map((drawn) => drawn.slice(1, -4).replace(/\\([\\()])/g, '$1'))
      .join(' ')
      .replace(/\s+/g, ' ');

  it('exists at a stable path', () => {
    expect(assetExists('cv.pdf')).toBe(true);
  });

  it.each(['/about/', '/zh/about/'])('is linked from %s', (route) => {
    expect(page(route)('main a[href="/cv.pdf"]').length).toBeGreaterThan(0);
  });

  /**
   * The PDF is generated, not maintained by hand, so the risk is a stale
   * copy: a paper added to the records and never regenerated into the CV.
   * Reading the text back out of the document is what makes that visible.
   */
  it('lists the same publications as the records behind the about page', () => {
    const text = cvText();
    const publications: { journal: string; year: number }[] = JSON.parse(
      readFileSync(join(process.cwd(), 'src/data/publications.json'), 'utf8'),
    );

    expect(publications.length).toBeGreaterThan(0);

    for (const publication of publications) {
      expect(text).toContain(publication.journal);
      expect(text).toContain(String(publication.year));
    }
  });

  it('is two pages', () => {
    expect(cv().match(/\/Type\s*\/Page[^s]/g) ?? []).toHaveLength(2);
  });

  /** Inside the document, so the filename — and therefore the link — never changes. */
  it('carries its revision date inside the document', () => {
    expect(cv()).toMatch(/Revision date: \d{4}-\d{2}-\d{2}/);
  });

  /**
   * A German CV traditionally carries a photograph, a date of birth, a
   * nationality, a marital status and a home address. Every one of them is
   * personal data a hiring decision must not rest on, and none of them is
   * anyone's business on a document that gets forwarded, so the CV omits them.
   */
  it('omits the photograph, date of birth, nationality, marital status and home address', () => {
    expect(cv()).not.toMatch(/\/Subtype\s*\/Image/);
    expect(cvText()).not.toMatch(/date of birth|born|nationality|marital|place of birth/i);
  });
});

/**
 * The gate under the records: a record that does not match its schema stops
 * the build, so a mistyped year can never reach a visitor as a wrongly
 * rendered line. Proven by making one — the suite's own build is untouched,
 * the trial build writes to a directory of its own, and the data file is put
 * back whether the expectation holds or not.
 */
describe('a malformed record', () => {
  it('fails the build rather than rendering wrongly', () => {
    const file = join(process.cwd(), 'src/data/publications.json');
    const original = readFileSync(file, 'utf8');
    const malformed = [
      ...JSON.parse(original),
      { id: 'malformed', title: 'A paper', journal: 'A journal', year: 'two thousand and twenty' },
    ];
    const outDir = mkdtempSync(join(tmpdir(), 'cv-malformed-'));

    try {
      writeFileSync(file, JSON.stringify(malformed, null, 2));

      const build = (): void => {
        execFileSync('npx', ['astro', 'build', '--outDir', outDir], {
          stdio: 'pipe',
          env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
        });
      };

      expect(build).toThrow(/publications/);
    } finally {
      writeFileSync(file, original);
      rmSync(outDir, { recursive: true, force: true });
    }
  }, 120_000);
});
