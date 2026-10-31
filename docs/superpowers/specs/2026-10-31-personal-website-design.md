# Personal website and service platform — design

- **Date:** 2026-10-31
- **Owner:** Dr. Wei-Hung Pan
- **Status:** Approved design, **partly superseded**. See the notice below.

## Superseded in part

This design was approved on 2026-10-31 and is **partly superseded the same day**
by the v1 build spec, issue [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1) — *"Spec: v1 site — Engineering +
Analysis lead offer, talk-driven funnel, bilingual core"*. **Where the two
documents disagree, the spec wins.**

Sections 2, 3, 4, 5, 6, 8, 10 and 11 are superseded in whole or in part and each
carries a notice saying so. Nothing here has been deleted: the reasoning that
led to each original decision is kept, so that a future reader can see both what
was decided here and that it was later overridden, and why. Sections 1, 7, 9, 12
and 13 stand as written.

Two of the overriding decisions are recorded as ADRs rather than left in the
spec:

- [ADR-0001](../../adr/0001-engineering-and-analysis-as-lead-offer.md) — the lead offer
  moving from publication statistics to Engineering and Analysis.
- [ADR-0002](../../adr/0002-credit-policy-for-analysis.md) — the credit policy for
  Analysis.

Vocabulary: the spec and the ADRs use the canonical terms in `GLOSSARY.md`
(Researcher, Client, Engineering, Analysis, Coaching, Workshop, Course). This
document predates the glossary and uses looser language in places.

## 1. Purpose

A personal website that establishes Wei-Hung Pan's professional identity, sells
two concrete services, and accumulates a body of public writing he owns.

### Stated goals

These came directly from the owner:

1. **Paid side income** from statistics and data-science services.
2. **Teaching and giving back to Taiwan** — sharing knowledge with Taiwanese
   students and professionals.
3. **Personal brand as resilience** — in the owner's words, "when I lose job, I
   can still live with" it. The site is an asset that must keep value
   independently of any employer.
4. **Sharing his life as a Christian**, alongside the professional material.
5. **Primary market Taiwan, secondary Germany.**

### Design consequences of goal 3

Goal 3 is the one that shapes the build. A brochure site does not serve it. The
site must accumulate assets that compound while the owner is still employed:

- An **owned audience** (email list), not only followers on a platform someone
  else controls.
- A **growing public body of writing** that demonstrates expertise.
- **Offers concrete enough to activate revenue in weeks**, not months, if income
  is ever needed quickly.

### Assumptions

Recorded separately because they were inferred, not stated, and should be
corrected if wrong:

- The owner writes Markdown fluently and routinely (inferred from the
  `3R-teaching` and `clinical-data-teaching` repositories) and will not be
  blocked by a Git-based publishing workflow.
- The owner reads and writes Traditional Chinese and English fluently, and
  enough German for a short About page.
- German-market clients in pharma and academia operate in English, so full
  German translation is not required for credibility.

## 2. Positioning

> **Superseded in part by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** The positioning below leads
> with biostatistics and publication proof. The spec leads with **Engineering and
> Analysis** — building the data infrastructure a study needs *and* running its
> statistics — for the reasons recorded in [ADR-0001](../../adr/0001-engineering-and-analysis-as-lead-offer.md).
> The proof strip is replaced by a homepage numbers band (since 2012; 15+
> Workshops delivered; 150+ hours across statistics, ML and AI) in which every
> figure links to the page that evidences it, plus a separate credentials strip
> holding publications, awards, the PhD and the teaching award: numbers sell,
> credentials reassure. The evidence list below remains accurate and is still the
> source for both.

Biostatistics and reproducible data science for clinical research, backed by a
decade in pharmaceutical early-phase drug development.

The differentiator is the combination, which is rare: peer-reviewed publication
in high-impact clinical journals, industry drug-development experience, genuine
software engineering practice (CI/CD, containers, APIs), and demonstrated
teaching ability — delivered in Mandarin or English.

