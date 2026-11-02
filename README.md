# drweihungpan-site

Personal website for Dr. Wei-Hung Pan, in English and Traditional Chinese: a
calling card of four pages — about me, professional life, personal life,
contact.

**Nothing on this site is for sale.** It describes the work he does — building
the data infrastructure a clinical study needs and running its statistics — and
states his availability once, in prose, as an invitation. It was first built as
a site of nine navigation items organised around paid offers; the restructure
away from that is in progress.
[Issue #13](https://github.com/drweihungpan-lab/drweihungpan-site/issues/13)
is the shape of it, and
[ADR-0003](docs/adr/0003-a-four-page-calling-card.md) is why.

## Start here

- [`GLOSSARY.md`](GLOSSARY.md): the canonical vocabulary — Researcher,
  Engineering, Analysis, Coaching, Workshop, Course, and the Separation. Read
  this first.
- [v2 spec](https://github.com/drweihungpan-lab/drweihungpan-site/issues/13)
  (issue #13): **the current requirement** — a four-page calling card, not a
  sales site. Where anything else in this repository disagrees with it, it
  wins.
- [v1 build spec](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1)
  (issue #1): **superseded by #13.** Kept for the history of what was built
  first.
- [Design spec](docs/superpowers/specs/2026-10-31-personal-website-design.md):
  purpose, audience, technical design, legal requirements, and the reasoning
  behind each. **Partly superseded** — first by the v1 spec, then by #13. Its
  technical design (§7), legal and compliance (§8) and publication blocker
  (§12) still hold; its positioning, offers, information architecture, page
  specifications and decisions (§§2–6 and §11) do not.
- [`docs/adr/`](docs/adr/): decisions that are hard to reverse and would
  otherwise puzzle a future reader.
  - [ADR-0001](docs/adr/0001-engineering-and-analysis-as-lead-offer.md) —
    Engineering and Analysis as the lead offer. **Amended by ADR-0003**: the
    judgment that the combination is the differentiator still binds; the offer
    pages it prescribed do not.
  - [ADR-0002](docs/adr/0002-credit-policy-for-analysis.md) — the credit policy
    for Analysis. **Superseded by ADR-0003**, which withdraws it: publication
    work is no longer offered, so the policy has nothing left to govern.
  - [ADR-0003](docs/adr/0003-a-four-page-calling-card.md) — a four-page calling
    card, not a sales site. The positioning and information architecture the
    site is built to now.

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
architecture is declared once in `src/lib/navigation.ts` — four items, *About*,
*Professional*, *Personal* and *Contact*, with a label for each language — and
every item is filtered through `routeExists` before it renders. Adding
`src/pages/professional.astro` puts *Professional* in the English navigation;
not adding `src/pages/zh/professional.astro` keeps it out of the Chinese one.
Nothing can link a page that was not built, so the build cannot ship a broken
internal link. Both languages resolve to the same four items, because every
page has a counterpart; the legal links are the exception, and their Chinese
labels name the language a visitor is about to get.

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

## The faith stream

Faith pieces are hosted here as markdown, each with a permalink of its own, and
they are reached from Personal life. The navigation item is labelled *Personal*
rather than *Faith*: a clearly labelled door, not a conviction announced in the
header of every page. **No page outside the personal pages carries faith
content or links into the stream** — that is the Separation in
[`GLOSSARY.md`](GLOSSARY.md), and the suite asserts it over every route the
build emits.

Professional writing is not hosted here and is no longer linked from the site;
the stream's routes move with the restructure in
[#13](https://github.com/drweihungpan-lab/drweihungpan-site/issues/13).

**Publishing a faith entry is one markdown file.** Add it to
`src/content/writing/` with this frontmatter and write the piece:

| Field | |
| --- | --- |
| `title` | The heading, the browser-tab title and the link text. |
| `description` | One sentence, for search results and the list of pieces. |
| `date` | Publication date. Orders the stream and is printed on the entry. |
| `lang` | `'en'` or `'zh'`. |
| `stream` | `'faith'` — the only stream hosted on this site. |
| `translationOf` | Optional: the `id` of the counterpart entry in the other language. |
| `draft` | Optional, defaults to `false`. |

**No page is edited and nothing is registered.** The file becomes a page of its
own and a dated line on the list of pieces, newest first. The schema is strict,
so a missing field, an unparseable date or a misspelled key **fails the build**
rather than reaching a reader as a blank title. A `draft: true` entry is never
published or linked. The stream is English-only, so a `lang: 'zh'` entry waits
for a Chinese stream instead of shipping Chinese prose on a page that declares
itself English.

**A piece has a route only once it is published.** There is no special case for
it anywhere: `src/lib/writing.ts` derives the stream's routes from the
collection, and `src/lib/i18n.ts` folds them into the same route set the
navigation already filters against. Both branches are asserted against built
HTML — the published one in the suite's own build, the empty one in
`tests/writing-publishing.test.ts`, which builds the site again with
`WRITING_CONTENT_DIR` pointing at a temporary directory of entries.

`src/content/writing/sample-entry.md` is **sample content**: replacing or
deleting it is the first real entry.

## Traditional Chinese copy

**No page holds Chinese prose.** Every Chinese paragraph on the site is an
entry in `src/data/zh-copy.yaml`, and each entry carries a status:

| Status | What the page renders |
| --- | --- |
| `approved` | the paragraph, as the owner wrote it |
| `draft` | a marked placeholder carrying an English brief |

The prose that was on the Chinese pages was written by an agent, not by the
owner. The decision recorded on issue #13 is that only his own Chinese reaches
a visitor, so that prose now sits in the copy file as `draft` — saved,
versioned and visible to him, with no code path by which it can ship.
`tests/zh-copy.test.ts` asserts that over every built route.

Writing a paragraph is one file and one word: replace `text:` and change
`status: draft` to `status: approved`. **No page is edited.** The file's own
header is the instructions; `src/collections/zh-copy.ts` is the schema that
makes an unknown status, an approved paragraph with no text, or an approved
paragraph that still holds a `{...}` interpolation token a build error.

A page asks for a paragraph by key through `zhProse(key)` in
`src/lib/zh-copy.ts`, which returns a `Fact` — so it renders through the same
`src/components/Fact.astro` and the same `unknown()` convention as an
unsupplied legal fact, and the site-wide rule that no placeholder reaches a
visitor unmarked covers it already. An unknown key throws rather than
rendering a blank. **Keys are global, not per page**, so a paragraph keeps its
key when it moves to another page and an approved paragraph cannot revert to a
draft by being re-keyed.

The approved branch cannot be observed in a build where nothing is approved,
so it has a build of its own: `tests/zh-copy-approval.test.ts` builds the site
again with `ZH_COPY_FILE` pointing at a copy file the test wrote, the same way
the writing suite uses `WRITING_CONTENT_DIR`.

Headings, page titles and navigation labels are labels rather than paragraphs.
They are the owner's call too, and are not in this file yet.

## The contact form

`/contact/` and `/zh/contact/` carry a plain HTML form that posts to
`functions/api/contact.ts`, a Cloudflare Pages Function served at
`/api/contact`. The function hands the message to Brevo's transactional email
API and answers with a 303 to `/contact/sent/` in the visitor's language.

That shape is the point. There is **no third-party form embed**, so submitting
introduces no processor beyond the one the privacy notice names and sets no
cookie; and because the exchange is post/redirect/get, **the page ships no
JavaScript at all** — the browser validates, the browser submits, and the
confirmation is a static page that can be reloaded without resubmitting.
`src/lib/contact.ts` holds the one contract the form and the function share:
the path, the field names and the confirmation route. Nothing in it may import
Astro at run time, because the function is bundled outside an Astro build.

Three environment variables are needed on the host, `BREVO_API_KEY` as a
secret:

| Variable | What it is |
| --- | --- |
| `BREVO_API_KEY` | Brevo API key (v3). |
| `CONTACT_TO` | The mailbox enquiries are delivered to. |
| `CONTACT_FROM` | A sender address on a domain verified in Brevo. |

The sender is always an address of the site's own, never the visitor's: sending
as the visitor fails SPF and DMARC and lands the message in spam. Their address
goes in `replyTo`, so answering the mail answers them.

**The function is not covered by the suite.** The one seam is the built static
output, which cannot run a serverless function. The suite asserts that the form
posts to it and that the file exists, and nothing more; its validation, its API
call and its redirects need exercising against a real deployment before the
site is published.

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
| Design spec | Approved, partly superseded — by the v1 spec, then by the v2 spec |
| v1 build spec | Superseded by the v2 spec |
| v2 spec | Approved — issue #13, broken into tickets |
| Decision records | ADR-0001 amended, ADR-0002 withdrawn, ADR-0003 recorded |
| Implementation | In progress — restructuring to the four pages of #13 |
| Published | Blocked — see design §12 (employment contract) |
