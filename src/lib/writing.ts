/**
 * The two streams of writing, and where each one lives.
 *
 * Professional pieces stay on the platform that already publishes them and the
 * index links out to them. Faith pieces are hosted here as markdown. The split
 * is a necessity rather than tidiness: that platform has one profile and one
 * feed, so a faith piece published there would land in front of every Client
 * who followed the professional writing, which is exactly the separation of
 * professional and faith content the design deliberately built.
 *
 * Both lists are data. Publishing a faith entry means adding one markdown file
 * and listing a professional piece means adding one object below; no page is
 * edited either way.
 */
import { type CollectionEntry, getCollection } from 'astro:content';
import { type Fact, unknown } from './legal';

/** One entry of the writing collection. */
export type WritingEntry = CollectionEntry<'writing'>;

/** Where the faith stream lives. */
export const faithStreamPath = '/writing/faith/';

/** Where one faith entry lives, derived from its file name. */
export function faithEntryPath(entry: WritingEntry): string {
  return `${faithStreamPath}${entry.id}/`;
}

/**
 * Every faith entry the site publishes, newest first.
 *
 * Three things make an entry published, and each exclusion is deliberate:
 *
 *   - its stream is `faith` — the professional stream is not hosted here;
 *   - it is not a draft — an unfinished piece is never linked;
 *   - it is written in the language the stream is published in. The stream is
 *     English-only, because the spec gives Traditional Chinese to exactly five
 *     pages and this is not one of them. A `lang: 'zh'` entry therefore waits
 *     for a Chinese stream rather than shipping Chinese prose on a page that
 *     declares itself English.
 *
 * Awaited once here rather than per page, so the stream index, the entry pages
 * and the navigation all answer from the same list and cannot disagree about
 * what is published.
 */
export const publishedFaithEntries: readonly WritingEntry[] = (
  await getCollection(
    'writing',
    ({ data }) => data.stream === 'faith' && !data.draft && data.lang === 'en',
  )
).sort((first, second) => second.data.date.getTime() - first.data.date.getTime());

/**
 * The routes the faith stream contributes to this build — none of them when
 * nothing is published.
 *
 * `src/lib/i18n.ts` folds these into its route set, which is what the
 * navigation filters against. That is the whole mechanism behind the faith
 * item appearing only when there is something behind it: the rule is derived
 * from the collection in one place, so the navigation, the links on the
 * writing index and the pages the build emits cannot drift apart.
 */
export const faithStreamRoutes: readonly string[] =
  publishedFaithEntries.length === 0
    ? []
    : [faithStreamPath, ...publishedFaithEntries.map(faithEntryPath)];

/** The platform the professional stream is published on. */
export const PROFESSIONAL_PLATFORM = { name: 'Medium', url: 'https://medium.com/' } as const;

/** A piece published somewhere else, listed here so a reader can find it. */
export interface ProfessionalPiece {
  /** The piece's title, as published. */
  title: string;
  /** Its absolute URL on the publishing platform. Never a path on this site. */
  url: string;
  /** The year it was published — enough recency for a few pieces a year. */
  year: number;
}

/**
 * The professional pieces the index lists, newest first.
 *
 * Empty until the owner supplies them. The titles and URLs are his and are not
 * in this repository, so none were invented: the index says what it is waiting
 * for instead, through the site-wide placeholder convention below, and the
 * suite asserts that no unfilled placeholder can reach a visitor unmarked.
 */
export const professionalWriting: readonly ProfessionalPiece[] = [];

/**
 * What the owner still has to supply before the list above says anything.
 *
 * `unknown(...)` and `Fact` come from `src/lib/legal.ts`, where the convention
 * was introduced for the facts German law makes the site publish. The
 * convention is deliberately site-wide rather than legal-only: reusing it is
 * what puts this page under the suite's rule that an unfilled fact is always
 * visible as unfilled, instead of reading as though the blank were the answer.
 */
export const professionalWritingToSupply: Fact = unknown(
  `${PROFESSIONAL_PLATFORM.name} profile URL, and the title, URL and year of each piece to list here`,
);