### Evidence used as proof on the site

- PhD in Bioinformatics; 10+ years in data science, mostly life sciences.
- Publications in *Genome Medicine* (2018), *Gastroenterology* (2019), and
  *Cellular and Molecular Gastroenterology and Hepatology* (2020).
- Adjunct Lecturer in Mathematics & Statistics, University of Europe for Applied
  Sciences; teaching at German universities since 2022.
- Top 25 of approximately 400 lecturers, Berliner Hochschule für Technik, 2023.
- Best AI Use Case, Esri User Conference 2019 (deep learning for predictive
  road-quality maintenance, German A70).

## 3. Audience and offers

> **Superseded in part by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** Offer 1 below — publication
> statistics as the lead — is overridden: the lead offer is Engineering and
> Analysis, and publication statistics becomes one package inside **Analysis**
> ([ADR-0001](../../adr/0001-engineering-and-analysis-as-lead-offer.md)). Engineering covers four named
> deliverables: a clinical data pipeline, a reproducible analysis setup, an app
> or dashboard, a registry or cohort database. Analysis covers study design,
> analysis, publication statistics, reviewer response, and **Coaching**.
>
> The primary audience is restated as the **Researcher** — a person who owns a
> study and needs help with its data, defined by that need rather than by career
> stage (see `GLOSSARY.md`). Offer 2 keeps its substance, but the two Course
> pages are gone and their syllabus summaries move onto the Workshop page, where
> they are selling something. Offer 3 stays, unpromoted and with no homepage
> card. Platform material development is inbound-only: one sentence on the
> Workshop page, no card, no page, no pursuit.
>
> The **authorship and research-ethics policy** below is superseded by the credit
> policy, [ADR-0002](../../adr/0002-credit-policy-for-analysis.md), which decides the cases
> this section leaves open. Fixed-scope packages, the design consult's central
> role, and reproducible analysis code as a differentiator all survive unchanged.

### Primary audience

Physicians and clinical researchers in Taiwan who must publish in SCI journals
for promotion, attending status, or academic appointment, and who were not
trained as statisticians. They have grant funding or personal income, and they
prefer to discuss methods in Mandarin.

### Secondary audience

Team leads at biotech, CRO, and medical-device companies in Taiwan and Germany
with a training budget.

### Offer 1 (lead): Publication statistics for physicians and clinical researchers

Priced as **fixed-scope packages, never hourly**. Hourly engagements with this
audience reliably degrade into unbounded requests against a messy spreadsheet.

| Package | Timing | Deliverable |
| --- | --- | --- |
| Design consult | Before data collection | Study design, sample size, endpoint choice. 1–2 sessions. |
| Analysis & results | Data in hand | Analysis, tables and figures, draft methods section, reproducible analysis code. |
| Reviewer response | Revise-and-resubmit | Response to statistical reviewer comments, reanalysis where required. |

The design consult is strategically central: low cost to deliver, high value to
the client, it prevents studies that cannot be rescued after data collection,
and it is the natural entry point to the other two packages.

Reproducible analysis code is a real differentiator as journals and reviewers
increasingly ask for analysis code alongside submissions.

### Offer 2: Corporate and team workshops

Derived from existing, already-tested course material:

- **Reproducible analysis pipelines for clinical data teams** — from
  `3R-teaching`. Isolated environments, Git collaboration, reusable packages,
  tests, CI, APIs, containers.
- **Clinical development for data scientists** — from
  `clinical-data-teaching`. Trials and the industry, professional roles,
  clinical data and AI, diagnostics and the EU data context.

Both course repositories are public, and the course pages link to them.
Prospective buyers can read the real syllabus and materials before making
contact.

### Offer 3 (quieter): Biostatistics consulting

