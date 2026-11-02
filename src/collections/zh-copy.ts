/**
 * Every Traditional Chinese paragraph on this site, as status-gated entries.
 *
 * The prose that was on the Chinese pages was written by an agent rather than
 * by the owner, and the decision recorded on issue #13 is that only his own
 * Chinese reaches a visitor. So Chinese prose is not written in pages any
 * more: each paragraph is an entry in `src/data/zh-copy.yaml` carrying a
 * `status`, and `src/lib/zh-copy.ts` resolves it to either the approved text
 * or a marked placeholder. Rewriting a paragraph and changing one word to
 * `approved` is the whole publishing step — no page is edited.
 *
 * This is the gate under that. Three things are schema errors rather than
 * quiet mistakes on a page, and each of them is a way the rule could have been
 * defeated by accident:
 *
 *   - an unknown `status`, which would otherwise be neither draft nor approved
 *     and would have to be guessed at;
 *   - an `approved` entry with no text, which would publish a blank where the
 *     page asked for a paragraph;
 *   - an `approved` entry that still contains a `{...}` token. A draft may
 *     carry one to record where the old page dropped a value into the
 *     sentence, because a draft never renders. An approved paragraph is
 *     rendered exactly as written, so the same token would reach a visitor as
 *     a literal `{email}`.
 *
 * YAML rather than JSON, for the same reason as `src/data/teaching.yaml`: this
 * is a file the owner edits by hand, so the instructions for editing it belong
 * inside it, and JSON has nowhere to put a comment. The language-neutral
 * records — career, publications, awards — stay JSON, because nobody hand-
 * writes prose into them.
 */
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Where the paragraphs are read from.
 *
 * `ZH_COPY_FILE` overrides it so that the suite can build this same site
 * against a crafted copy file. That is how the approved branch of the rule is
 * asserted against real built output — nothing is approved yet, so this build
 * cannot show it — without approving the owner's prose on his behalf. See
 * `tests/zh-copy-build.ts`, and `src/collections/writing.ts` for the same
 * mechanism on the writing collection.
 */
const source = process.env.ZH_COPY_FILE ?? './src/data/zh-copy.yaml';

/** What a paragraph may be. Only `approved` renders as copy. */
export const copyStatuses = ['draft', 'approved'] as const;

export const zhCopyEntrySchema = z
  .object({
    /**
     * The paragraph's key, unique across the whole site rather than within a
     * page. A paragraph keeps its key when it moves to another page, so an
     * approved paragraph cannot revert to a draft by being re-keyed — which
     * matters, because the v2 restructure moves several of them.
     */
    id: z.string().regex(/^[a-z0-9-]+$/, 'a key must be lowercase letters, digits and hyphens'),
    status: z.enum(copyStatuses),
    /**
     * What the paragraph has to cover, in English. This is what the owner
     * reads before writing, and what a visitor sees marked on the page while
     * it is unwritten, so it is required on every entry — including one a
     * later ticket adds with no draft text at all.
     */
    brief: z.string().min(20),
    /** Roughly how long the paragraph should be, e.g. "about 3 sentences". */
    length: z.string().min(1),
    /**
     * The paragraph itself. Optional, because a paragraph can be briefed
     * before anything has been written for it; required once the status is
     * `approved`.
     */
    text: z.string().optional(),
  })
  // Rejects a mistyped key outright, so `state: approved` cannot read as a draft.
  .strict()
  .superRefine((entry, context) => {
    if (entry.status !== 'approved') return;

    if (!entry.text?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['text'],
        message: `"${entry.id}" is approved but has no text to render`,
      });
      return;
    }

    if (/[{}]/.test(entry.text)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['text'],
        message:
          `"${entry.id}" is approved but still contains a {...} token, which would ` +
          'reach a visitor literally. Write the sentence without it; the page renders ' +
          'the link or the marked fact beside the paragraph.',
      });
    }
  });

export const zhCopy = defineCollection({
  loader: file(source),
  schema: zhCopyEntrySchema,
});
