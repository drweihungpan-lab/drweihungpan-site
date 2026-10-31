import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import { describe, expect, it } from 'vitest';
import { DIST, assetBytes, assetExists, page, styles } from './site';

const SUBSET = 'fonts/noto-sans-tc-400-subset.woff2';

/** The per-page font budget the spec's performance budget allows. */
const BUDGET_BYTES = 150 * 1024;

/** `openSync` may return a collection; the subset is always a single face. */
function openSingleFont(file: string): fontkit.Font {
  const opened = fontkit.openSync(file);
  if ('fonts' in opened) throw new Error(`${file} is a font collection, not a single font`);
  return opened;
}

describe('the Chinese font', () => {
  it('ships as a subset that fits the font budget on its own', () => {
    expect(assetExists(SUBSET)).toBe(true);
    expect(assetBytes(SUBSET)).toBeLessThanOrEqual(BUDGET_BYTES);
  });

  it('is declared and preloaded on a Chinese page', () => {
    const $ = page('/zh/');
    expect(styles('/zh/')).toContain('@font-face');
    expect($(`link[rel="preload"][as="font"][href="/${SUBSET}"]`)).toHaveLength(1);
  });

  it('carries a glyph for every Chinese character the built pages render', () => {
    const font = openSingleFont(join(DIST, SUBSET));
    const rendered = page('/zh/')('body').text();
    const han = [...new Set(rendered.match(/\p{Script=Han}/gu) ?? [])];

    expect(han.length).toBeGreaterThan(0);

    const missing = han.filter((character) => !font.hasGlyphForCodePoint(character.codePointAt(0) ?? 0));

    expect(missing).toEqual([]);
  });

  it('is accompanied by its licence, as the Open Font License requires', () => {
    expect(assetExists('fonts/OFL.txt')).toBe(true);
    expect(readFileSync(join(DIST, 'fonts/OFL.txt'), 'utf8')).toContain('SIL OPEN FONT LICENSE');
  });
});

describe('Latin text', () => {
  it('ships no web font at all', () => {
    expect(styles('/')).not.toContain('@font-face');
    expect(page('/')('link[rel="preload"][as="font"]')).toHaveLength(0);
    expect(page('/')('link[href$=".woff2"]')).toHaveLength(0);
  });
});
