/**
 * Generates the two-page PDF CV from the records the about page renders.
 *
 *     npm run cv:pdf
 *
 * The CV and the about page have one source: `src/data/career.json`,
 * `src/data/publications.json` and `src/data/awards.json`. Adding a paper
 * updates the English page, the Chinese page and this document from the same
 * edit, which is the whole point of holding the records as data.
 *
 * Three decisions are load-bearing:
 *
 *   - **The revision date lives inside the document**, in the footer of both
 *     pages, never in the filename. The link `/cv.pdf` is printed on a slide
 *     and forwarded by hiring managers, so it has to survive every update.
 *   - **Nothing is invented.** A fact the owner has not supplied is written
 *     here exactly as the site writes it — `[TO BE SUPPLIED: …]` — so an
 *     unfilled line is visible instead of reading like an answer.
 *   - **No photograph, date of birth, nationality, marital status or home
 *     address.** A German CV traditionally carries all five; none of them is
 *     anyone's business on a document that gets forwarded, and a hiring
 *     decision must not rest on them. `tests/about.test.ts` asserts their
 *     absence, and that the result is exactly two pages.
 *
 * The PDF is written by hand rather than with a library: it is text in two
 * base-14 fonts, which needs no dependency, and leaving the content streams
 * uncompressed is what lets the test suite read what the document says.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACEHOLDER_MARK, isUnknown, operator } from '../src/lib/legal.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'public', 'cv.pdf');

/**
 * The revision date this document carries. Bump it when the CV's content
 * changes; it is the only date a reader can use to tell two copies apart.
 */
const REVISION = '2026-11-01';

/** A4, in points, with the margins this document is set in. */
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { top: 64, bottom: 56, left: 56, right: 56 };
const MEASURE = PAGE.width - MARGIN.left - MARGIN.right;

/** The two base-14 fonts, so the file embeds nothing and stays small. */
const REGULAR = 'F1';
const BOLD = 'F2';

/**
 * Average glyph width as a fraction of the font size, used to wrap lines.
 *
 * Helvetica's real widths vary per glyph; these two factors are deliberately
 * generous, so a wrapped line is never wider than the measure even where the
 * text is all capitals.
 */
const WIDTH_FACTOR = { [REGULAR]: 0.52, [BOLD]: 0.56 };

const records = (name) => JSON.parse(readFileSync(join(ROOT, 'src', 'data', `${name}.json`), 'utf8'));

const career = records('career');
const publications = records('publications');
const awards = records('awards');

/** A fact, as the site renders it: its value, or a marked admission. */
function fact(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (isUnknown(value) && typeof value.unknown === 'string') {
    return `[${PLACEHOLDER_MARK}: ${value.unknown}]`;
  }
  throw new Error(`Not a fact: ${JSON.stringify(value)}`);
}

/** A year on a position: the year, the open end, or the unsupplied fact. */
const year = (value) => (value === 'present' ? 'present' : fact(value));

const byStart = (a, b) =>
  (typeof a.start === 'number' ? a.start : Infinity) -
  (typeof b.start === 'number' ? b.start : Infinity);

/* ------------------------------------------------------------------ content */

const heading = (text) => ({ font: BOLD, size: 11.5, lead: 15, before: 16, after: 5, text });
const line = (text) => ({ font: BOLD, size: 10, lead: 13.5, before: 0, after: 1, text });
const body = (text) => ({ font: REGULAR, size: 9.5, lead: 13, before: 0, after: 8, text });
const breakPage = { kind: 'break' };

const blocks = [
  { font: BOLD, size: 20, lead: 24, before: 0, after: 2, text: 'Dr. Wei-Hung Pan' },
  {
    font: REGULAR,
    size: 11,
    lead: 15,
    before: 0,
    after: 4,
    text: 'Engineering and Analysis for clinical research — data infrastructure and statistics',
  },
  body(`Email: ${fact(operator.email)} · Telephone: ${fact(operator.telephone)}`),

  heading('Profile'),
  body(
    'I have worked with health and clinical data since 2012, and I both build the data ' +
      'infrastructure a study runs on — clinical data pipelines, reproducible analysis setups, ' +
      'apps and dashboards, registry and cohort databases — and run the statistics on it. ' +
      'The combination is the part that is hard to find: a statistician or a developer is ' +
      'available in any university department, one person who will build the data layer and ' +
      'defend the methods that come out of it is not. I teach statistics, machine learning and ' +
      'AI to research teams and companies in Taiwan and Germany, in Mandarin, English or German.',
  ),

  heading('Experience'),
  ...career.sort(byStart).flatMap((position) => [
    line(`${year(position.start)} – ${year(position.end)}   ${fact(position.organisation)}`),
    body(position.role.en),
  ]),

  heading('Education'),
  line('PhD in Bioinformatics'),
  body(
    'Doctoral research from 2012 at the National Health Research Institutes (NHRI), Taiwan, on ' +
      'health and clinical data.',
  ),

  breakPage,

  heading('Publications'),
  ...publications
    .sort((a, b) => b.year - a.year)
    .flatMap((publication) => [
      line(`${publication.year}   ${publication.journal}`),
      body(fact(publication.title)),
    ]),

  heading('Awards'),
  ...awards
    .sort((a, b) => b.year - a.year)
    .flatMap((award) => [line(`${award.year}   ${award.title}`), body(`${award.awarder}. ${award.detail.en}`)]),

  heading('Teaching'),
  line('University of Europe for Applied Sciences — Adjunct Lecturer in Mathematics & Statistics'),
  body('Teaching at German universities since 2022.'),
  line('Berliner Hochschule für Technik — Lecturer'),
  body(
    'Statistics, machine learning and AI, delivered to university cohorts and to company teams, ' +
      'in Mandarin, English or German.',
  ),

  heading('What I deliver'),
  line('Engineering'),
  body(
    'A clinical data pipeline; a reproducible analysis setup; an app or a dashboard; a registry ' +
      'or cohort database.',
  ),
  line('Analysis'),
  body(
    'Study design, analysis, publication statistics, reviewer response, and coaching a ' +
      'researcher to run and defend their own analysis.',
  ),

  heading('Languages'),
  body('Mandarin Chinese · English · German'),
];

