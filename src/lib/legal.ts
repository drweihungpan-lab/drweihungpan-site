/**
 * The facts German law makes the site publish, held in one place.
 *
 * Two pages depend on these — the Impressum (§5 DDG) and the privacy notice
 * (GDPR) — and several of them are facts only the owner knows. Rather than
 * invent a postal address or a VAT number, each unknown fact is recorded as
 * `unknown('...')` and rendered by `src/components/Fact.astro` as a visibly
 * marked placeholder. Filling one in means replacing one `unknown(...)` call
 * with a string; both pages pick the value up.
 *
 * `tests/legal.test.ts` asserts that no placeholder can reach a visitor
 * unmarked, so the site cannot be published with an invented-looking blank.
 */

/** The text every unfilled fact carries, so one grep finds them all. */
export const PLACEHOLDER_MARK = 'TO BE SUPPLIED';

/** A fact the owner must supply before the site is published. */
export interface Unknown {
  readonly unknown: string;
}

/** A published legal fact: either its value, or a description of what is missing. */
export type Fact = string | Unknown;

export function unknown(describe: string): Unknown {
  return { unknown: describe };
}

export function isUnknown(fact: Fact): fact is Unknown {
  return typeof fact !== 'string';
}

/** How an unfilled fact reads on the page. */
export function placeholderText(fact: Unknown): string {
  return `[${PLACEHOLDER_MARK}: ${fact.unknown}]`;
}

/**
 * The operator §5 DDG requires the site to name, and the GDPR controller.
 *
 * The legal name is known. Everything else is a fact about the owner's
 * registration and premises that is not ours to guess: a wrong Impressum is a
 * worse legal position than a visibly incomplete one.
 */
export const operator = {
  legalName: 'Dr. Wei-Hung Pan',

  postalAddress: unknown('postal address — street and number, postcode, city, Germany'),
  telephone: unknown('telephone number reachable during business hours'),
  email: unknown('contact email address for this site'),

  /**
   * §27a UStG. Only required where the owner holds one; a *Kleinunternehmer*
   * under §19 UStG may have none, in which case say so here rather than
   * leaving the line blank.
   */
  vatId: unknown('VAT identification number (USt-IdNr.), or "none — §19 UStG" if there is none'),

  /**
   * The GDPR supervisory authority competent for a complaint under Art. 77.
   * It is the authority of the federal state the owner operates from.
   */
  supervisoryAuthority: unknown(
    'competent data protection authority — the Landesdatenschutzbehörde of the federal state the owner operates from',
  ),

  /**
   * The transactional email API the contact form's host function forwards
   * through. Chosen with the contact form itself; until then this processor is
   * named but not identified.
   */
  transactionalEmailProvider: unknown(
    'transactional email provider for the contact form — company name, registered office and country',
  ),

  /** The scheduling service the contact page links out to. */
  schedulingProvider: unknown('scheduling service linked from the contact page — company and country'),
} as const satisfies Record<string, Fact>;

/** The date the legal pages were last reviewed, shown on both. */
export const legalLastReviewed = '2026-10-31';
