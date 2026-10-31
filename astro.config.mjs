import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// `site` is deliberately unset: publishing is out of scope until the owner
// settles the employment-contract question, and an invented domain would leak
// into canonical URLs and sitemaps.
export default defineConfig({
  output: 'static',

  // Every pathname ends in a slash, so a route maps one-to-one onto
  // `dist/<route>/index.html` and hrefs never differ by a trailing slash.
  trailingSlash: 'always',

  // English at the root, Traditional Chinese under /zh/. `fallback` is
  // deliberately unset: it would generate a zh page for every English page,
  // and Traditional Chinese exists for exactly five pages.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: { prefixDefaultLocale: false },
  },

  vite: { plugins: [tailwindcss()] },
});
