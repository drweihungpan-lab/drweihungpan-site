/**
 * Regenerates the Chinese web font from the glyphs this site actually uses.
 *
 *     npm run font:subset
 *
 * Noto Sans TC is a 11.9 MB variable font covering tens of thousands of
 * characters. The site renders a few hundred. This script cuts the font down
 * to exactly the characters that appear in the source, instances the weight
 * axis at a single value, and writes one woff2 under `public/fonts/`.
 *
 * Two decisions are load-bearing, both measured on this glyph set:
 *
 *   - Keeping the variable `wght` axis costs 152 KB and breaks the 150 KB
 *     budget on its own. Instancing it at 400 costs 79 KB.
 *   - ASCII and Latin are excluded. The subset is listed first in the Chinese
 *     font stack, so any glyph it contains wins; leaving Latin out lets Latin
 *     runs inside Chinese text fall through to the system font, which has a
 *     better Latin face and costs nothing.
 *
 * The output is committed, because a build should not need an 11.9 MB
 * download. The suite asserts that every Chinese character in the built pages
 * has a glyph here, so forgetting to re-run this fails the suite rather than
 * showing a visitor tofu.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { zhFont } from '../src/lib/fonts.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_CACHE = join(ROOT, 'fonts-src', 'NotoSansTC[wght].ttf');
const OUTPUT = join(ROOT, 'public', zhFont.url.replace(/^\//, ''));
const LICENCE = join(ROOT, 'public', zhFont.licensePath.replace(/^\//, ''));

/**
 * Characters the subset must cover: Han, plus CJK and fullwidth punctuation.
 * Deliberately not ASCII, Latin or digits — those fall through to the system
 * font. See the note above.
 */
const WANTED = /[\p{Script=Han}　-〿＀-￯]/gu;

/** Every file under `src/`, so a Chinese string is found wherever it is written. */
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(absolute) : [absolute];
  });
}

function glyphs() {
  const found = new Set();
  for (const file of sourceFiles(join(ROOT, 'src'))) {
    for (const character of readFileSync(file, 'utf8').match(WANTED) ?? []) {
      found.add(character);
    }
  }
  // Sorted so the same source always produces byte-identical output.
  return [...found].sort().join('');
}

async function sourceFont() {
  const override = process.env.NOTO_SANS_TC_TTF;
  for (const candidate of [override, SOURCE_CACHE].filter(Boolean)) {
    try {
      return readFileSync(candidate);
    } catch {
      /* fall through to the download */
    }
  }

  console.log(`Downloading ${zhFont.source}`);
  const response = await fetch(zhFont.source);
  if (!response.ok) throw new Error(`Could not download the source font: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  mkdirSync(dirname(SOURCE_CACHE), { recursive: true });
  writeFileSync(SOURCE_CACHE, buffer);
  console.log(`Cached the source font at fonts-src/ (git-ignored, ${buffer.length} bytes)`);
  return buffer;
}

async function licence() {
  const response = await fetch(zhFont.licenseUrl);
  if (!response.ok) throw new Error(`Could not download the font licence: ${response.status}`);
  return await response.text();
}

const characters = glyphs();
if (characters.length === 0) {
  throw new Error('Found no Chinese characters under src/ — refusing to write an empty subset.');
}

const subset = await subsetFont(await sourceFont(), characters, {
  targetFormat: 'woff2',
  variationAxes: { wght: zhFont.weight },
});

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, subset);
writeFileSync(LICENCE, await licence());

const budget = `${Math.round((subset.length / zhFont.maxBytes) * 100)}% of the ${
  zhFont.maxBytes / 1024
} KB budget`;
console.log(
  `Wrote public${zhFont.url}: ${characters.length} characters, ${subset.length} bytes (${budget})`,
);

if (subset.length > zhFont.maxBytes) {
  throw new Error(
    `The subset is ${subset.length} bytes, over the ${zhFont.maxBytes} byte budget. ` +
      'Cut characters, or slice the font by unicode-range so a page downloads only what it renders.',
  );
}
