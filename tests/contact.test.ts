import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CheerioAPI } from 'cheerio';
import { describe, expect, it } from 'vitest';
import { sentPath } from '../src/lib/contact';
import { PLACEHOLDER_MARK, isUnknown, operator } from '../src/lib/legal';
import { page, routeExists } from './site';

/**
 * The contact page, in both languages.
 *
 * The seam is the built HTML, as everywhere in this suite. That has one hard
 * limit worth naming: the form posts to a serverless function on the host, and
 * a static build cannot run it. What a visitor can observe in the shipped
 * markup — where the form posts, by which method, which fields it demands,
 * what every control is called, and that nothing here needs JavaScript — is
 * asserted below. What the function does with the submission is not asserted
 * anywhere in this suite.
 */

/** Both language versions of the page, so every rule is asserted on each. */
const CONTACT_ROUTES = ['/contact/', '/zh/contact/'] as const;

/** The fields a message has to carry. From the ticket: a short form. */
const REQUIRED_FIELDS = ['name', 'email', 'message'] as const;

const form = ($: CheerioAPI) => $('main form');

/**
 * One selected element, as cheerio's own query types it.
 *
 * Taken from `form`'s inferred return type rather than written out: the name
 * cheerio uses belongs to `domhandler`, its parser, which this project does not
 * depend on directly and should not start depending on for one annotation.
 */
type Selection = ReturnType<typeof form>;

/**
 * The accessible name of a control, computed the way a browser would from the
 * three sources that work without JavaScript: `aria-label`, `aria-labelledby`,
 * and a `<label>` that points at the control's `id` or wraps it.
 */
function accessibleName($: CheerioAPI, element: Selection): string {
  const ariaLabel = element.attr('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = element.attr('aria-labelledby')?.trim();
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => $(`#${id}`).text().trim())
      .join(' ')
      .trim();
  }

  const id = element.attr('id');
  if (id) {
    const explicit = $(`label[for="${id}"]`).text().trim();
    if (explicit) return explicit;
  }

  const wrapping = element.closest('label').text().trim();
  if (wrapping) return wrapping;

  // A button names itself by its content.
  return element.text().trim();
}

/**
 * Every control a visitor has to operate, each as its own selection.
 *
 * The form's own hidden locale field is excluded, and so is the honeypot: it
 * sits inside a `hidden` container, which takes it out of the accessibility
 * tree and the tab order, so no visitor ever meets it and no rule below should
 * judge it.
 */
function controls($: CheerioAPI): Selection[] {
  const found = form($)
    .find('input, textarea, select, button')
    .filter((_, element) => $(element).attr('type') !== 'hidden')
    .filter((_, element) => $(element).closest('[hidden]').length === 0);

  return Array.from({ length: found.length }, (_, index) => found.eq(index));
}

describe('the contact page', () => {
  it('exists in English and in Traditional Chinese', () => {
    expect(routeExists('/contact/')).toBe(true);
    expect(routeExists('/zh/contact/')).toBe(true);
  });
});

/**
 * A fact the owner has not supplied yet is published as a marked placeholder,
 * not guessed at, so "is the email address there" has three answers and not
 * two. A test that demanded a real address would fail for the right reason and
 * then tempt someone into inventing one; a test that accepted anything would
 * pass on an empty page. This distinguishes the three.
 */
function present($: CheerioAPI, real: string, describes: RegExp): 'supplied' | 'placeholder' | 'missing' {
  if ($(`main ${real}`).length > 0) return 'supplied';

  const marked = $('main mark')
    .map((_, element) => $(element).text())
    .get()
    .filter((text) => text.includes(PLACEHOLDER_MARK) && describes.test(text));

  return marked.length > 0 ? 'placeholder' : 'missing';
}

