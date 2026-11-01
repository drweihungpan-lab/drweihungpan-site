/**
 * The contact form's handler: a Cloudflare Pages Function at `/api/contact`.
 *
 * Cloudflare Pages compiles every file under this directory into a Worker and
 * routes it by path, so `functions/api/contact.ts` answers `/api/contact`. It
 * is the reason the site needs no third-party form embed: the submission never
 * leaves the site's own origin, so no form provider appears in the privacy
 * notice and no cookie is set on the way through.
 *
 * It does exactly one thing: turn a form post into an email, then redirect.
 *
 *   1. Read the form fields. Nothing is stored, anywhere.
 *   2. Discard anything that filled the honeypot, and report success.
 *   3. Hand the message to Brevo's transactional email API.
 *   4. Redirect (303) to the confirmation page in the visitor's language.
 *
 * Post/redirect/get is what keeps the form free of JavaScript: the browser
 * submits, the function redirects, the browser lands on a static page it can
 * reload or bookmark without resubmitting.
 *
 * ## This file is not covered by the test suite
 *
 * The suite's one seam is the built static output, which cannot run a
 * serverless function. `tests/contact.test.ts` asserts that the form posts here
 * and that this file exists; everything below — the validation, the API call,
 * the redirect — is unverified by any automated test in this repository. It
 * needs exercising against a real deployment before the site is published.
 *
 * ## Environment
 *
 * Set as Cloudflare Pages environment variables, `BREVO_API_KEY` as a secret:
 *
 * | Variable         | What it is                                            |
 * | ---------------- | ----------------------------------------------------- |
 * | `BREVO_API_KEY`  | Brevo API key (v3), secret.                           |
 * | `CONTACT_TO`     | The mailbox enquiries are delivered to.               |
 * | `CONTACT_FROM`   | A sender address on a domain verified in Brevo.       |
 *
 * The sender is a verified address of the site's own, never the visitor's:
 * sending as the visitor fails SPF and DMARC and lands the message in spam.
 * Their address goes in `replyTo`, so answering the mail answers them.
 */
import { fields, limits, readLocale, sentPath } from '../../src/lib/contact';

/** Brevo's transactional send endpoint. */
const BREVO_SEND = 'https://api.brevo.com/v3/smtp/email';

/** What Cloudflare hands a Pages Function. Only the parts this one uses. */
interface FunctionContext {
  request: Request;
  env: Record<string, string | undefined>;
}

/** A trimmed, length-capped string field, or `''` when it was absent. */
function field(form: FormData, name: string, max: number): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** See-other, so the browser re-requests with GET and never resubmits. */
function redirect(to: string): Response {
  return new Response(null, { status: 303, headers: { Location: to } });
}

/**
 * The one page this function renders itself.
 *
 * A visitor whose message could not be sent must not be left guessing, and the
 * static site has no page for a failure that only the host can detect. It is
 * deliberately plain — inline styles, no stylesheet, no script — because the
 * built site's hashed CSS filename is not knowable from here, and because the
 * only thing this page has to do is carry the address to write to instead.
 */
function problem(locale: 'en' | 'zh', to: string): Response {
  const copy = {
    en: {
      lang: 'en',
      title: 'The message could not be sent',
      body: 'Something between this site and the mail service failed, so your message did not reach me. Nothing was saved. Please write to me directly instead — the address is on the contact page.',
      back: 'Back to the contact page',
    },
    zh: {
      lang: 'zh-Hant',
      title: '訊息沒有送出',
      body: '這個網站和寄信服務之間出了問題，你的訊息沒有送到我這裡，也沒有被儲存。請直接寄信給我，信箱列在聯絡頁上。',
      back: '回到聯絡頁',
    },
  }[locale];

  const html = `<!doctype html>
<html lang="${copy.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${copy.title}</title>
</head>
<body style="margin:0 auto;max-width:40rem;padding:3rem 1rem;font-family:system-ui,sans-serif;line-height:1.6">
<h1>${copy.title}</h1>
<p>${copy.body}</p>
<p><a href="${to}">${copy.back}</a></p>
</body>
</html>
`;

  return new Response(html, {
    status: 502,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export async function onRequestPost({ request, env }: FunctionContext): Promise<Response> {
  const form = await request.formData();
  const locale = readLocale(form.get(fields.locale));
  const contactPage = locale === 'zh' ? '/zh/contact/' : '/contact/';

  // A bot filled the honeypot. Report success: naming the rule that caught it
  // only teaches the next attempt.
  if (field(form, fields.decoy, 200) !== '') return redirect(sentPath(locale));

  const name = field(form, fields.name, limits.name);
  const email = field(form, fields.email, limits.email);
  const message = field(form, fields.message, limits.message);

  // The browser enforces these too; a direct post does not go through a
  // browser. Back to the form, where the fields say what is wrong.
  if (name === '' || message === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return redirect(contactPage);
  }

  const key = env.BREVO_API_KEY;
  const to = env.CONTACT_TO;
  const from = env.CONTACT_FROM;
  if (!key || !to || !from) return problem(locale, contactPage);

  let delivered: Response;
  try {
    delivered = await fetch(BREVO_SEND, {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: from, name: 'drweihungpan.de contact form' },
        to: [{ email: to }],
        // So that answering the mail answers the visitor.
        replyTo: { email, name },
        subject: `Contact form: ${name}`,
        textContent: [
          `Name:     ${name}`,
          `Email:    ${email}`,
          `Language: ${locale}`,
          '',
          message,
        ].join('\n'),
      }),
    });
  } catch {
    return problem(locale, contactPage);
  }

  if (!delivered.ok) return problem(locale, contactPage);

  return redirect(sentPath(locale));
}