Study design, sample-size calculation, SAP authoring, and analysis for small
biotech and academic groups. Listed but not promoted: the sales cycle is long
and any work feeding a regulatory submission carries liability and employer
conflict-of-interest exposure that the other two offers do not.

### Authorship and research-ethics policy

Offer 1 requires a published, plain-language policy. Under ICMJE criteria,
authorship requires all four of: substantial contribution to conception/design
or data acquisition/analysis/interpretation; drafting or critical revision;
final approval of the version to be published; and accountability for the work.
A contributor who does not meet all four is acknowledged rather than listed as
an author.

The site states that paid statistical consulting is routine and legitimate,
that the appropriate credit (acknowledgement or co-authorship) is agreed per
project against the target journal's policy, and that ghostwriting — writing a
client's paper for them — is not offered.

This is presented as a credential, not a disclaimer. It signals to serious
researchers that the owner knows the rules of the field they are publishing in.

## 4. Information architecture

> **Superseded by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** The route list below is replaced.
> `/services/publication-stats` becomes `/services/statistics` and gains
> `/services/engineering` beside it as the other half of the lead offer;
> `/courses/3r` and `/courses/clinical-data` are removed; `/writing/data/` is
> removed, since professional writing stays on Medium and the index links out to
> it; `/teaching` is added as the record of Courses, Workshops and talks, and is
> the source of truth for the homepage Workshop count; `/cv.pdf` is added at a
> stable path. No talks page and no CV page are built — the teaching record and
> the about page absorb them. Traditional Chinese exists for exactly five pages —
> home, engineering, statistics, contact, about — not for the faith stream, the
> teaching record, the writing index or the consulting page.
>
> The separation of professional and faith content below **survives and is
> strengthened**: no faith content and no link into the faith stream on any
> service page, the faith navigation item hidden until at least one faith piece
> exists, and the About page's faith paragraph live from day one.

English at the root. Traditional Chinese under `/zh/`. German only where legally
required or where it adds credibility cheaply.

```
/                              Home — positioning, three offers, proof, email capture
/services/publication-stats    Offer 1 (lead)
/services/workshops            Offer 2
/services/consulting           Offer 3
/courses/3r                    Reproducibility, Repeatability, Replicability
/courses/clinical-data         Clinical development for statisticians
/writing/                      Writing index, both streams
/writing/data/                 Data & Stats stream
/writing/faith/                Faith & Life stream
/about                         Bio, publications, awards, teaching record, faith
/contact                       Contact form and scheduling link
/impressum                     German. Legally required.
/privacy                       GDPR privacy notice.

/zh/                           Traditional Chinese mirror of: home, all three
                               service pages, both course pages, about, contact,
                               and the Faith & Life stream.
```

### Separation of professional and personal content

Service and course pages contain no faith content. The Faith & Life stream is
reachable from the main navigation and from the About page — a clearly labelled
door the visitor chooses to walk through, not a surprise encountered while
evaluating a consultant.

Rationale: in Taiwan, Christian professional networks are a minority but
high-trust, and the association is plausibly an asset. In Germany, faith is
culturally treated as private in professional contexts. Separation serves both
without requiring the owner to hide anything.

The About page carries one honest paragraph naming his faith and linking to the
stream.

## 5. Page specifications

