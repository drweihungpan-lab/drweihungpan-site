# ADR-0001: Engineering and Analysis as the lead offer

- **Status:** accepted
- **Date:** 2026-10-31
- **Supersedes:** the "Lead offer" row in §11 of
  `docs/superpowers/specs/2026-10-31-personal-website-design.md`

## Context

The approved design led with publication statistics for physicians and clinical
researchers: a Researcher who must publish in an SCI journal, cannot run the
statistics, and buys a fixed-scope package. It is a real, underserved demand in
Taiwan, and it is the easiest thing to sell.

It is also half of what the owner can do. He has worked with health and clinical
data since 2012 and builds the infrastructure a study runs on — pipelines,
reproducible analysis setups, apps and dashboards, registry and cohort
databases — as well as running the statistics on it. Neither half is rare on its
own. A Researcher can find a statistician in a university department and a
developer on a freelance marketplace; what they cannot easily find is one person
who will build the data layer *and* defend the methods that come out of it.

The owner also stated plainly that publication is not what he cares about.
Leading with publication statistics builds the site around the part of his work
he is least interested in doing for the next decade.

## Decision

The lead offer is **Engineering and Analysis for clinical research groups**:
building the data infrastructure a study needs and running its statistics. The
combination is the stated differentiator, and the two carry equal visual weight
on the homepage.

**Engineering** covers four named deliverables: a clinical data pipeline; a
reproducible analysis setup; an app or dashboard; a registry or cohort database.

**Analysis** covers study design, analysis, publication statistics, reviewer
response, and Coaching. Publication statistics — the whole of the old lead
offer — becomes one package inside Analysis.

The Workshop offer keeps its place as a smaller third card, and the consulting
offer stays unpromoted with no homepage card.

## Alternative considered and rejected

**A narrower, sharper position in an underserved niche** — publication
statistics only, aimed squarely at Taiwanese Researchers who need an SCI paper.

It is the stronger marketing position taken on its own terms. A single-sentence
offer is easier to recognise, easier to price, and easier to repeat; "Engineering
and Analysis" asks a visitor to hold two ideas at once, and a Researcher who
wants only a statistician has to read past the engineering half.

Rejected for two reasons. It sells half the owner's capability, which forfeits
the one claim competitors cannot match; and it leads with work the owner has said
is not what he cares about, which is a poor foundation for an asset meant to
outlast an employer.

## Consequences

- Two offer pages carry the weight instead of one, so there is more copy to
  write and keep current, in both languages.
- The homepage must make the combination legible in seconds on a phone. Offer
  cards are therefore titled with the Client's problem rather than the service
  name, so a Researcher recognises their own situation without parsing a service
  taxonomy.
- Publication statistics loses its own route and its homepage card. It is
  reachable only as a package on the Analysis page.
- Proof has to cover both halves. Publication credentials alone no longer
  evidence the lead offer, which is part of why the homepage numbers band leads
  with breadth — since 2012, Workshops delivered, hours taught across
  statistics, ML and AI — and moves publications and awards into a separate
  credentials strip.
- Engineering work for a research group touches the owner's employer
  conflict-of-interest question more closely than academic publication
  statistics did. It does not change the publication blocker, but it raises the
  stakes of resolving it.
- Reversing this is expensive: it is the site's positioning, its information
  architecture, and the shape of both service pages in two languages.
