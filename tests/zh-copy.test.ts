import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_MARK } from '../src/lib/legal';
import { allRoutes, page } from './site';

/**
 * The Traditional Chinese copy file, and the one guarantee it exists for.
 *
 * The prose that was on the Chinese pages was written by an agent, not by the
 * owner, and the decision on #13 is that only his own Chinese may reach a
 * visitor. Every Chinese paragraph is therefore an entry in
 * `src/data/zh-copy.yaml` carrying a status: an `approved` paragraph renders as
 * copy, a `draft` one renders as a marked placeholder through the site's
 * `unknown()` convention. A draft is saved, versioned and visible to him — and
 * cannot ship.
 *
 * This file asserts that against the built site. The copy file is read here
 * directly, as `tests/about.test.ts` reads `career.json`: asking the reader
 * module what it thinks a draft is could never disagree with it.
 *
 * The other half of the rule — that an *approved* paragraph really does render
 * as copy — cannot be observed in this build, because nothing is approved yet.
 * It gets a build of its own against a synthetic copy file, in
 * `tests/zh-copy-approval.test.ts`.
 */

/** The one file every Chinese paragraph on the site is written in. */
const COPY = join(process.cwd(), 'src/data/zh-copy.yaml');

interface Entry {
  id: string;
  status: 'draft' | 'approved';
  brief: string;
  length: string;
  text?: string;
}

const entries: Entry[] = parse(readFileSync(COPY, 'utf8'));

const drafts = (): Entry[] => entries.filter((entry) => entry.status === 'draft');

describe('the Chinese copy file', () => {
  it('holds every paragraph with a status of draft or approved', () => {
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(['draft', 'approved'], entry.id).toContain(entry.status);
    }
  });

  /**
   * Keys are global rather than per page, so a paragraph can move from one
   * page to another — which this restructure does repeatedly — without being
   * re-keyed and silently reverting to a draft. That only works while no two
   * entries share a key.
   */
  it('keys every paragraph uniquely across the whole site', () => {
    const keys = entries.map((entry) => entry.id);

    expect(new Set(keys).size).toBe(keys.length);
  });

  /**
   * The brief is what the owner actually reads before writing: it has to say
   * what the paragraph covers and roughly how long it should be, in English,
   * because asking him in Chinese would be asking him to read someone else's
   * Chinese to find out what to write.
   */
  it('briefs every paragraph in English, with a length', () => {
    for (const entry of entries) {
      expect(entry.brief.length, entry.id).toBeGreaterThan(20);
      expect(entry.brief, entry.id).not.toMatch(/\p{Script=Han}/u);
      expect(entry.length, entry.id).not.toBe('');
    }
  });
});

/**
 * The criterion this ticket exists for. Asserted over every built page rather
 * than over the two pages that read the file today, so a page a later ticket
 * adds is covered without anyone editing this test.
 */
describe('a draft paragraph', () => {
  it('is what the file currently holds, so the rule below has something to bite on', () => {
    expect(drafts().length).toBeGreaterThan(0);
  });

  it.each(allRoutes())('does not reach %s', (route) => {
    const text = page(route)('body').text();
    const leaked = drafts()
      .filter((entry) => entry.text !== undefined && text.includes(entry.text.trim()))
      .map((entry) => entry.id);

    expect(leaked).toEqual([]);
  });

  /*
   * Deliberately not asserted phrase by phrase, though that would be the
   * stronger rule. The same agent wrote overlapping Chinese in three places
   * this ticket must leave alone — the `role` sentences in the
   * language-neutral career record, the Chinese homepage and confirmation
   * page, and the two Chinese offer pages a later ticket deletes — so a
   * phrase-level rule would pass only behind a list of exclusions covering
   * most of the Chinese site, which is a fiction rather than a rule. The rule
   * that is true today is the one above, and the one over these two pages
   * below. Worth revisiting once every Chinese page reads this file.
   */
});

/**
 * What the two pages show instead. The placeholder is the site's existing
 * `unknown()` convention — `tests/legal.test.ts` already asserts site-wide
 * that no placeholder reaches a visitor outside a `<mark>` — so what is left
 * to assert here is that the page asks for the paragraph at all rather than
 * quietly rendering nothing.
 */
describe('the Chinese pages the copy file already feeds', () => {
  it.each(['/zh/about/', '/zh/contact/'])('%s marks each unwritten paragraph', (route) => {
    const marked = page(route)('main mark')
      .map((_, element) => page(route)(element).text())
      .get();

    const briefs = marked.filter((text) => text.includes('Traditional Chinese'));

    expect(briefs.length).toBeGreaterThan(0);

    for (const brief of briefs) {
      expect(brief).toContain(PLACEHOLDER_MARK);
    }
  });

  /**
   * The point of the whole mechanism, stated as a visitor-observable fact: no
   * sentence of Chinese prose is on these pages. What is ruled out is prose —
   * a run of Chinese long enough to be a sentence — in a paragraph of the
   * page's own.
   *
   * Two families of paragraph are not the page's own and are excluded by name.
   * The record sections render the language-neutral career, publication and
   * award data, which this ticket leaves alone deliberately: they come from
   * `src/data/`, not from prose, and the English and Chinese pages read the
   * same entries. The contact form is a component the spec puts out of scope.
   * Headings and the page title are labels rather than paragraphs, and are the
   * owner's call separately — the same note that leaves the nav labels to him.
   */
  it.each(['/zh/about/', '/zh/contact/'])('%s carries no unapproved prose at all', (route) => {
    const $ = page(route);
    const prose = $('main p')
      .not('#career p, #publications p, #awards p, form p')
      .map((_, element) => $(element).text().replace(/\s+/g, ''))
      .get()
      .filter((text) => (text.match(/\p{Script=Han}/gu) ?? []).length >= 12);

    expect(prose).toEqual([]);
  });
});
