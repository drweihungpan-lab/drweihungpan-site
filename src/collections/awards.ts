/**
 * Awards, as language-neutral records.
 *
 * The award's name and the body that gave it are proper nouns and are not
 * translated; only the line explaining what it was for carries language.
 */
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { bilingual, year } from './record-fields';

export const awards = defineCollection({
  loader: file('./src/data/awards.json'),
  schema: z
    .object({
      /** The record's own key, as the `file()` loader requires it. */
      id: z.string().min(1),
      /** The award as the awarding body names it. */
      title: z.string().min(1),
      /** Who gave it. */
      awarder: z.string().min(1),
      year,
      /** One sentence on what it was awarded for. */
      detail: bilingual,
    })
    .strict(),
});
