# Collections

One module per collection, each exporting a `defineCollection(...)` value and
registered in `src/content.config.ts`.

Two kinds of content, deliberately separated (see the spec's "Content model"):

- **Writing entries** are markdown with a validated frontmatter schema.
- **Structured records** — publications, career timeline, awards, the teaching
  and talks record, and testimonials — are **language-neutral data**, rendered
  into both languages from one source. Journal names, institution names, dates
  and titles do not need translating, and a single source removes the failure
  mode where the English list gains an entry and the Chinese one does not.
