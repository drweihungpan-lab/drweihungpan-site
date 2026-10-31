# drweihungpan-site

Personal website for Dr. Wei-Hung Pan: professional identity, two paid service
lines, and a public body of writing.

Implementation has begun. The lead offer is **Engineering and Analysis** for
clinical research groups: building the data infrastructure a study needs and
running its statistics.

## Start here

- [`GLOSSARY.md`](GLOSSARY.md): the canonical vocabulary — Researcher, Client,
  Engineering, Analysis, Coaching, Workshop, Course. Read this first.
- [v1 build spec](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1)
  (issue #1): the current requirement. **Where it disagrees with the design
  file, the spec wins.**
- [Design spec](docs/superpowers/specs/2026-10-31-personal-website-design.md):
  purpose, audience, offers, information architecture, technical design, legal
  requirements, and the decisions behind each. **Partly superseded** by the v1
  spec — sections 2 through 6, 8, 10 and 11 carry a notice saying what overrode
  them.
- [`docs/adr/`](docs/adr/): decisions that are hard to reverse and would
  otherwise puzzle a future reader.
  - [ADR-0001](docs/adr/0001-engineering-and-analysis-as-lead-offer.md) —
    Engineering and Analysis as the lead offer.
  - [ADR-0002](docs/adr/0002-credit-policy-for-analysis.md) — the credit policy
    for Analysis.

## Developing

Requires Node 20.3 or newer. `npm install`, then:

| Command | What it does |
| --- | --- |
| `npm run verify` | **Builds the site and runs the whole suite.** The one command to run before committing. |
| `npm test` | Runs the suite; it builds the site itself, once. |
| `npm run dev` | Development server with hot reload. |
| `npm run build` | Builds to `dist/`. |
| `npm run check` | Type-checks the Astro and TypeScript sources. |
| `npm run font:subset` | Regenerates the Chinese web font — see below. |

## How this site is tested

**One seam: the built output.** The suite builds the site once and asserts
against the HTML that actually ships, so routing, i18n, content collections and
component composition are all exercised through the artifact a visitor
receives. There are no component-level tests.

An assertion here describes what a visitor can observe. It should survive a
component being rewritten or a class name changing, and fail only when a
visitor's experience changes. Select by role, landmark, text or a semantic
attribute — `a[hreflang]`, `nav[aria-label]`, `link[rel]` — never by a utility
class.

`tests/global-setup.ts` runs `astro build` once per `vitest run`, before any
test file is collected, so adding a test file costs nothing.
`tests/seam.test.ts` asserts that. `SKIP_BUILD=1` reuses an existing `dist/`,
which is how `npm run verify` shares one build between the build step and the
suite.

`tests/site.ts` is the documented helper for querying the build:

| Helper | Returns |
| --- | --- |
| `page(route)` | The route's built HTML as a [cheerio](https://cheerio.js.org) document: `page('/zh/')('h1').text()`. Throws and lists the built routes when the route was not built. |
| `routeExists(route)` | Whether the build emitted a page for that route. |
| `allRoutes()` | Every page the build emitted, as sorted routes. Use it to assert a rule over the whole site, so a page added later is covered without editing the test. |
| `styles(route)` | All CSS the route applies — linked stylesheets plus inline blocks — concatenated. |
| `assetExists(path)`, `assetBytes(path)` | A non-page asset in `dist/`, for existence and payload budgets. |
| `fileFor(route)`, `DIST` | The underlying file and output directory, for assertions the helpers do not cover. |

Largest Contentful Paint, JavaScript weight, font payload and WCAG conformance
cannot be read out of HTML text. They belong to a second seam, the budget
runner, which runs against this same build.

## Typography and the Chinese font

Latin text uses the system font stack and ships no web font, which leaves the
whole font budget for Traditional Chinese.

Traditional Chinese uses Noto Sans TC, subsetted to the characters the site
actually renders and instanced at a single weight — keeping the variable weight
axis measures 152 KB for this glyph set and breaks the 150 KB budget on its
own. The generated `public/fonts/noto-sans-tc-400-subset.woff2` is committed;
the 11.9 MB source font is not. `npm run font:subset` regenerates it,
downloading and caching the source font on first use.

The `@font-face` rule is inlined on Chinese pages only, so an English page
cannot request a web font even by accident. **After adding or editing Chinese
copy, run `npm run font:subset`** — the suite checks that every Chinese
character in the built pages has a glyph in the subset, so forgetting fails the
suite rather than showing a visitor tofu.

## Status

| Stage | State |
| --- | --- |
| Design spec | Approved, partly superseded by the v1 spec (issue #1) |
| v1 build spec | Approved — issue #1, broken into tickets |
| Decision records | ADR-0001 and ADR-0002 recorded |
| Implementation | In progress |
| Published | Blocked — see design §12 (employment contract) |
