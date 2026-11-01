/**
 * Peer-reviewed publications, as language-neutral records.
 *
 * Journal names, titles and years do not need translating, so the list is
 * stored once and rendered into both languages. Adding a paper is a one-place
 * edit that updates both.
 */
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { fact, year } from './record-fields';

export const publications = defineCollection({
  loader: file('./src/data/publications.json'),
  schema: z
    .object({
      /** The record's own key, as the `file()` loader requires it. */
      id: z.string().min(1),
      /** The article as it was published. */
      title: fact,
      /** The journal it appeared in. */
      journal: z.string().min(1),
      year,
      /** Where the article can be read, when there is a stable link. */
      url: z.string().url().optional(),
    })
    .strict(),
});
