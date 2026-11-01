/**
 * The teaching record: Courses, Workshops and talks, as language-neutral data.
 *
 * One schema guards two things that would otherwise rot independently. First,
 * the evidence a hiring manager reads: `title`, `venue` and `date` are
 * required on every entry, because an undated session at an unnamed venue is
 * not evidence of delivery experience. Second, the homepage's Workshop figure,
 * which is derived from the `workshop` entries here — see `src/lib/teaching.ts`.
 *
 * `kind` carries the distinction `GLOSSARY.md` makes and the page must not
 * blur: a **Course** is the public material, a **Workshop** is the paid group
 * delivery derived from one, and a talk is a single speaking engagement. Only
 * Workshops are counted, so mislabelling one is a schema error rather than a
 * quiet change to a headline number.
 *
 * A required fact the owner has not supplied yet is written `{ unknown: '...' }`
 * rather than left out: the field stays mandatory, and the value renders as a
 * visible placeholder through `src/components/Fact.astro`. A blank reads as an
 * answer; a mark reads as a gap.
 */
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

/** The three kinds of session the record distinguishes. See `GLOSSARY.md`. */
export const teachingKinds = ['course', 'workshop', 'talk'] as const;

/** A fact the owner has still to supply, mirroring `src/lib/legal.ts`. */
const unsupplied = z.object({ unknown: z.string().min(1) }).strict();

/** A required fact: its value, or a declaration of what is missing. */
const required = z.union([z.string().min(1), unsupplied]);

/**
 * A date written to the precision the owner is actually sure of: `2023`,
 * `2026-11` or `2026-11-05`. Stored as a string rather than coerced to a
 * `Date`, because `new Date('2022')` silently invents the first of January and
 * the page would then claim a day nobody can verify.
 */
const datePrecision = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'a date must be YYYY, YYYY-MM or YYYY-MM-DD, in quotes');

export const teachingEntrySchema = z
  .object({
    /**
     * A slug naming the session, unique in the file. The `file()` loader takes
     * it as the entry's key, so it is declared here as well — `.strict()`
     * rejects what it does not know about, and a silent `id` would be a hole
     * in that guarantee.
     */
    id: z.string().regex(/^[a-z0-9-]+$/, 'an id must be lowercase letters, digits and hyphens'),
    /** Which of the three kinds this session is. Only `workshop` is counted. */
    kind: z.enum(teachingKinds),
    title: required,
    /** The organisation or institution it was delivered to or at. */
    venue: required,
    date: z.union([datePrecision, unsupplied]),
    /** A continuing appointment, which the page renders as "since <date>". */
    ongoing: z.boolean().default(false),
    /** Who it was for — the training buyer's first question. */
    audience: z.string().min(1).optional(),
    /** Duration, session shape and language of delivery. */
    format: z.string().min(1).optional(),
    /** One or two sentences on what it covered. */
    note: z.string().min(1).optional(),
    slides: z.string().url().optional(),
    /** The public Course repository this session is taught from. */
    repository: z.string().url().optional(),
  })
  // Rejects a mistyped key outright, so `repo:` cannot silently drop a link.
  .strict();

export const teaching = defineCollection({
  loader: file('./src/data/teaching.yaml'),
  schema: teachingEntrySchema,
});
