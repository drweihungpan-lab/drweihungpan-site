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

## The site chrome

Every page is built from `src/layouts/BaseLayout.astro`, which takes a `title`
and a `description` and composes the rest. A new page needs nothing else: the
header, the main navigation, the language switcher, the footer and the legal
links all come with the layout.

| Component | Props | What it does |
| --- | --- | --- |
| `layouts/BaseLayout.astro` | `title`, `description` | The whole page: language attribute, head, skip link, header, `main`, footer. |
| `components/SiteHeader.astro` | `locale`, `siteName`, `counterpart` | Home link, main navigation, language switcher. |
| `components/SiteFooter.astro` | `locale`, `siteName` | Copyright and the legal navigation. |
| `components/LanguageSwitcher.astro` | `locale`, `counterpart` | Renders **only** when `counterpart` is defined. |
| `components/Fact.astro` | `value` | A legal fact from `src/lib/legal.ts`, or a visibly marked placeholder. |

**The navigation is not a list of links anyone maintains.** The information
architecture is declared once in `src/lib/navigation.ts` and every item is
filtered through `routeExists` before it renders. Adding `src/pages/about.astro`
puts *About* in the English navigation; not adding `src/pages/zh/about.astro`
keeps it out of the Chinese one. Nothing links a page that was not built, which
is also why the Chinese navigation shows only the five pages Traditional Chinese
is written for.

**The language switcher renders if and only if a counterpart page exists**, from
`counterpart()` in `src/lib/i18n.ts`. The layout resolves it once and hands it
to the header, so the `hreflang` link in the head and the visible switcher
cannot disagree. The homepage has a counterpart; `/404`, `/impressum/` and
`/privacy/` do not, so both branches of the rule are live in the suite.

**There is no cookie banner and there must never be one.** The analytics is
cookie-free, which is what permits it. `tests/chrome.test.ts` asserts this over
every page, so adding a cookie-setting script fails the suite.

The two legal pages — `/impressum/` (§5 DDG, German, with an English rendering)
and `/privacy/` (GDPR) — have no Traditional Chinese counterparts, by the spec.
Facts the owner has still to supply live in `src/lib/legal.ts` as
`unknown('...')` and render as marked placeholders; filling one in is a one-line
edit that both pages pick up. A new processor anywhere on the site needs a row
in the privacy notice's processor table stating its legal basis, or the suite
fails.

## The writing section

Professional writing stays on the platform that already publishes it and
`/writing/` links out to it. Faith writing is hosted here as markdown, under
`/writing/faith/`. The split is a necessity rather than tidiness: that platform
has one profile and one feed, so a faith piece published there would land in
front of every Client who followed the professional writing, which is exactly
the separation of professional and faith content the design built. No service
page may link into the faith stream or carry its content, and the suite asserts
that over every service page the build emits.

**Publishing a faith entry is one markdown file.** Add it to
`src/content/writing/` with this frontmatter and write the piece:

| Field | |
| --- | --- |
| `title` | The heading, the browser-tab title and the link text. |
| `description` | One sentence, for search results and the stream index. |
| `date` | Publication date. Orders the stream and is printed on the entry. |
| `lang` | `'en'` or `'zh'`. |
| `stream` | `'faith'` — the only stream hosted on this site. |
| `translationOf` | Optional: the `id` of the counterpart entry in the other language. |
| `draft` | Optional, defaults to `false`. |

**No page is edited and nothing is registered.** The file becomes a page at
`/writing/faith/<file-name>/`, a line on the stream index and on the writing
index, and — if it is the first one — the **Faith** item in the main
navigation. The schema is strict, so a missing field, an unparseable date or a
misspelled key **fails the build** rather than reaching a reader as a blank
title. A `draft: true` entry is never published or linked. The faith stream is
English-only, by the spec's five-page limit on Traditional Chinese, so a
`lang: 'zh'` entry waits for a Chinese stream instead of shipping Chinese prose
on a page that declares itself English.

**The faith navigation item exists only while an entry is published**, so the
site never shows an empty section. There is no special case for it anywhere:
`src/lib/writing.ts` derives the faith routes from the collection, and
`src/lib/i18n.ts` folds them into the same route set the navigation already
filters against. Both branches are asserted against built HTML — the published
one in the suite's own build, the empty one in
`tests/writing-publishing.test.ts`, which builds the site again with
`WRITING_CONTENT_DIR` pointing at a temporary directory of entries.

Two things here are waiting for the owner. `src/content/writing/sample-entry.md`
is **sample content**: replacing or deleting it is the first real entry.
`professionalWriting` in `src/lib/writing.ts` is **empty**, because his Medium
profile and the titles and URLs of his pieces are not in this repository and
were not invented — the index says what it is waiting for, through the same
marked-placeholder convention as the legal pages. Listing a piece is one object
in that array; no page is edited for that either.

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
