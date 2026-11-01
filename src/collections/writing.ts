/**
 * Writing entries: markdown with a validated frontmatter schema.
 *
 * Publishing a piece is meant to be under ten minutes of mechanical work, and
 * the schema is what buys that. Everything a page needs is declared here once,
 * so an entry is a file and nothing else: no page is edited, no list is kept
 * in step, and a frontmatter block that is wrong **fails the build** instead of
 * rendering a blank title or an "Invalid Date" to a reader.
 *
 * The schema is the one the approved design fixed, minus its `data` stream:
 * professional writing stays on the platform that publishes it and the writing
 * index links out, so `faith` is the only stream hosted here. `.strict()`
 * rejects unknown keys as well, which is what turns a misspelled `drafts: true`
 * into a build error rather than a silently published draft.
 */
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

/**
 * Where entries are read from.
 *
 * `WRITING_CONTENT_DIR` overrides it so that the suite can build this same
 * site against a different set of entries. That is how both branches of the
 * conditional faith navigation are asserted against real built output — an
 * empty stream cannot be observed in a build that has entries in it — and how
 * a deliberately malformed entry is proved to fail the build, without either
 * test moving a file in the working tree. See `tests/writing-build.ts`.
 */
const base = process.env.WRITING_CONTENT_DIR ?? './src/content/writing';

export const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base }),
  schema: z
    .object({
      /** The entry's heading, its browser-tab title, and its link text. */
      title: z.string().min(1),
      /** One sentence, for search results, link previews and the stream index. */
      description: z.string().min(1),
      /** Publication date. Orders the stream and is printed on the entry. */
      date: z.coerce.date(),
      /** The language the entry is written in. */
      lang: z.enum(['en', 'zh']),
      /**
       * Which stream it belongs to. Only `faith` is hosted on this site; the
       * design's `data` stream is gone, so a professional piece that arrives
       * here as markdown by mistake fails the build and gets linked out
       * instead.
       */
      stream: z.enum(['faith']),
      /**
       * The `id` of the counterpart entry in the other language, when the
       * owner has had a piece translated. Carried because the design fixed it
       * and because it is what will make the language switcher appear on an
       * entry; the faith stream is English-only today, since the spec gives
       * Traditional Chinese to exactly five pages and this is not one of them.
       */
      translationOf: z.string().optional(),
      /** An unfinished entry. Never published, and never linked. */
      draft: z.boolean().default(false),
    })
    .strict(),
});
