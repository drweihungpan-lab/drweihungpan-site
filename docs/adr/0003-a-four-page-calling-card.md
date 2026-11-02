# ADR-0003: A four-page calling card, not a sales site

- **Status:** accepted
- **Date:** 2026-11-02
- **Supersedes:** ADR-0002, *the credit policy for Analysis*, which is withdrawn
- **Amends:** ADR-0001, *Engineering and Analysis as the lead offer* — its
  judgment survives, the page structure it prescribed does not
- **Spec:**
  [issue #13](https://github.com/drweihungpan-lab/drweihungpan-site/issues/13),
  *v2 spec: a four-page calling card, not a sales site*

## Context

The v1 site was built to sell. Nine navigation items, four of them offer pages,
a Workshop syllabus as the heaviest page on the site, a call-to-action block at
the foot of every offer, and a glossary that defined a **Client** as someone who
pays. Each piece followed from a decision taken deliberately and recorded here:
ADR-0001 chose the lead offer and the shape of the pages that carry it, ADR-0002
decided the authorship rule that governs Analysis.

The owner read the result and did not recognise it as his:

> the current one is too details, I just want About me, professional life,
> personal life, contact info.

Three things are wrong with it from where he stands.

It **reads as a sales site**, and he does not want to sell explicitly. He wants
availability shown by invitation — *"let me know if you want the support"* — not
by a pitch.

It is **organised around offers rather than around him**. A visitor must choose
between Engineering, Analysis, Workshops and Consulting before learning anything
about the person. The two sites he pointed at — harrisonjansma.com and
constantine-cooke.com — are organised the other way round: a short bio first,
the evidence behind it one click away. On the second of them, the *About* link
*is* the root.

It **sells work he has decided not to do**. ADR-0001 already recorded him saying
publication "is not what he cares about", and answered by demoting publication
statistics to a package inside Analysis rather than removing it. He now wants it
gone, which takes the credit policy with it: ADR-0002 exists to govern the
authorship question that publication work raises, and nothing else on the site
raises it.

Nothing is lost by changing this now. `site` in `astro.config.mjs` is
deliberately unset — publishing waits on the employment-contract question — so
the site has never been published. There are no live URLs, no redirects to write
and no search equity to protect.

## Decision

The site is a **four-page calling card**: About me, Professional life, Personal
life, Contact. Four navigation items in both languages, and every page has a
counterpart, so the two languages are one site rather than two.

**About me is the homepage.** The *About* nav link is the language root, `/` and
`/zh/`. Roughly 150 words, a photograph, one link to the PDF CV, and nothing
checkable — a visitor should be able to decide in ten seconds whether to keep
reading. It is the only page that names the current employer.

**Everything checkable lives on Professional life**: the dated career timeline,
the publications, the awards, the teaching record, and the kinds of work he does
as a heading plus one or two sentences each. Not offers — descriptions.

**Availability is stated by invitation, once per page at most, in prose.** No
offer cards, no package lists, no prices, no scope terms, no call-to-action
block anywhere on the site.

**Publication work is withdrawn**, not merely unlisted. No page offers
publication statistics, reviewer response or help getting into a journal. His
own publication list stays, as a credential. The credit policy goes with the
work it governed.

**The Chinese copy is the owner's own.** Every Chinese paragraph is an entry in
one copy file carrying a status of `draft` or `approved`. An approved paragraph
renders as copy; a draft renders as a marked placeholder through the site's
existing convention for a fact the owner has not supplied. A draft is therefore
saved, versioned and visible to him, and cannot ship by accident. Rewriting a
paragraph and changing one word to `approved` is the whole publishing step.

The vocabulary follows: **Client** is retired, because nothing on the site
transacts and keeping the word invites copy that pretends otherwise.
**Engineering**, **Analysis**, **Coaching**, **Workshop** and **Course** survive
as names for kinds of work rather than names for offers.

## Alternatives considered and rejected

**Soften the v1 site in place** — keep the nine items and the four offer pages,
delete the call-to-action blocks, drop the prices and the package lists, and
reword the pitch as description.

It is much the cheaper change, and it preserves work already written and
tested in two languages.

Rejected because the complaint is about the architecture, not the tone. A
visitor still has to choose between four offers before meeting the person, the
Workshop syllabus is still the heaviest page on the site, and publication work
is still on offer two clicks in. Softened sales copy is still a sales site, and
the owner would still not show it to anyone.

**A plain Chinese draft file the build never reads**, hand-copied into the pages
once the owner has revised it.

Simpler: no status field, no placeholder path, no page that renders differently
depending on a word in a data file.

Rejected because the hand-copy step is exactly where an unrevised draft quietly
becomes his voice — which is how the agent-written prose now on the `/zh/` pages
came to be there. A status the build enforces makes shipping a draft impossible
rather than merely discouraged.

## Consequences

- **Sales conversion is given up on purpose.** This site will convert worse than
  a site with offer pages and calls to action. It is traded for a site the owner
  would actually show someone, which a site he will not show converts at zero.
  A future reader who wants to "restore" the service pages is looking at a
  deliberate trade, not an oversight.
- The site gets substantially smaller: roughly 700 lines of page source and 900
  lines of test deleted against about 250 lines of test added. Less copy to keep
  current in two languages is the main ongoing saving.
- **The records are untouched.** Career, publications, awards and teaching keep
  their data files and reader modules; only the page that renders them moves.
  The English and Chinese pages therefore still cannot disagree about how many
  papers there are.
- The two mechanisms the chrome rests on are unchanged: the navigation is
  declared once and filtered through `routeExists`, and the language switcher
  renders if and only if a counterpart exists. The navigation declaration
  shrinks from nine entries to four; nothing else about it changes.
- **The professional/personal separation becomes a site-wide rule** rather than a
  rule over a fixed list of pages, and the glossary gives it a name. Stated over
  every built route, it covers a page a later ticket adds without anyone editing
  a test.
- The faith stream moves under Personal life and keeps a permalink per piece.
  Publishing a piece stays one markdown file; professional writing is removed
  from the site entirely.
- **The site cannot be published until the owner has approved the Chinese
  paragraphs he wants.** This costs nothing today, because publishing is already
  blocked on the employment-contract question.
- ADR-0001's and ADR-0002's reasoning stays readable. The judgment that the
  combination of building the data layer and analysing it is the differentiator
  still drives the Professional copy; the credit policy is on record as
  withdrawn rather than deleted, so a future reader can see that the work it
  governed was declined deliberately.
- Reversing this is expensive in the same way ADR-0001 was: it is the site's
  positioning and its information architecture, in two languages. The difference
  is that this shape is the one the owner asked for in his own words.
