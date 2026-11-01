/**
 * The career timeline, as language-neutral records.
 *
 * A hiring manager should be able to check the history against the claims
 * without arithmetic, so every position carries its own years rather than a
 * duration. `end: "present"` is the one open interval; a year nobody has
 * supplied yet is an `{ unknown }` fact, not a guess.
 */
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { bilingual, fact, year } from './record-fields';

export const career = defineCollection({
  loader: file('./src/data/career.json'),
  schema: z
    .object({
      /** The record's own key, as the `file()` loader requires it. */
      id: z.string().min(1),
      start: z.union([year, z.object({ unknown: z.string().min(1) }).strict()]),
      end: z.union([year, z.literal('present'), z.object({ unknown: z.string().min(1) }).strict()]),
      /** The institution, as it writes its own name. */
      organisation: fact,
      /**
       * The name the institution is known by in Traditional Chinese, where
       * that is how a Taiwanese Researcher would recognise it. The roman
       * name or acronym belongs inside it, so the institution is
       * identifiable on either page.
       */
      localName: z.string().min(1).optional(),
      /** What the post involved. */
      role: bilingual,
      /**
       * Marks the current employer. The employer is named on the about page
       * and nowhere else on the site, so exactly one position may set this
       * and `tests/about.test.ts` asserts where that name may appear.
       */
      employer: z.boolean().default(false),
    })
    .strict(),
});
