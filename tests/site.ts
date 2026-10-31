/**
 * The one test seam: the built site.
 *
 * Every assertion in this suite describes what a visitor can observe in the
 * HTML that actually ships. Nothing here reaches into a component, a style
 * sheet or a build internal, so a component may be rewritten and a class name
 * renamed without touching a test.
 *
 * The build runs once per `vitest run`, in `tests/global-setup.ts`. These
 * helpers only read `dist/`.
 *
 * Select by role, landmark, text or a semantic attribute (`a[hreflang]`,
 * `nav[aria-label]`, `link[rel]`). Never select by a utility class.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import * as cheerio from 'cheerio';

/** The directory `astro build` writes. */
export const DIST = join(process.cwd(), 'dist');

/**
 * The built HTML file backing a route.
 *
 * `/` and `/zh/about/` resolve to their directory index; a page emitted as a
 * bare file, such as `/404`, resolves to `404.html`.
 */
export function fileFor(route: string): string {
  const clean = route.replace(/^\/+|\/+$/g, '');
  const asDirectoryIndex = join(DIST, clean, 'index.html');
  if (existsSync(asDirectoryIndex)) return asDirectoryIndex;
  return join(DIST, clean === '' ? 'index.html' : `${clean}.html`);
}

/** Whether the build emitted a page for this route. */
export function routeExists(route: string): boolean {
  return existsSync(fileFor(route));
}

/**
 * A route's built HTML, loaded as a cheerio document.
 *
 * `page('/zh/')('h1').text()` — jQuery-style selectors over the shipped markup.
 * Throws with the list of built routes when the route was not built, so a
 * failure names the mistake instead of an ENOENT.
 */
export function page(route: string): cheerio.CheerioAPI {
  const file = fileFor(route);
  if (!existsSync(file)) {
    throw new Error(
      `No built page for route "${route}" (looked for dist/${relative(DIST, file)}).\n` +
        `Built routes: ${allRoutes().join(', ')}`,
    );
  }
  return cheerio.load(readFileSync(file, 'utf8'));
}

/**
 * Every page the build emitted, as routes, sorted.
 *
 * A directory index becomes a trailing-slash route (`/`, `/zh/`); any other
 * HTML file becomes its extensionless path (`/404`). Use it to assert a rule
 * over the whole site — "every page carries a language attribute" — so that a
 * page added by a later ticket is covered without editing the test.
 */
export function allRoutes(): string[] {
  const routes: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const absolute = join(dir, entry);
      if (statSync(absolute).isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.endsWith('.html')) continue;
      const fromDist = relative(DIST, absolute).split(sep).join('/');
      routes.push(
        entry === 'index.html'
          ? `/${fromDist.slice(0, -'index.html'.length)}`
          : `/${fromDist.slice(0, -'.html'.length)}`,
      );
    }
  };
  walk(DIST);
  return routes.sort();
}

/** Whether the build emitted a non-page asset, e.g. `asset('cv.pdf')`. */
export function assetExists(relativePath: string): boolean {
  return existsSync(join(DIST, relativePath));
}

/** The byte size of a built asset — for payload budgets. */
export function assetBytes(relativePath: string): number {
  return statSync(join(DIST, relativePath)).size;
}

/**
 * All CSS a route applies: every linked stylesheet plus every inline `style`
 * block, concatenated.
 *
 * Lets a test assert what a page can cause the browser to fetch — an
 * `@font-face` rule, for instance — without caring which file Astro happened
 * to bundle it into.
 */
export function styles(route: string): string {
  const $ = page(route);
  const linked = $('link[rel="stylesheet"][href]')
    .map((_, element) => {
      const href = $(element).attr('href') ?? '';
      const file = join(DIST, href.replace(/^\//, ''));
      return existsSync(file) ? readFileSync(file, 'utf8') : '';
    })
    .get();
  const inline = $('style')
    .map((_, element) => $(element).html() ?? '')
    .get();
  return [...linked, ...inline].join('\n');
}