describe('the contact page', () => {
  /**
   * The spec's three non-form essentials. This audience often distrusts web
   * forms, so an address they can write to themselves is not a nicety; and an
   * unstated response time is what makes silence read as rejection.
   */
  it.each(CONTACT_ROUTES)('%s offers an email address as well as the form', (route) => {
    expect(present(page(route), 'a[href^="mailto:"]', /email/i)).not.toBe('missing');
  });

  it.each(CONTACT_ROUTES)('%s offers a scheduling link', (route) => {
    expect(present(page(route), 'a[href^="http"]', /booking|scheduling/i)).not.toBe('missing');
  });

  /**
   * A bounded period, in the page's own language. The assertion is for a
   * quantity and a unit rather than for the sentence, so the copy can be
   * rewritten freely and only dropping the commitment fails.
   */
  it.each([
    ['/contact/', /\b(within|in)\s+(one|two|three|four|five|\d+)\s+(working\s+)?(day|week)s?\b/i],
    ['/zh/contact/', /[一二三四五六七八九十\d]\s*(個)?\s*(工作日|天|週|周|星期)/],
  ] as const)('%s states how soon a reply comes', (route, period) => {
    expect(page(route)('main').text()).toMatch(period);
  });

  /**
   * The spec's performance budget allows 100 KB of JavaScript per page. This
   * page spends none of it: a plain form post needs no script, and a visitor
   * on conference wifi pays nothing for the page that asks them to act. The
   * budget runner measures weight; this asserts the stronger thing, that there
   * is no script to weigh.
   */
  it.each(CONTACT_ROUTES)('%s ships no JavaScript at all', (route) => {
    const $ = page(route);

    expect($('script')).toHaveLength(0);

    const handlers = $('*')
      .map((_, element) =>
        Object.keys(($(element).attr() ?? {}) as Record<string, string>).filter((attribute) =>
          attribute.startsWith('on'),
        ),
      )
      .get();
    expect(handlers).toEqual([]);

    expect($('a[href^="javascript:"]')).toHaveLength(0);
  });
});

/**
 * Where a submission lands.
 *
 * The form needs no JavaScript because the exchange is post/redirect/get: the
 * host function answers the post with a 303 to a static page. That only works
 * if the page the function names was actually built, which is what the first
 * assertion here checks — the one place in this suite where the untestable
 * function and the testable build can be held against each other.
 */
/**
 * The contact page introduces two processors the rest of the site does not: the
 * transactional email service the host function forwards through, and the
 * scheduling service the page links out to. Ticket #4 deferred both choices to
 * this one and left them as marked placeholders; the notice has to carry the
 * decisions, not the placeholders.
 *
 * The expected names are read from `src/lib/legal.ts` rather than restated
 * here. That is not circular: the question is whether the notice publishes
 * what has been decided, which is a different claim from what the module holds.
 */
describe('the privacy notice', () => {
  const rowsNaming = (name: string): string[] => {
    const $ = page('/privacy/');
    return $('tbody tr')
      .map((_, row) => $(row).text())
      .get()
      .filter((text) => text.includes(name));
  };

  it.each([
    ['the transactional email provider', operator.transactionalEmailProvider],
    ['the scheduling provider', operator.schedulingProvider],
  ])('names %s the contact page introduces, with its legal basis', (_what, provider) => {
    // Decided, not deferred: a placeholder here would mean the ticket shipped
    // without making the choice it owns.
    expect(isUnknown(provider)).toBe(false);

    const rows = rowsNaming(provider as string);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatch(/Art\. 6\(1\)\([a-f]\) GDPR/);
    expect(rows[0]).not.toContain(PLACEHOLDER_MARK);
  });

  /**
   * The reason this ticket preferred an EU provider: a processor inside the EU
   * needs no Art. 44–49 transfer basis, and the row can say so plainly instead
   * of explaining a framework the reader has to take on trust.
   */
  it('says where each of them processes the data', () => {
    for (const provider of [operator.transactionalEmailProvider, operator.schedulingProvider]) {
      expect(rowsNaming(provider as string)[0]).toMatch(/EU|European Union/);
    }
  });
});