> **Superseded in part by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** The homepage composition
> below is replaced by a fixed five-part order: bio paragraph (first person,
> roughly four sentences, no numbers inside it, employer unnamed, naming the
> Client's symptom); numbers band; proof block of Workshop photographs then two
> or three named quotes with role and institution; three offer cards titled with
> the Client's problem rather than the service name, Engineering and Analysis at
> equal weight and Workshops the smaller third; talk-materials capture. The
> **three most recent writing entries are removed** — at roughly four pieces a
> year that block would show the same three links for eleven weeks out of twelve,
> advertise the gaps, and send a warm visitor off-site. The email capture offers
> the slides and materials from a talk, not a newsletter subscription.
>
> `/services/publication-stats` becomes `/services/statistics` and carries the
> credit policy in place of the authorship policy; `/services/engineering` is
> added; the two Course page specifications are void. The `/services/workshops`,
> `/contact` and `/about` specifications stand, with a two-page PDF CV linked
> from `/about` at a stable path.

### Home

- Positioning statement, one sentence.
- Three offer cards, with Offer 1 visually dominant.
- Proof strip: journal names, PhD, years in pharma, teaching award, AI award.
- Email capture with a specific promise, not "subscribe to my newsletter".
- Three most recent writing entries.

### `/services/publication-stats`

- Who it is for, stated in the audience's own terms.
- The three packages as above, with what the client provides and what they
  receive for each.
- Authorship and research-ethics policy.
- Pricing: "Request a quote" for v1 (see Decisions).
- Single call to action: contact.

### `/services/workshops`

- The two named workshops: audience, duration, format, learning outcomes.
- Links to the public course repositories.
- Delivery options: on-site or remote; Taiwan or Germany; Mandarin or English.

### `/services/consulting`

- Scope, and an explicit statement of what is not offered (regulatory
  submission work is excluded in v1).

### `/courses/3r` and `/courses/clinical-data`

- Syllabus summary, audience, learning outcomes, link to the public repository.
- These pages serve credibility first and lead generation second.

### `/about`

- Narrative bio: PhD, decade in pharma early-phase drug development, current
  teaching roles.
- Full publication list.
- Awards and teaching record.
- One paragraph on faith, linking to `/writing/faith/`.
- Headshot.

### `/contact`

- Form posting to a Cloudflare Pages Function, which forwards the message to
  the owner's address through a transactional email API on its free tier. No
  third-party form embed, so no additional processor to disclose in the privacy
  notice and no cookies introduced.
- A plain email address as a fallback, for visitors who distrust forms. This
  audience often does.
- Scheduling link.
- Expected response time, stated honestly.

## 6. Content model

> **Superseded in part by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** The writing-entry frontmatter
> schema below stands, minus the `data` stream. Added, as a deliberate second
> kind of content: **structured records** — publications, career timeline,
> awards, and the teaching and talks record — held as language-neutral data and
> rendered into both languages from one source, since journal names, institution
> names, dates and titles do not need translating and a single source removes the
> failure mode where the English list gains a paper and the Chinese one does not.
> **Testimonials** become structured data too, each entry carrying the quote, the
> person's name, role and institution, the offer it refers to, and a flag
> recording that written consent is held; an entry without that flag does not
> render. Service pages remain content-collection entries; Course pages no longer
> exist.

Writing entries are Markdown files in an Astro content collection:

```yaml
title:         string
description:   string
date:          date
lang:          'en' | 'zh'
stream:        'data' | 'faith'
translationOf: string | undefined   # slug of the counterpart entry
draft:         boolean
```

`translationOf` links an English entry to its Traditional Chinese counterpart
and vice versa. Translation is therefore per-entry and optional: the owner
decides for each piece whether it gets a second language, and the site renders a
language switcher only where a counterpart exists.

Service and course pages are also content-collection entries, so their
Traditional Chinese versions use the same mechanism.

## 7. Technical design

- **Framework:** Astro 5, content collections, static output.
- **Styling:** Tailwind 4.
- **i18n:** Astro's built-in i18n routing. `defaultLocale: 'en'`,
  `locales: ['en', 'zh']`, `prefixDefaultLocale: false`. English at `/`,
  Traditional Chinese at `/zh/`.
- **Hosting:** Cloudflare Pages. Chosen over GitHub Pages for materially better
  latency from Taiwan, the primary market, and for redirect and form handling.
- **Deployment:** GitHub Actions on push to the default branch.
- **Repository:** `drweihungpan-lab/drweihungpan-site`.
- **Analytics:** Cloudflare Web Analytics — cookie-free, so no consent banner is
  required. This matters for a site operated from Germany.
- **Email list:** MailerLite free tier, embedded form. Chosen over Buttondown
  for the substantially larger free subscriber allowance, which matters for an
  audience built slowly over years. Subscriber export must be verified as
  working before the list is promoted anywhere: goal 3 requires the owner to own
  this asset outright.
- **Fonts:** Noto Sans TC must be subsetted. The full family is several
  megabytes and would make the Traditional Chinese pages — the primary market's
  pages — feel slow. Latin text uses a system font stack in v1: zero payload,
  and it keeps the font budget available for the Chinese subset.
- **Images:** Astro's image pipeline; AVIF/WebP with fallbacks.

### Performance budget

- Largest Contentful Paint under 2.5 s on a 4G connection from both Taipei and
  Berlin.
- Traditional Chinese font payload under 150 KB per page after subsetting.
- No page ships more than 100 KB of JavaScript.

### Accessibility

WCAG 2.1 AA: contrast, keyboard navigation, visible focus states, correct
heading hierarchy, alt text on all images, and `lang` attributes set correctly
per page — the last matters for screen readers on mixed-language content.

## 8. Legal and compliance

> **Superseded in part by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** Everything below stands.
> Added, because testimonials and Workshop photographs are now in scope: no name
> and no identifiable face is published without written consent on file. Quotes
> carry names, roles and institutions as personal data under GDPR with consent as
> the legal basis, withdrawable on request; identifiable faces in photographs
> additionally require publication consent under German image rights. The privacy
> notice must disclose that these consent records are held, and where consent is
> incomplete photographs are framed so that no attendee is identifiable.

Operating a commercial website from Germany requires:

- **Impressum** (§5 DDG, formerly §5 TMG): legal name, postal address, email,
  telephone, and VAT identification number if the owner has one. Reachable from
  every page.
- **Privacy notice** (GDPR/DSGVO): covering the contact form, the email list,
  and analytics; naming the processors used and the legal basis for each.

Cookie-free analytics is what permits the site to operate without a consent
banner. Introducing any cookie-setting third-party script later would require
adding one.

Tax registration is outside the scope of this document but is a prerequisite to
invoicing. A statistician and lecturer is normally a *Freiberufler* in Germany,
requiring no *Gewerbeanmeldung*; the *Kleinunternehmerregelung* (§19 UStG) is
likely relevant below the turnover threshold. Cross-border invoicing to Taiwanese
clients needs professional advice. The owner should confirm all of this with a
*Steuerberater* before issuing a first invoice.

## 9. Testing and CI

The repository teaches by example: it must pass the standards the owner's own
`3R-teaching` course advocates.

GitHub Actions on every pull request:

1. `astro build` must succeed with no warnings.
2. Internal link check — no broken internal links.
3. HTML validation.
4. Lighthouse CI against the performance and accessibility budgets in §7.
5. Frontmatter schema validation via Astro content-collection schemas, so a
   malformed entry fails the build rather than rendering wrongly.

## 10. Out of scope for v1

> **Superseded in part by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** The list below stands except
> for its last bullet: **testimonials are now in scope**, as the homepage proof
> block, held as structured data behind a consent flag. Case studies remain out
> of scope — they need finished Client engagements that do not exist yet. The
> spec adds to this list: publishing the site at all (the §12 blocker is
> unresolved), migrating the Medium pieces onto the site (declined), published
> prices, browser-driven and component-level tests, and tax registration.

Deferred deliberately. Each is straightforward to add once the site is live and
earning, and none should delay launch.

- Online payments and checkout.
- Booking-calendar integration beyond a plain scheduling link.
- A self-paced online course platform.
- A CMS or browser-based editing.
- Comments.
- Site search.
- German translation beyond the Impressum and a short About page.
- ~~Case studies and testimonials — there are no clients yet to draw them
  from.~~ **Superseded by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1):** testimonials are in scope and
  are the homepage proof block; case studies remain out of scope.

