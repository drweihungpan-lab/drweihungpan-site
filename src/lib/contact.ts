/**
 * The contact form's wire contract.
 *
 * The form is rendered by Astro at build time; the submission is handled by a
 * serverless function on the host, which is a different program built by a
 * different toolchain. The two agree on a path, a set of field names and where
 * a visitor lands afterwards, and they agree here rather than in two places.
 *
 * Nothing in this module may import Astro at run time. The host function
 * bundles it, and `astro:i18n` does not exist outside an Astro build — which is
 * why `Locale` comes in as a type-only import (erased at compile time) and why
 * `sentPath` spells the locale prefix out instead of calling `href()`.
 */
import type { Locale } from './i18n';

/**
 * Where the form posts. A function at `functions/api/contact.ts` answers this
 * path on the host; `tests/contact.test.ts` asserts that the file exists for
 * whatever path the built form names, because a form posting into thin air
 * looks fine in HTML.
 */
export const endpoint = '/api/contact';

/**
 * The field names, shared by the form and the function.
 *
 * `decoy` is a honeypot: it sits inside a `hidden` container, so it is absent
 * from the accessibility tree and from the tab order and no visitor ever meets
 * it, while a bot that fills every input it can parse fills this one too. The
 * function then discards the submission and reports success, because telling a
 * spammer which rule caught them only teaches them the next form.
 */
export const fields = {
  name: 'name',
  email: 'email',
  message: 'message',
  locale: 'locale',
  decoy: 'website',
} as const;

/** The longest each field may be, so one request cannot post a novel. */
export const limits = { name: 200, email: 200, message: 5000 } as const;

/**
 * The confirmation page a successful submission redirects to, per language.
 *
 * Post/redirect/get, so the confirmation is a real page a visitor can land on,
 * bookmark and reload without resubmitting — and so the whole exchange needs
 * no JavaScript at all.
 */
export function sentPath(locale: Locale): string {
  return locale === 'zh' ? '/zh/contact/sent/' : '/contact/sent/';
}

/** Narrows an untrusted `locale` field back to a language this site builds. */
export function readLocale(value: unknown): Locale {
  return value === 'zh' ? 'zh' : 'en';
}