describe('the confirmation page', () => {
  it('is built at the path the host function redirects to', () => {
    expect(routeExists(sentPath('en'))).toBe(true);
    expect(routeExists(sentPath('zh'))).toBe(true);
  });

  it.each([
    [sentPath('en'), false],
    [sentPath('zh'), true],
  ] as const)('%s is written in its own language', (route, chinese) => {
    const text = page(route)('main').text();
    expect(/\p{Script=Han}/u.test(text)).toBe(chinese);
  });

  /**
   * A confirmation that only says "thank you" is a dead end. A visitor who has
   * just sent a message needs the two things that stop them wondering: when a
   * reply comes, and the address to use if none does.
   */
  it.each([sentPath('en'), sentPath('zh')])('%s says what happens next', (route) => {
    const $ = page(route);

    expect(present($, 'a[href^="mailto:"]', /email/i)).not.toBe('missing');
    expect($(`main a[href$="contact/"]`).length).toBeGreaterThan(0);
  });
});

describe('the contact form', () => {
  /**
   * The spec's reason for a function rather than an embed: a third-party form
   * would add a processor to the privacy notice and introduce cookies. So the
   * form must post, same-origin, to a path on this site — and something has to
   * answer at that path, which is the one assertion here that reads a source
   * file rather than the build, because a static build cannot emit a function.
   */
  it.each(CONTACT_ROUTES)('%s posts to a function on this host', (route) => {
    const $ = page(route);
    const submitted = form($);

    expect(submitted).toHaveLength(1);
    expect(submitted.attr('method')?.toLowerCase()).toBe('post');

    const action = submitted.attr('action') ?? '';
    expect(action.startsWith('/')).toBe(true);

    const handler = join(process.cwd(), 'functions', `${action.replace(/^\/|\/$/g, '')}.ts`);
    expect(existsSync(handler)).toBe(true);
  });

  /** A third-party embed is the thing the spec rules out; this is the gate. */
  it.each(CONTACT_ROUTES)('%s embeds no third-party form', (route) => {
    const $ = page(route);

    expect($('iframe, object, embed')).toHaveLength(0);

    const offsite = $('form[action]')
      .map((_, element) => $(element).attr('action') ?? '')
      .get()
      .filter((action) => /^(https?:)?\/\//.test(action));

    expect(offsite).toEqual([]);
  });

  it.each(CONTACT_ROUTES)('%s asks for a name, an address to reply to and a message', (route) => {
    const $ = page(route);

    for (const field of REQUIRED_FIELDS) {
      const control = form($).find(`[name="${field}"]`);

      expect(control, `no control named "${field}"`).toHaveLength(1);
      expect(control.attr('required'), `"${field}" is not required`).toBeDefined();
    }

    // The reply address is typed on a phone keyboard, so it has to be one.
    expect(form($).find('[name="email"]').attr('type')).toBe('email');
  });

  /**
   * Every control a keyboard-only visitor meets must say what it is, through
   * an attribute or a real `<label>`, because a placeholder is not a name and
   * disappears as soon as they type.
   */
  it.each(CONTACT_ROUTES)('%s names every control programmatically', (route) => {
    const $ = page(route);
    const named = controls($);

    expect(named.length).toBeGreaterThanOrEqual(REQUIRED_FIELDS.length + 1);

    const anonymous = named
      .filter((control) => accessibleName($, control) === '')
      .map((control) => $.html(control));

    expect(anonymous).toEqual([]);
  });

  /**
   * The keyboard path, as far as the shipped markup can show it: every control
   * is a real focusable element, none has been taken out of the tab order,
   * none is disabled, and the form can be submitted without a pointer. The
   * focus ring itself is asserted site-wide in `tests/chrome.test.ts`.
   */
  it.each(CONTACT_ROUTES)('%s can be completed and submitted by keyboard alone', (route) => {
    const $ = page(route);

    const unreachable = controls($)
      .filter((control) => {
        const tabindex = control.attr('tabindex') ?? '0';
        return tabindex.startsWith('-') || control.attr('disabled') !== undefined;
      })
      .map((control) => $.html(control));

    expect(unreachable).toEqual([]);

    // A real submit control, not a div listening for a click.
    const submit = form($).find('button[type="submit"], input[type="submit"]');
    expect(submit).toHaveLength(1);
    expect(accessibleName($, submit.first())).not.toBe('');
  });
});
