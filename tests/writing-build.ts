/**
 * Builds this site against a different set of writing entries.
 *
 * The faith stream has two states a reader can tell apart — pieces published,
 * and nothing published — and one build can only ever show one of them. The
 * conditional navigation item is the rule most worth proving, so the empty
 * state gets a build of its own rather than an argument that it would work.
 *
 * `WRITING_CONTENT_DIR` points the collection at a temporary directory and
 * `--outDir` sends the output to a temporary one, so nothing in the working
 * tree is moved, deleted or overwritten: the suite's own `dist/` and the
 * entries in `src/content/writing/` are untouched. `--force` clears the content
 * cache, so a build really reads the entries it was given.
 *
 * It costs one `astro build` per call — a few seconds — which is why these are
 * used for the branches the main build cannot show, and nothing else.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import * as cheerio from 'cheerio';

/** The markdown source of one entry, keyed by the file name it is written to. */
export type Entries = Record<string, string>;

export interface TrialBuild {
  /** Whether `astro build` succeeded. A malformed entry must make this false. */
  ok: boolean;
  /** Everything the build wrote to stdout and stderr, for asserting on an error. */
  output: string;
  /** Every page this build emitted, as trailing-slash routes, sorted. */
  routes: string[];
  /** One built page as a cheerio document. */
  page(route: string): cheerio.CheerioAPI;
}

function routesIn(dist: string): string[] {
  if (!existsSync(dist)) return [];

  const routes: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const absolute = join(dir, entry);
      if (statSync(absolute).isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.endsWith('.html')) continue;
      const fromDist = relative(dist, absolute).split(sep).join('/');
      routes.push(
        entry === 'index.html'
          ? `/${fromDist.slice(0, -'index.html'.length)}`
          : `/${fromDist.slice(0, -'.html'.length)}`,
      );
    }
  };
  walk(dist);
  return routes.sort();
}

export function buildWithEntries(entries: Entries): TrialBuild {
  const scratch = mkdtempSync(join(tmpdir(), 'drweihungpan-writing-'));
  const content = join(scratch, 'content');
  const dist = join(scratch, 'dist');
  mkdirSync(content);

  for (const [name, markdown] of Object.entries(entries)) {
    writeFileSync(join(content, name), markdown, 'utf8');
  }

  let ok = true;
  let output = '';
  try {
    output = execFileSync('npx', ['astro', 'build', '--force', '--outDir', dist], {
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: '1',
        WRITING_CONTENT_DIR: content,
      },
    });
  } catch (failure) {
    ok = false;
    const { stdout, stderr, message } = failure as {
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    output = `${stdout ?? ''}\n${stderr ?? ''}\n${message ?? ''}`;
  }

  const routes = routesIn(dist);

  return {
    ok,
    output,
    routes,
    page(route) {
      const clean = route.replace(/^\/+|\/+$/g, '');
      const asDirectoryIndex = join(dist, clean, 'index.html');
      const file = existsSync(asDirectoryIndex)
        ? asDirectoryIndex
        : join(dist, clean === '' ? 'index.html' : `${clean}.html`);
      if (!existsSync(file)) {
        throw new Error(`This build emitted no page for "${route}". It built: ${routes.join(', ')}`);
      }
      return cheerio.load(readFileSync(file, 'utf8'));
    },
  };
}
