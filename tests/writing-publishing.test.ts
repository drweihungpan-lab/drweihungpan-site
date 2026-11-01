import { beforeAll, describe, expect, it } from 'vitest';
import { type TrialBuild, buildWithEntries } from './writing-build';

/**
 * What publishing a faith entry costs, and what the site does when there is
 * nothing to publish.
 *
 * Each case here is a state the suite's own build cannot be in at the same
 * time as the others, so each gets a build of its own against a temporary set
 * of entries. See `tests/writing-build.ts` for why that is safe.
 */

const ONE_MINUTE = 60_000;

/** A valid entry. Everything a piece needs is in these five frontmatter lines. */
const entry = (name: string, overrides: Record<string, string> = {}): string => {
  const frontmatter: Record<string, string> = {
    title: `'${name}'`,
    description: `'One sentence about ${name}.'`,
    date: '2026-06-01',
    lang: "'en'",
    stream: "'faith'",
    ...overrides,
  };

  return [
    '---',
    ...Object.entries(frontmatter).map(([key, value]) => `${key}: ${value}`),
    '---',
    '',
    `The prose of ${name}, long enough to be a paragraph a reader would read.`,
    '',
  ].join('\n');
};

/** Every link into the faith stream on a page, chrome included. */
const faithLinksIn = (build: TrialBuild, route: string, within = ''): string[] => {
  const $ = build.page(route);
  return $(`${within} a[href]`.trim())
    .map((_, element) => $(element).attr('href') ?? '')
    .get()
    .filter((href) => href.startsWith('/writing/faith'));
};

/**
 * The criterion the spec states twice: the faith navigation item is absent
 * when no faith entry is published, so the site never shows an empty section.
 *
 * The other branch — the item present — is live in the suite's own build,
 * where `tests/chrome.test.ts` asserts that the navigation offers exactly the
 * architecture's built pages, `/writing/faith/` among them.
 */
describe('a site with no faith entry published', () => {
  let build: TrialBuild;

  beforeAll(() => {
    build = buildWithEntries({});
  }, ONE_MINUTE);

  it('builds', () => {
    expect(build.ok, build.output).toBe(true);
    expect(build.routes).toContain('/');
  });

  it('builds no faith stream at all', () => {
    expect(build.routes.filter((route) => route.startsWith('/writing/faith'))).toEqual([]);
  });

  it('shows no faith navigation item on any page', () => {
    for (const route of build.routes) {
      expect(faithLinksIn(build, route), route).toEqual([]);
    }
  });

  /** The index itself stays: the professional half of the section is unaffected. */
  it('still offers the writing index, with no door into an empty stream', () => {
    expect(build.routes).toContain('/writing/');
    expect(build.page('/writing/')('main').text()).not.toMatch(/faith/i);
  });
});

/**
 * The other half of "publishing is under ten minutes of mechanical work": the
 * frontmatter is validated, so a mistake is a build error and never a page
 * with a blank title or an "Invalid Date" on it.
 */
describe('a malformed entry', () => {
  let build: TrialBuild;

  beforeAll(() => {
    build = buildWithEntries({
      'broken.md': ['---', 'title: 7', "lang: 'martian'", 'draft: yes-please', '---', '', 'Body.', ''].join(
        '\n',
      ),
    });
  }, ONE_MINUTE);

  it('fails the build', () => {
    expect(build.ok).toBe(false);
  });

  it('says which entry and which fields are wrong', () => {
    expect(build.output).toMatch(/writing/);
    expect(build.output).toMatch(/broken/);
    expect(build.output).toMatch(/description/);
    expect(build.output).toMatch(/date/);
  });

  it('emits no page for it', () => {
    expect(build.routes.filter((route) => route.startsWith('/writing/faith'))).toEqual([]);
  });
});

/**
 * An unknown frontmatter key is a mistake too, and the most expensive kind: a
 * misspelled `draft` would publish a piece the owner thinks is unpublished.
 */
describe('an entry with a misspelled key', () => {
  let build: TrialBuild;

  beforeAll(() => {
    build = buildWithEntries({ 'typo.md': entry('Typo', { drafts: 'true' }) });
  }, ONE_MINUTE);

  it('fails the build rather than quietly publishing it', () => {
    expect(build.ok).toBe(false);
    expect(build.output).toMatch(/drafts/);
  });
});

/**
 * Which entries publish, in the one build where all three cases are present.
 * The draft and the untranslated-language entry are the two ways an entry can
 * exist in the repository without being a page.
 */
describe('a mixed set of entries', () => {
  let build: TrialBuild;

  beforeAll(() => {
    build = buildWithEntries({
      'published.md': entry('Published'),
      'unfinished.md': entry('Unfinished', { draft: 'true' }),
      'chinese.md': entry('Chinese', { lang: "'zh'" }),
    });
  }, ONE_MINUTE);

  it('publishes the finished entry', () => {
    expect(build.ok, build.output).toBe(true);
    expect(build.routes).toContain('/writing/faith/published/');
  });

  it('publishes no draft', () => {
    expect(build.routes).not.toContain('/writing/faith/unfinished/');
  });

  /**
   * The faith stream is English-only, because Traditional Chinese is written
   * for exactly five pages and this is not one of them. A Chinese entry
   * therefore waits for a Chinese stream instead of shipping Chinese prose on
   * a page that declares itself English.
   */
  it('publishes no entry written for a language the stream does not have', () => {
    expect(build.routes).not.toContain('/writing/faith/chinese/');
    expect(build.routes.filter((route) => route.startsWith('/zh/writing'))).toEqual([]);
  });

  it('links neither of them from the stream index', () => {
    expect(faithLinksIn(build, '/writing/faith/', 'main').sort()).toEqual([
      '/writing/faith/published/',
    ]);
  });

  /**
   * Publishing took one file: no page, list, route or configuration was
   * touched between this build and the empty one above, and the entry became a
   * page, a line on the index and a navigation item.
   */
  it('needed no page edit to become reachable', () => {
    const $ = build.page('/');
    const navigated = $('header nav a[href]:not([hreflang])')
      .map((_, element) => $(element).attr('href'))
      .get();

    expect(navigated).toContain('/writing/faith/');
  });
});
