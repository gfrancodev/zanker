import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {escapeHtml, resolveOptionalDependency, resolveWithin} from './common.mjs';

/**
 * Produces the two kinds of asset a screen needs and a repository can carry in
 * plain text: inline SVG illustration, and motion tokens as CSS.
 *
 * Nothing here downloads or embeds third-party artwork. Every shape is drawn
 * from primitives, so the output carries no license but the project's own.
 */

/** Canvas the illustrations are drawn on. */
const ARTWORK = Object.freeze({width: 640, height: 440, radius: 22, background: '#F8FAFC'});

/** Six hex digits, the only accent format the drawing code can rely on. */
const HEX_COLOR = /^#[\da-f]{6}$/i;

/** Raster formats sharp can be asked for. */
const IMAGE_FORMATS = Object.freeze(['webp', 'avif', 'png', 'jpeg']);

/**
 * One drawing per illustration kind, each taking the accent color.
 *
 * A strategy map rather than a chain of ternaries: adding a kind is adding an
 * entry, and the validation below derives its list of valid kinds from it.
 *
 * @type {Readonly<Record<string, (accent: string) => string>>}
 */
const ARTWORK_KINDS = Object.freeze({
  empty: (accent) =>
    `<rect x="156" y="116" width="328" height="200" rx="22" fill="white" stroke="#DCE2EB" stroke-width="3"/>` +
    `<rect x="180" y="147" width="136" height="11" rx="5" fill="#DCE2EB"/>` +
    `<rect x="180" y="174" width="225" height="9" rx="4" fill="#E9ECF4"/>` +
    `<rect x="180" y="200" width="180" height="9" rx="4" fill="#E9ECF4"/>` +
    `<circle cx="360" cy="282" r="76" fill="${accent}" opacity=".14"/>` +
    `<path d="M329 286h62m-31-31v62" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`,
  abstract: (accent) =>
    `<circle cx="320" cy="230" r="161" fill="${accent}" opacity=".1"/>` +
    `<circle cx="320" cy="230" r="107" fill="none" stroke="${accent}" stroke-width="4" opacity=".6"/>` +
    `<path d="M207 240Q310 48 439 224Q321 409 207 240Z" fill="${accent}" opacity=".77"/>` +
    `<circle cx="330" cy="222" r="28" fill="white"/>`,
  chart: (accent) =>
    `<path d="M125 340h390" stroke="#CED8E8" stroke-width="4"/>` +
    `<path d="M140 316l85-91 78 34 83-136 106 49" stroke="${accent}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="386" cy="123" r="16" fill="white" stroke="${accent}" stroke-width="9"/>`,
});

/**
 * Writes an inline SVG illustration into the project.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} [options.out] Path inside the project to write to.
 * @param {string} [options.title] Accessible name, used for `title` and `aria-label`.
 * @param {string} [options.kind] One of the keys of {@link ARTWORK_KINDS}.
 * @param {string} [options.accent] Six digit hex accent color.
 * @returns {string} Absolute path of the file written.
 * @throws {Error} When the accent is not a hex color or the kind is unknown.
 */
export function createSVG({project, out = 'zanker-art.svg', title = 'Empty state', kind = 'empty', accent = '#5b73eb'}) {
  if (!HEX_COLOR.test(accent)) throw new Error('Accent must be a 6-digit hex color');
  const draw = ARTWORK_KINDS[kind];
  if (!draw) throw new Error(`Available SVG kinds: ${Object.keys(ARTWORK_KINDS).join(', ')}`);

  const label = escapeHtml(title);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ARTWORK.width} ${ARTWORK.height}" role="img" aria-label="${label}">` +
    `<title>${label}</title>` +
    `<rect width="${ARTWORK.width}" height="${ARTWORK.height}" rx="${ARTWORK.radius}" fill="${ARTWORK.background}"/>` +
    `${draw(accent)}</svg>\n`;

  const destination = resolveWithin(project, out);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, svg);
  return destination;
}

/**
 * Writes motion tokens as CSS, with a reduced-motion block that actually removes
 * the animation rather than merely shortening it.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} [options.out] Path inside the project to write to.
 * @returns {string} Absolute path of the file written.
 */
export function generateMotionCSS({project, out = 'zanker.motion.css'}) {
  const destination = resolveWithin(project, out);
  const css = `/* Zanker motion tokens: intentionally modest and reduced-motion aware */
:root {
 --zanker-motion-fast: 120ms;
 --zanker-motion-medium: 220ms;
 --zanker-motion-slow: 350ms;
 --zanker-ease-standard: cubic-bezier(.2,.8,.2,1);
}
.zanker-enter {animation: zanker-enter var(--zanker-motion-medium) var(--zanker-ease-standard) both;}
@keyframes zanker-enter {from {opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce) {
 .zanker-enter {animation:none;}
 *, *::before, *::after {scroll-behavior:auto;}
}
`;
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, css);
  return destination;
}

/**
 * Resizes and re-encodes an image using the project's own sharp installation.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} options.input Source image, inside the project.
 * @param {string} options.output Destination, inside the project.
 * @param {number} [options.width] Maximum width. Images are never enlarged.
 * @param {string} [options.format] One of {@link IMAGE_FORMATS}.
 * @returns {Promise<string>} Absolute path of the file written.
 * @throws {Error} When the input is missing, the format is unsupported, or
 *   sharp is not installed in the project.
 */
export async function optimizeImage({project, input, output, width = 1400, format = 'webp'}) {
  const source = resolveWithin(project, input);
  const destination = resolveWithin(project, output);
  if (!fs.existsSync(source)) throw new Error('Input not found');
  if (!IMAGE_FORMATS.includes(format)) throw new Error('Unsupported format');

  const sharpEntry = resolveOptionalDependency('sharp', [project]);
  if (!sharpEntry) {
    throw new Error('Sharp is optional. Install sharp in your project before optimizing: npm install -D sharp');
  }
  const sharp = createRequire(import.meta.url)(sharpEntry);

  fs.mkdirSync(path.dirname(destination), {recursive: true});
  await sharp(source).resize({width: Number(width), withoutEnlargement: true})[format]().toFile(destination);
  return destination;
}