/* ------------------------------------------------------------------- layout */

/** Wraps a block's text to the measure, using the width factor for its font. */
function wrap(block) {
  const perCharacter = block.size * WIDTH_FACTOR[block.font];
  const maximum = Math.floor(MEASURE / perCharacter);
  const lines = [];
  let current = '';
  for (const word of block.text.split(/\s+/)) {
    const candidate = current === '' ? word : `${current} ${word}`;
    if (candidate.length > maximum && current !== '') {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

/** Lays the blocks out into pages of positioned, single-font lines. */
function paginate() {
  const pages = [[]];
  let y = PAGE.height - MARGIN.top;

  const newPage = () => {
    pages.push([]);
    y = PAGE.height - MARGIN.top;
  };

  for (const block of blocks) {
    if (block.kind === 'break') {
      newPage();
      continue;
    }
    y -= block.before;
    for (const text of wrap(block)) {
      if (y - block.lead < MARGIN.bottom) newPage();
      y -= block.lead;
      pages.at(-1).push({ text, x: MARGIN.left, y, font: block.font, size: block.size });
    }
    y -= block.after;
  }

  return pages;
}

const pages = paginate();

if (pages.length !== 2) {
  throw new Error(
    `The CV laid out as ${pages.length} pages; it must be exactly two. Adjust the content or ` +
      'the spacing in scripts/build-cv-pdf.mjs.',
  );
}

/** The footer that carries the revision date inside the document. */
pages.forEach((lines, index) => {
  lines.push({
    text: `Dr. Wei-Hung Pan — Curriculum vitae — Revision date: ${REVISION} — Page ${index + 1} of ${pages.length}`,
    x: MARGIN.left,
    y: MARGIN.bottom - 24,
    font: REGULAR,
    size: 8,
  });
});

/* ---------------------------------------------------------------- the file */

/**
 * The characters WinAnsiEncoding places outside Latin-1, mapped to their
 * byte. Typographic dashes and quotes are the only ones this document uses.
 */
const WIN_ANSI = {
  '\u2013': '\u0096',
  '\u2014': '\u0097',
  '\u2018': '\u0091',
  '\u2019': '\u0092',
  '\u201c': '\u0093',
  '\u201d': '\u0094',
  '\u2026': '\u0085',
};

/** PDF string escaping, in WinAnsi — which Latin-1 code points map onto. */
function pdfString(source) {
  const text = [...source].map((character) => WIN_ANSI[character] ?? character).join('');
  for (const character of text) {
    if (character.codePointAt(0) > 0xff) {
      throw new Error(
        `"${character}" cannot be written in WinAnsiEncoding. The CV is an English document; ` +
          'Chinese copy belongs on the Chinese about page.',
      );
    }
  }
  return text.replace(/([\\()])/g, '\\$1');
}

const contentStream = (lines) =>
  lines
    .map(
      ({ font, size, x, y, text }) =>
        `BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfString(text)}) Tj ET`,
    )
    .join('\n');

/**
 * The object graph, written in order. Object 1 is the catalogue, 2 the page
 * tree, then a page and its content stream per page, then the two fonts and
 * the document information.
 */
const objects = [];
const add = (body) => objects.push(body);

const pageObjectNumbers = pages.map((_, index) => 3 + index * 2);

add(`<< /Type /Catalog /Pages 2 0 R >>`);
add(
  `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectNumbers
    .map((number) => `${number} 0 R`)
    .join(' ')}] >>`,
);

const fontObject = { [REGULAR]: 3 + pages.length * 2, [BOLD]: 4 + pages.length * 2 };

pages.forEach((lines, index) => {
  const contents = contentStream(lines);
  add(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width.toFixed(2)} ${PAGE.height.toFixed(
      2,
    )}] /Resources << /Font << /${REGULAR} ${fontObject[REGULAR]} 0 R /${BOLD} ${
      fontObject[BOLD]
    } 0 R >> >> /Contents ${pageObjectNumbers[index] + 1} 0 R >>`,
  );
  add(`<< /Length ${Buffer.byteLength(contents, 'latin1')} >>\nstream\n${contents}\nendstream`);
});

add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);
add(
  `<< /Title (Curriculum vitae - Dr. Wei-Hung Pan) /Producer (scripts/build-cv-pdf.mjs) /ModDate (D:${REVISION.replace(
    /-/g,
    '',
  )}000000Z) >>`,
);

const infoObject = objects.length;

let pdf = '%PDF-1.7\n';
const offsets = [];
objects.forEach((body, index) => {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
});

const startxref = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const offset of offsets) {
  pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoObject} 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

writeFileSync(OUTPUT, Buffer.from(pdf, 'latin1'));

console.log(
  `Wrote public/cv.pdf: ${pages.length} pages, ${Buffer.byteLength(pdf, 'latin1')} bytes, revision ${REVISION}.`,
);