## 11. Decisions

> **Superseded in part by spec [#1](https://github.com/drweihungpan-lab/drweihungpan-site/issues/1).** The lead-offer row is
> overridden by [ADR-0001](../../adr/0001-engineering-and-analysis-as-lead-offer.md) and is marked as
> such below, with its original rationale kept. Added by the spec: the credit
> policy for Analysis ([ADR-0002](../../adr/0002-credit-policy-for-analysis.md)), and
> mobile-first reclassified from a quality goal to a **conversion requirement**,
> so the performance budget in §7 gates merges rather than advising them. The
> other rows stand.

| Decision | Choice | Rationale |
| --- | --- | --- |
| Faith content placement | Same site, separate labelled section | One brand and one site to maintain; visitors choose their door; no client is ambushed on a services page. |
| Languages | English backbone, Traditional Chinese for Taiwan-facing and faith content, German for Impressum and About only | Roughly 1.4× writing effort instead of 3×. Stale translations are worse than none, and translation burden is the main reason side-project sites go dormant. |
| Build approach | Astro + Markdown, Git-hosted | Matches the owner's existing skills and daily Markdown habit; no lock-in; zero running cost; the site demonstrates the engineering practice he sells. |
| ~~Lead offer~~ — **superseded, see [ADR-0001](../../adr/0001-engineering-and-analysis-as-lead-offer.md)** | ~~Publication statistics for physicians~~ → Engineering and Analysis for clinical research groups | Original rationale, kept for the record: underserved demand in Taiwan, Clients who can pay, a repeatable deliverable, Mandarin as an advantage, and far lower employer conflict-of-interest exposure than pharma consulting. Overridden because the combination of Engineering and Analysis is the differentiator, publication statistics alone sells half the owner's capability, and the owner stated plainly that publication is not what he cares about. |
| Credit policy for Analysis — **added, see [ADR-0002](../../adr/0002-credit-policy-for-analysis.md)** | If the owner's name can appear in the output he can run the Analysis; if the work is a graded assessment of the Researcher's own competence he teaches them to run it instead | Replaces the ICMJE restatement in §3 with a rule a Researcher can check before the first email. Refuses revenue deliberately: a Researcher who buys an analysis their institution expected them to perform commits misconduct, and the owner's name on the output makes the risk mutual. |
| Pricing display | "Request a quote" in v1 | The owner has no pricing history for this market yet. Published prices set a ceiling that is hard to raise; quotes allow calibration over the first several clients. Revisit once roughly five projects are complete. |
| Engagement shape | Fixed-scope packages | Hourly billing with this audience degrades into unbounded scope. |
| Domain | `drweihungpan.com` (proposed) | Matches the existing `drweihungpan-lab` GitHub organisation. Owner to confirm before purchase; nothing else in this design depends on the choice. |

## 12. Blocker before publication

**Employment contract.** German employment contracts commonly require employer
approval for *Nebentätigkeit*, and pharmaceutical employers are particularly
strict about side work touching drug development: conflict of interest, IP
assignment, and non-compete clauses all apply. A public page advertising paid
consulting is trivially discoverable by an employer.

Publication-statistics work for academic physicians carries substantially lower
exposure than consulting for biotech companies, but it is not zero.

The entire site can be built and reviewed locally while this is resolved.
Nothing is published until the owner confirms their position.

## 13. Success criteria

The site is successful at v1 if:

1. A physician who has heard the owner's name can, within two minutes, confirm
   he is credible, understand which of the three packages fits their situation,
   and make contact.
2. A corporate training buyer can read the real course syllabus and materials
   before making contact.
3. Publishing a new piece of writing — in either language — takes under ten
   minutes of mechanical work.
4. The site costs nothing to run beyond the domain registration.
5. The owner controls every asset: content, email list, and domain are portable
   away from any provider.
