/**
 * Builds this site against a crafted Traditional Chinese copy file.
 *
 * The copy rule has two branches a reader can tell apart — a paragraph the
 * owner has approved, which renders as his copy, and a draft, which renders as
 * a marked placeholder — and this build can only ever show one of them.
 * Nothing is approved yet, and approving one of his paragraphs to make a test
 * pass is exactly the thing the rule exists to prevent. So the approved branch
 * gets a build of its own, against a copy file written by the test.
 *
 * The base is the real file with **every entry forced to `draft`**, and the
 * test's overrides are applied on top. Two consequences, both wanted: a
 * paragraph a later ticket adds is in the fixture automatically, so this does
 * not have to be edited to keep building; and a paragraph the owner approves
 * later cannot start affecting what these tests observe.
 *
 * `ZH_COPY_FILE` points the collection at a temporary file and `--outDir`
 * sends the output to a temporary directory, so nothing in the working tree is
 * moved or overwritten: `src/data/zh-copy.yaml` and the suite's own `dist/`
 * are untouched. `--force` clears the content cache, so the build really reads
 * the file it was given.
 *
 * It costs one `astro build` per call. See `tests/writing-build.ts`, which
 * does the same thing for the writing collection and is the pattern this
 * follows.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import * as cheerio from 'cheerio';
import { parse, stringify } from 'yaml';

/** The real copy file, which the fixture is derived from. */
const COPY = join(process.cwd(), 'src/data/zh-copy.yaml');

/** One entry of the copy file, as a fixture writes it. */
export interface CopyEntry {
  id: string;
  status: string;
  brief: string;
  length: string;
  text?: string;
}

/**
 * What to change about the real file.
 *
 * Keyed by paragraph key: a partial entry is merged over the real one — or
 * added, when no paragraph has that key — and `null` removes the paragraph
 * altogether, which is how "a page asks for a key the file does not hold" is
 * provoked.
 */
export type CopyOverrides = Record<string, Partial<CopyEntry> | null>;

export interface CopyTrialBuild {
  /** Whether `astro build` succeeded. A malformed entry must make this false. */
  ok: boolean;
  /** Everything the build wrote to stdout and stderr, for asserting on an error. */
  output: string;
  /** Every page this build emitted, as trailing-slash routes, sorted. */
  routes: string[];
  /** The entries this build was given, after the overrides were applied. */
  entries: CopyEntry[];
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

/** The real paragraphs, every one of them a draft, whatever the file says. */
function allAsDrafts(): CopyEntry[] {
  const entries: CopyEntry[] = parse(readFileSync(COPY, 'utf8'));
  return entries.map((entry) => ({ ...entry, status: 'draft' }));
}

function withOverrides(overrides: CopyOverrides): CopyEntry[] {
  const applied = allAsDrafts()
    .filter((entry) => overrides[entry.id] !== null)
    .map((entry) => ({ ...entry, ...(overrides[entry.id] ?? {}) }));

  const added = Object.entries(overrides)
    .filter(([id, override]) => override !== null && !applied.some((entry) => entry.id === id))
    .map(([id, override]) => ({ id, ...(override as Partial<CopyEntry>) }) as CopyEntry);

  return [...applied, ...added];
}

export function buildWithZhCopy(overrides: CopyOverrides): CopyTrialBuild {
  const scratch = mkdtempSync(join(tmpdir(), 'drweihungpan-zh-copy-'));
  const copyFile = join(scratch, 'zh-copy.yaml');
  const dist = join(scratch, 'dist');
  const entries = withOverrides(overrides);

  writeFileSync(copyFile, stringify(entries), 'utf8');

  let ok = true;
  let output = '';
  try {
    output = execFileSync('npx', ['astro', 'build', '--force', '--outDir', dist], {
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: '1',
        ZH_COPY_FILE: copyFile,
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
    entries,
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
