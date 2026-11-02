import { beforeAll, describe, expect, it } from 'vitest';
import { type CopyTrialBuild, buildWithZhCopy } from './zh-copy-build';

/**
 * What approving a Traditional Chinese paragraph does, and what the gate under
 * it refuses.
 *
 * The other half of the rule — that a draft never ships — is asserted against
 * the suite's own build in `tests/zh-copy.test.ts`. This half cannot be:
 * nothing is approved yet, and approving one of the owner's paragraphs so that
 * a test could watch it render is precisely the thing the rule exists to
 * prevent. So each case here builds the site against a copy file the test
 * wrote. See `tests/zh-copy-build.ts` for why that is safe.
 */

/**
 * Each case below runs an `astro build`, and several test files in this suite
 * now do. A loaded machine can make one take far longer than it does alone,
 * and a timeout here would report as a failure of the rule being asserted.
 */
const A_FEW_MINUTES = 240_000;

/**
 * The paragraph a test approves. Unmistakably a fixture rather than copy: an
 * ASCII sentinel, so an assertion cannot match something else on the page by
 * accident, and two Han characters, so the build is really shown carrying
 * Chinese through to the page.
 */
const APPROVED = 'ZH-COPY-FIXTURE 核准 renders as copy.';

/** The paragraph key the cases below approve: the Chinese contact page's opener. */
const KEY = 'write-in-mandarin';

describe('an approved paragraph', () => {
  let build: CopyTrialBuild;

  beforeAll(() => {
    build = buildWithZhCopy({ [KEY]: { status: 'approved', text: APPROVED } });
  }, A_FEW_MINUTES);

  it('builds', () => {
    expect(build.ok, build.output).toBe(true);
    expect(build.routes).toContain('/zh/contact/');
  });

  it('renders as copy on the page that asks for it', () => {
    expect(build.page('/zh/contact/')('main').text()).toContain(APPROVED);
  });

  /**
   * As copy, not as a placeholder. The whole mechanism is the difference
   * between the two, and `<mark>` is where the site puts something it is
   * admitting it does not have.
   */
  it('is not marked as missing', () => {
    const $ = build.page('/zh/contact/');
    const marked = $('main mark')
      .map((_, element) => $(element).text())
      .get();

    expect(marked.filter((text) => text.includes(APPROVED))).toEqual([]);
  });

  /** Publishing it took one word in one file: no page was edited. */
  it('needed no page edit, and left the unapproved paragraphs marked', () => {
    const $ = build.page('/zh/contact/');
    const briefs = $('main mark')
      .map((_, element) => $(element).text())
      .get()
      .filter((text) => text.includes('Traditional Chinese'));

    expect(briefs.length).toBeGreaterThan(0);
    expect(briefs.join(' ')).not.toContain(KEY);
  });

  /**
   * The brief is what makes a placeholder worth shipping: the owner has to be
   * able to read what the paragraph should cover and roughly how long it
   * should be, in English, without opening the data file.
   */
  it('leaves every other paragraph briefed in English, with a length', () => {
    const $ = build.page('/zh/contact/');
    const briefs = $('main mark')
      .map((_, element) => $(element).text())
      .get()
      .filter((text) => text.includes('Traditional Chinese'));

    for (const brief of briefs) {
      expect(brief).toContain('TO BE SUPPLIED');
      expect(brief).toMatch(/Length: .+\./);
    }

    const drafted = build.entries.filter(
      (entry) => entry.status === 'draft' && entry.id !== KEY && entry.id.length > 0,
    );
    const contactBriefs = drafted.filter((entry) =>
      briefs.some((brief) => brief.includes(`"${entry.id}"`)),
    );

    // The page names its own paragraphs by key, so a brief can be traced back
    // to the entry the owner has to edit.
    expect(contactBriefs.length).toBeGreaterThan(0);
  });

  /** And the draft text of the paragraphs it did not approve still never ships. */
  it('ships none of the remaining drafts', () => {
    const text = build.page('/zh/contact/')('body').text();
    const leaked = build.entries
      .filter((entry) => entry.status === 'draft' && entry.text)
      .filter((entry) => text.includes((entry.text as string).trim()))
      .map((entry) => entry.id);

    expect(leaked).toEqual([]);
  });
});

/**
 * The gate in `src/collections/zh-copy.ts`. Each of these is a way the rule
 * could have been defeated by accident rather than by decision, so each is a
 * build error instead of something a visitor finds.
 */
describe('a copy file that would publish something wrong', () => {
  it(
    'fails the build when an approved paragraph has no text',
    () => {
      const build = buildWithZhCopy({ [KEY]: { status: 'approved', text: '' } });

      expect(build.ok).toBe(false);
      expect(build.output).toContain(KEY);
    },
    A_FEW_MINUTES,
  );

  /**
   * A draft may carry a `{...}` token, which records where the old page
   * dropped a value into the sentence. An approved paragraph is rendered
   * exactly as written, so the same token would reach a visitor as a literal
   * `{email}`.
   */
  it(
    'fails the build when an approved paragraph still holds an interpolation token',
    () => {
      const build = buildWithZhCopy({
        [KEY]: { status: 'approved', text: `ZH-COPY-FIXTURE {email} 核准` },
      });

      expect(build.ok).toBe(false);
      expect(build.output).toMatch(/token/i);
    },
    A_FEW_MINUTES,
  );

  it(
    'fails the build on a status that is neither draft nor approved',
    () => {
      const build = buildWithZhCopy({ [KEY]: { status: 'nearly' } });

      expect(build.ok).toBe(false);
      expect(build.output).toMatch(/status/i);
    },
    A_FEW_MINUTES,
  );

  /**
   * The most expensive mistake the reader module can be asked to make: a page
   * asking for a key nobody wrote. Rendering nothing would leave a silent
   * blank where a paragraph was promised, and a blank reads as an answer, so
   * `zhProse` throws and names the keys it does hold.
   */
  it(
    'fails the build when a page asks for a paragraph the file does not hold',
    () => {
      const build = buildWithZhCopy({ [KEY]: null });

      expect(build.ok).toBe(false);
      expect(build.output).toContain(KEY);
      expect(build.output).toContain('zh-copy.yaml');
    },
    A_FEW_MINUTES,
  );
});
