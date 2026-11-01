/**
 * What the owner has done, read from the one place it is written.
 *
 * Publications, the career timeline and awards are language-neutral records
 * in `src/data/`, validated by the schemas in `src/collections/`. Every page
 * in either language reads them through this module, so the English list and
 * the Chinese list cannot disagree about how many papers there are: there is
 * only one list.
 *
 * Collection order is not deterministic, so every accessor sorts. The order
 * each one returns is the order a reader wants: a timeline reads forwards
 * from where the history starts, a publication or award list reads backwards
 * from the most recent.
 */
import { type CollectionEntry, getCollection } from 'astro:content';
import type { Fact } from './legal';

export type Award = CollectionEntry<'awards'>['data'];
export type CareerPosition = CollectionEntry<'career'>['data'];
export type Publication = CollectionEntry<'publications'>['data'];

/** A year that is either known or still to be supplied. */
export type RecordedYear = CareerPosition['start'];

/** Whether a year on a record is known, as opposed to an unsupplied fact. */
export function isKnownYear(value: RecordedYear | 'present'): value is number {
  return typeof value === 'number';
}

/** The career timeline, earliest position first — 2012 onwards. */
export async function careerTimeline(): Promise<CareerPosition[]> {
  const positions = await getCollection('career');
  return positions
    .map((entry) => entry.data)
    .sort((a, b) => sortableYear(a.start) - sortableYear(b.start));
}

/**
 * The year the history starts, for the homepage's "since 2012".
 *
 * Derived rather than written twice, so the band and the timeline cannot
 * disagree about when the work began.
 */
export async function careerStartYear(): Promise<number> {
  const years = (await careerTimeline()).map((position) => position.start).filter(isKnownYear);
  if (years.length === 0) throw new Error('No career position carries a start year.');
  return Math.min(...years);
}

/**
 * The current employer's position, or `undefined` when none is marked.
 *
 * The employer is named on the about page and nowhere else, which is why this
 * is a single lookup rather than a field other pages can reach for casually.
 */
export async function currentEmployer(): Promise<CareerPosition | undefined> {
  const marked = (await careerTimeline()).filter((position) => position.employer);
  if (marked.length > 1) {
    throw new Error(`${marked.length} career positions are marked as the current employer.`);
  }
  return marked[0];
}

/** Every peer-reviewed publication, most recent first. */
export async function publicationRecord(): Promise<Publication[]> {
  const publications = await getCollection('publications');
  return publications.map((entry) => entry.data).sort((a, b) => b.year - a.year);
}

/** Every award, most recent first. */
export async function awardRecord(): Promise<Award[]> {
  const awards = await getCollection('awards');
  return awards.map((entry) => entry.data).sort((a, b) => b.year - a.year);
}

/** The organisation a position was held at, as a renderable fact. */
export function organisationOf(position: CareerPosition, chinese: boolean): Fact {
  return chinese ? position.localName ?? position.organisation : position.organisation;
}

/** An unsupplied start year sorts last, since it is the one still open. */
function sortableYear(value: RecordedYear): number {
  return isKnownYear(value) ? value : Number.MAX_SAFE_INTEGER;
}
