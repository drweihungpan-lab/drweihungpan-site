import { describe, expect, it } from 'vitest';
import { allRoutes, page, routeExists } from './site';

/**
 * The two pages German law requires of a site operated from Germany, and the
 * one rule that makes them worth having: a visitor must be able to reach them
 * from wherever they are.
 *
 * `/impressum/` carries the §5 DDG operator statement in German, because that
 * is the language the duty is owed in, with an English rendering beside it.
 * `/privacy/` is the GDPR notice. Neither has a Traditional Chinese
 * counterpart — the spec puts that out of scope — which is why they are also
 * the site's live negative case for the language-switcher rule.
 */
describe('the legal pages', () => {
  it('exist', () => {
    expect(routeExists('/impressum')).toBe(true);
    expect(routeExists('/privacy')).toBe(true);
  });

  /**
   * Asserted over every built page rather than a hand-written list, so a page
   * added by a later ticket has to carry the legal links too.
   */
  it.each(allRoutes())('%s links to both of them', (route) => {
    const $ = page(route);
    const linked = $('footer a[href]')
      .map((_, element) => $(element).attr('href'))
      .get();

    expect(linked).toContain('/impressum/');
    expect(linked).toContain('/privacy/');
  });

  /**
   * Several facts on these pages — the postal address, the telephone number,
   * the VAT identification number — are the owner's to supply and were not
   * invented. An unfilled one must be visible as unfilled: a legal page with a
   * silently blank line reads as though the blank were the answer. Asserted
   * over every page, so no later page can ship a bare placeholder either.
   */
  it.each(allRoutes())('%s marks every fact still to be supplied as unfilled', (route) => {
    const $ = page(route);
    const occurrences = (text: string): number => (text.match(/TO BE SUPPLIED/g) ?? []).length;

    expect(occurrences($('mark').text())).toBe(occurrences($('body').text()));
  });
});

describe('the Impressum', () => {
  const impressum = (): string => page('/impressum/')('main').text();

  /** §5 DDG: legal name, postal address, email, telephone, and the VAT ID if there is one. */
  it('names the operator, as §5 DDG requires', () => {
    const text = impressum();

    expect(text).toContain('§ 5 DDG');
    expect(text).toContain('Dr. Wei-Hung Pan');
    expect(text).toContain('Telefon');
    expect(text).toContain('E-Mail');
    expect(text).toContain('Umsatzsteuer-Identifikationsnummer');
    expect(text).toContain('§ 18 Abs. 2 MStV');
  });

  /**
   * The duty is owed in German, so the authoritative statement is in German
   * and is marked as German — otherwise a screen reader on an English page
   * reads it in an English voice.
   */
  it('carries its authoritative statement in German, declared as German', () => {
    const $ = page('/impressum/');
    const german = $('[lang="de"]');

    expect(german.length).toBeGreaterThan(0);
    expect(german.text()).toContain('Angaben gemäß § 5 DDG');
    expect($('html').attr('lang')).toBe('en');
  });

  it('renders the same details in English for the rest of the audience', () => {
    expect(impressum()).toContain('In English');
  });
});

describe('the privacy notice', () => {
  const notice = (): string => page('/privacy/')('main').text();

  it('names every processor that touches a visitor', () => {
    const text = notice();

    expect(text).toContain('Cloudflare');
    expect(text).toContain('MailerLite');
    expect(text).toContain('transactional email');
    expect(text).toContain('Art. 28 GDPR');
  });

  /**
   * Naming a processor without its legal basis is the half that makes a notice
   * useless, so every row of the processor table has to state one.
   */
  it('states a legal basis for every processor it names', () => {
    const $ = page('/privacy/');
    const rows = $('tbody tr');

    expect(rows.length).toBeGreaterThan(0);

    const withoutABasis = rows
      .map((_, row) => ($(row).text().match(/Art\. 6\(1\)\([a-f]\)/) ? '' : $(row).text()))
      .get()
      .filter(Boolean);

    expect(withoutABasis).toEqual([]);
  });

  it('covers the contact form, the email list and the analytics', () => {
    const text = notice();

    expect(text).toMatch(/contact form/i);
    expect(text).toMatch(/email list/i);
    expect(text).toMatch(/analytics/i);
  });

  /**
   * The spec requires this disclosure explicitly, because the site publishes
   * named quotes and identifiable faces and the lawfulness of both rests on
   * records the visitor cannot see.
   */
  it('discloses the consent records held for testimonials and for photographs', () => {
    const $ = page('/privacy/');
    const text = notice();

    // The disclosure is a claim the notice makes, not a word it happens to
    // use, so it is read from what the page emphasises. Both halves of it are
    // required: a name published under consent, and an identifiable face.
    const claimed = $('main strong')
      .map((_, element) => $(element).text())
      .get();

    expect(claimed.some((claim) => /\bhold\b/i.test(claim) && /consent record/i.test(claim))).toBe(
      true,
    );
    expect(
      claimed.some((claim) => /\bhold\b/i.test(claim) && /publication consent/i.test(claim)),
    ).toBe(true);

    expect(text).toMatch(/testimonial/i);
    expect(text).toContain('Art. 7(1)');
    expect(text).toContain('KUG');
  });

  it('says plainly why a visitor is never asked about cookies', () => {
    const text = notice();

    expect(text).toMatch(/sets no cookies/i);
    expect(text).toMatch(/cookie-free/i);
    expect(text).toMatch(/no cookie banner|shows no\s+cookie banner/i);
  });

  it('tells a visitor how to exercise their rights, and where to complain', () => {
    const text = notice();

    expect(text).toContain('Art. 15 GDPR');
    expect(text).toContain('Art. 17');
    expect(text).toContain('Art. 7(3)');
    expect(text).toContain('Art. 77 GDPR');
  });
});
