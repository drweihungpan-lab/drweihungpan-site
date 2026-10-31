/**
 * The Chinese web font, described once.
 *
 * `src/layouts/BaseLayout.astro` serves it and `scripts/subset-zh-font.mjs`
 * generates it from these same values, so the stylesheet and the subset can
 * never disagree about the filename, the weight or the budget.
 */
export const zhFont = {
  family: 'Noto Sans TC Subset',

  /** Path under `public/`, and therefore the URL the built page requests. */
  url: '/fonts/noto-sans-tc-400-subset.woff2',

  /**
   * One pinned weight, not a variable axis. Keeping the 100-900 `wght` axis
   * measures 152 KB for this glyph set and blows the budget on its own;
   * instancing it at 400 measures 79 KB. See `scripts/subset-zh-font.mjs`.
   */
  weight: 400,

  /** The per-page font budget. The subset has to fit inside it alone. */
  maxBytes: 150 * 1024,

  /** Upstream source, so the subset is reproducible from nothing. */
  source:
    'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf',

  /** SIL Open Font License 1.1, shipped beside the subset as the OFL requires. */
  licenseUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/OFL.txt',
  licensePath: '/fonts/OFL.txt',
} as const;

/**
 * The only stylesheet that names the font, inlined on Chinese pages alone.
 *
 * English pages never receive an `@font-face` rule, so a Latin page cannot
 * request a web font even by accident: Latin text uses the system stack and
 * the whole font budget stays available for the Chinese subset.
 *
 * `--font-zh` lists the subset first and the system Chinese faces after it.
 * The subset carries no Latin glyphs, so Latin runs inside Chinese text fall
 * through to the system font, and any Chinese character the subset is missing
 * renders in a system face rather than as tofu.
 */
export const zhFontFaceCss = [
  '@font-face{',
  `font-family:"${zhFont.family}";`,
  `src:url("${zhFont.url}") format("woff2");`,
  `font-weight:${zhFont.weight};`,
  'font-style:normal;',
  'font-display:swap',
  '}',
  'html:lang(zh-Hant){font-family:var(--font-zh)}',
].join('');
