/**
 * The teaching record, and the Workshop count derived from it.
 *
 * This is the module every other page asks about teaching. The record itself
 * is data (`src/data/teaching.yaml`, validated by `src/collections/teaching.ts`);
 * what lives here is the small number of questions pages ask of it:
 *
 *   - `/teaching/` asks for the whole record, grouped by kind.
 *   - The homepage numbers band asks `workshopCount()`, and writes it with a
 *     plus because the figure is approximate.
 *   - The Workshop service page asks `sessionsOfKind('course')` for the public
 *     Course repositories.
 *
 * `workshopCount()` exists so that no page can ever hold a Workshop figure of
 * its own. The spec's rule is that the claim and the evidence behind it cannot
 * diverge: the number in the band is the length of the list the band links to,
 * so adding a delivered Workshop to the data raises the figure and nothing
 * else has to change. A page that hardcoded the number instead would pass
 * every build and be wrong a month later.
 */
import { getCollection } from 'astro:content';
import { teachingKinds } from '../collections/teaching';
import { type Fact, isUnknown } from './legal';

export { teachingKinds };

/** One of the three kinds of session the record distinguishes. */
export type TeachingKind = (typeof teachingKinds)[number];

/**
 * One session in the record.
 *
 * `title`, `venue` and `date` are `Fact`s: always present, but possibly a
 * declaration of what the owner has yet to supply, which renders as a visible
 * placeholder (`src/components/Fact.astro`). A known `date` is a string at the
 * precision it is known to — `2023`, `2026-11` or `2026-11-05` — never a
 * `Date`, which would invent a day.
 */
export interface TeachingSession {
  /** The entry's key in the data file, stable enough to link to. */
  id: string;
  kind: TeachingKind;
  title: Fact;
  venue: Fact;
  date: Fact;
  /** A continuing appointment: the date is when it started, not when it ran. */
  ongoing: boolean;
  audience?: string;
  format?: string;
  note?: string;
  slides?: string;
  repository?: string;
}

/** Sortable key for a date of any precision; unknown dates sort last. */
function sortKey(session: TeachingSession): string {
  if (isUnknown(session.date)) return '0000-00-00';
  const [year, month = '00', day = '00'] = session.date.split('-');
  return `${year}-${month}-${day}`;
}

/**
 * The whole record, most recent first.
 *
 * `getCollection` makes no promise about order, so the order a visitor sees is
 * decided here rather than by however the loader happened to read the file.
 * Sessions whose date is still to be supplied sort to the end, and `id` breaks
 * ties so that the page is byte-stable between builds.
 */
export async function teachingRecord(): Promise<TeachingSession[]> {
  const entries = await getCollection('teaching');

  return entries
    .map((entry) => ({ ...entry.data, id: entry.id }))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || a.id.localeCompare(b.id));
}

/** The record filtered to one kind, most recent first. */
export async function sessionsOfKind(kind: TeachingKind): Promise<TeachingSession[]> {
  return (await teachingRecord()).filter((session) => session.kind === kind);
}

/**
 * How many Workshops the record evidences — the homepage's figure.
 *
 * Approximate by nature, so a caller writes it with a plus ("15+ Workshops
 * delivered"). It is a count of entries rather than a maintained constant, so
 * the homepage can claim only what the teaching record can show.
 */
export async function workshopCount(): Promise<number> {
  return (await sessionsOfKind('workshop')).length;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * A date written at the precision it is known to: `2023`, `November 2026`,
 * `5 November 2026`, or `Since 2022` for a continuing appointment.
 *
 * Formatted here rather than with `Intl`, so the output does not depend on
 * which locale data the build machine happens to ship.
 */
export function teachingDate(date: string, ongoing = false): string {
  const [year, month, day] = date.split('-');
  const name = month ? months[Number(month) - 1] : undefined;
  const written = day ? `${Number(day)} ${name} ${year}` : name ? `${name} ${year}` : year;

  return ongoing ? `Since ${written}` : written;
}
