/**
 * The field shapes the structured records share.
 *
 * Not a collection: `publications`, `career` and `awards` are three lists of
 * the same kind of thing — language-neutral records of what the owner has
 * done — and these fragments are what makes them consistent. Keeping them in
 * one module means a reviewer can see in one place which fields are allowed
 * to carry language and which are not.
 */
import { z } from 'astro/zod';

/**
 * A proper noun or a date: the same in both languages, so stored once.
 *
 * It may instead be a fact the owner has not supplied yet, written as
 * `{ "unknown": "what is missing" }`, which matches the `Fact` type in
 * `src/lib/legal.ts` and renders through `src/components/Fact.astro` as a
 * visibly marked placeholder. A record is never invented to fill a gap, and a
 * gap is never silently blank.
 */
export const fact = z.union([
  z.string().min(1),
  z.object({ unknown: z.string().min(1) }).strict(),
]);

/**
 * The exception to language neutrality: a phrase that *is* language, such as
 * what a role involved. Both languages are required, in one entry, so a
 * record cannot exist in English and be missing in Chinese — which is the
 * failure mode the single source exists to prevent.
 */
export const bilingual = z
  .object({ en: z.string().min(1), zh: z.string().min(1) })
  .strict();

/** A four-digit year within the owner's working life. */
export const year = z.number().int().gte(1990).lte(2100);
