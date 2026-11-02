# Collections

One module per collection, each exporting a `defineCollection(...)` value and
registered in `src/content.config.ts`.

Three kinds of content, deliberately separated (see the spec's "Content model"):

- **Writing entries** are markdown with a validated frontmatter schema.
- **Structured records** — publications, career timeline, awards, the teaching
  and talks record, and testimonials — are **language-neutral data**, rendered
  into both languages from one source. Journal names, institution names, dates
  and titles do not need translating, and a single source removes the failure
  mode where the English list gains an entry and the Chinese one does not.
- **Traditional Chinese copy** is prose, and is the one collection whose
  entries are gated on a status. `src/data/zh-copy.yaml` holds every Chinese
  paragraph on the site as `draft` or `approved`, and only an approved
  paragraph renders as copy — the rest render as marked placeholders, so prose
  the owner did not write cannot ship. See `zh-copy.ts`, `src/lib/zh-copy.ts`
  and the decision recorded on issue #13.
