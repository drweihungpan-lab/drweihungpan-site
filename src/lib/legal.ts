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
   * through.
   *
   * Brevo, decided with the contact form. Two criteria settled it. The free
   * tier is permanent rather than a trial — 300 messages a day, against a form
   * that will send a handful a week — so the site still costs nothing to run
   * beyond the domain. And the contracting entity is French with EU data
   * centres, which takes a third-country transfer out of the disclosure
   * altogether: the alternatives with comparable free tiers — Resend,
   * MailerSend, Postmark — all contract through a US entity and would each
   * have needed an Art. 46 transfer basis stated in the table below.
   *
   * The registered office and register number are as Brevo's own privacy
   * policy gives them. Brevo's pages disagree with one another about the
   * street number, which is why the Paris register number is published beside
   * it: that identifies the company whichever address is current.
   */
  transactionalEmailProvider:
    'Sendinblue SAS, trading as Brevo — 17 rue Salneuve, 75017 Paris, France (RCS Paris 498 019 298)',

  /**
   * The scheduling service the contact page links out to.
   *
   * Brevo Meetings, from the same company as the transactional email above,
   * and chosen for that reason: its booking pages are free on every plan, so a
   * separate scheduling service would have added a second company — and, for
   * every free option worth using, a second country — to the processor table
   * in exchange for one link. One EU company covering both keeps the notice
   * shorter, which is the only thing that makes a notice get read.
   */
  schedulingProvider: 'Sendinblue SAS, trading as Brevo — Brevo Meetings (France)',

  /**
   * The public booking page the contact page links to. Not a fact the law
   * demands, but the owner's to supply, and held here so that it is marked as
   * missing on the page rather than guessed at: an invented booking URL is a
   * dead link that looks alive.
   */
  bookingUrl: unknown('public booking page URL on the scheduling service'),
} as const satisfies Record<string, Fact>;

/** The date the legal pages were last reviewed, shown on both. */
export const legalLastReviewed = '2026-10-31';
