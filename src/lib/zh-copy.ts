/**
 * The Traditional Chinese paragraphs, resolved to what a page may render.
 *
 * This is the module every Chinese page asks for its prose. The paragraphs
 * themselves are data (`src/data/zh-copy.yaml`, validated by
 * `src/collections/zh-copy.ts`); what lives here is the one question a page
 * asks of them, and the one rule that makes the answer safe:
 *
 *   **An approved paragraph is copy. Anything else is a marked placeholder.**
 *
 * The decision recorded on issue #13 is that the Chinese on this site is the
 * owner's own. The prose previously on the Chinese pages was written by an
 * agent, which is exactly the failure this exists to make impossible: a draft
 * is kept in the data file, versioned and visible to him, and there is no code
 * path by which it reaches a built page. Rewriting a paragraph and changing
 * one word to `approved` publishes it; no page is edited.
 *
 * A placeholder is not a new convention. It is the site-wide `unknown()` of
 * `src/lib/legal.ts`, rendered by `src/components/Fact.astro` inside a
 * `<mark>`, so an unwritten paragraph is as visibly unfilled as an unsupplied
 * postal address — and the site-wide rule in `tests/legal.test.ts` that no
 * placeholder reaches a visitor unmarked covers it without being extended.
 * The brief it carries is in English, because asking the owner in Chinese what
 * to write would mean asking him to read someone else's Chinese first.
 *
 * `tests/zh-copy.test.ts` asserts the draft half against the built site and
 * `tests/zh-copy-approval.test.ts` the approved half against a crafted copy
 * file.
 */
import { getCollection } from 'astro:content';
import { copyStatuses } from '../collections/zh-copy';
import { type Fact, unknown } from './legal';

export { copyStatuses };

/** Whether a paragraph is the owner's own words yet. */
export type CopyStatus = (typeof copyStatuses)[number];

/** One paragraph, as the data file holds it. */
export interface ZhParagraph {
  /** Its key, unique across the site. See `src/collections/zh-copy.ts`. */
  id: string;
  status: CopyStatus;
  /** What it has to cover, in English. */
  brief: string;
  /** Roughly how long it should be, e.g. "about 3 sentences". */
  length: string;
  /** The prose. Present on every approved paragraph; a draft may have none. */
  text?: string;
}

/**
 * Every paragraph, by key.
 *
 * Awaited once here rather than per page, so every page answers from the same
 * resolved set — the same reason `src/lib/writing.ts` resolves its entries at
 * module scope. It also makes `zhProse` synchronous, so a page reads a
 * paragraph the way it reads any other value.
 */
const paragraphs: ReadonlyMap<string, ZhParagraph> = new Map(
  (await getCollection('zhCopy')).map((entry) => [entry.id, { ...entry.data, id: entry.id }]),
);

/** How an unwritten paragraph reads on the page, and to the owner. */
function briefFor(paragraph: ZhParagraph): string {
  return `Traditional Chinese for "${paragraph.id}" — ${paragraph.brief} Length: ${paragraph.length}.`;
}

/**
 * The paragraph a page should render for this key: the owner's approved
 * Chinese, or a marked placeholder briefing him on what to write.
 *
 * Pass the result to `src/components/Fact.astro`, which renders a string as
 * copy and a placeholder inside a `<mark>`.
 *
 * An unknown key throws rather than rendering nothing. A mistyped key is the
 * one mistake that could put a silent blank where a paragraph was promised,
 * and a blank reads as an answer.
 */
export function zhProse(id: string): Fact {
  const paragraph = paragraphs.get(id);

  if (!paragraph) {
    throw new Error(
      `No Chinese paragraph is keyed "${id}" in src/data/zh-copy.yaml. ` +
        `It holds: ${[...paragraphs.keys()].join(', ')}.`,
    );
  }

  if (paragraph.status === 'approved' && paragraph.text) return paragraph.text.trim();

  return unknown(briefFor(paragraph));
}

/**
 * Every paragraph the file holds, in the order it is written in.
 *
 * For tooling and for a page that needs to know what is still unwritten; a
 * page rendering one paragraph wants `zhProse`.
 */
export function zhParagraphs(): readonly ZhParagraph[] {
  return [...paragraphs.values()];
}
