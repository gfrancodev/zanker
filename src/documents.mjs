import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {resolveWithin, toSafeSlug, writeJsonFile} from './common.mjs';

/**
 * Records what a screen looks like and where its real implementation lives.
 *
 * The one rule this module exists to enforce: a Visual Spec document is a
 * reference, never an input to code generation. It is recorded by path and
 * checksum, parsed only far enough to confirm it is JSON, and never read for
 * structure. The project's own code stays the source of truth, and the written
 * record says so in three places so a later reader cannot miss it.
 */

/** The specification this documentation points at. */
const SPEC_URL = 'https://visualspec.dev/specification/1.0';

/** How finished the documented screen is. */
const VALID_STATUSES = Object.freeze(['implemented', 'conceptual', 'unverified']);

/** Where documentation lands, relative to the project root. */
const DOCUMENTATION_DIR = Object.freeze(['.zanker', 'documentation']);

/** Repeated verbatim into every record, because the rule travels with the file. */
const POLICIES = Object.freeze([
  'Never generate or reconstruct production code from Visual Spec',
  'Visual Spec is optional and not authoritative over source code',
  'Conceptual documentation must not be described as tested implementation',
]);

/**
 * Resolves the comma separated source list, confirming each file exists.
 *
 * @param {string} projectRoot Absolute project root.
 * @param {string} sourceList Comma separated paths inside the project.
 * @returns {string[]} Absolute paths.
 * @throws {Error} When a listed file is missing, since documenting an absent
 *   implementation is how a record starts lying.
 */
function resolveSourceFiles(projectRoot, sourceList) {
  if (!sourceList) return [];
  const resolved = sourceList.split(',').map((entry) => resolveWithin(projectRoot, entry.trim()));
  for (const file of resolved) {
    if (!fs.existsSync(file)) throw new Error(`Source not found: ${file}`);
  }
  return resolved;
}

/**
 * @param {string} projectRoot Absolute project root.
 * @param {string[]} screenshots Paths inside the project.
 * @returns {string[]} Paths relative to the project root.
 * @throws {Error} When a screenshot is missing.
 */
function resolveScreenshots(projectRoot, screenshots) {
  return screenshots.map((entry) => {
    const resolved = resolveWithin(projectRoot, entry);
    if (!fs.existsSync(resolved)) throw new Error(`Screenshot not found: ${entry}`);
    return path.relative(projectRoot, resolved);
  });
}

/**
 * Records a Visual Spec document by path and checksum.
 *
 * The file is parsed only to confirm it is JSON. Nothing reads its structure,
 * which is the whole point: a checksum proves which document was referenced
 * without the document ever becoming an input.
 *
 * @param {string} projectRoot Absolute project root.
 * @param {string} specPath Path inside the project, empty when there is none.
 * @returns {object|null} The reference, or null when no document was attached.
 */
function readVisualSpecReference(projectRoot, specPath) {
  if (!specPath) return null;
  const resolved = resolveWithin(projectRoot, specPath);
  const content = fs.readFileSync(resolved);
  JSON.parse(content.toString('utf8'));
  return {
    path: path.relative(projectRoot, resolved),
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
    format: 'External Visual Spec JSON reference; not transformed, parsed into components, or treated as source code',
    schemaConformance: 'Not automatically verified',
  };
}

/**
 * Renders the human readable companion to `document.json`.
 *
 * @param {object} metadata The record written alongside it.
 * @returns {string} Markdown contents.
 */
function renderReadme(metadata) {
  const sourceFiles = metadata.implementation.sourceFiles.map((file) => `- \`${file}\``).join('\n') || '- Não informada';
  const screenshots = metadata.screenshots.map((file) => `- [${path.basename(file)}](../../../${file})`).join('\n')
    || '- Ainda não produzidas';
  const reference = metadata.visualSpec.reference;
  return `# ${metadata.title}\n\n**Status:** ${metadata.status}\n\n${metadata.description}\n\n`
    + `## Implementação real (fonte de verdade)\n${sourceFiles}\n\n`
    + `## Evidências visuais\n${screenshots}\n\n`
    + `## Visual Spec (documentação somente)\n`
    + `- Especificação de referência: ${SPEC_URL}\n`
    + `- Documento: ${reference?.path || 'Ainda não anexado'}\n`
    + `- Conformidade com o schema: ${reference?.schemaConformance || 'Não aplicável'}\n\n`
    + `> **Regra:** este registro nunca serve de input canônico para gerar código. `
    + `O código real e o design system continuam sendo as fontes de verdade.\n`;
}

/**
 * Writes a documentation record for one screen or component.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} [options.title] Name of what is documented.
 * @param {string} [options.source] Comma separated implementation files.
 * @param {string} [options.visualspec] Visual Spec JSON to reference.
 * @param {string[]} [options.screenshots] Evidence images, inside the project.
 * @param {string} [options.description] Prose describing the screen.
 * @param {'implemented'|'conceptual'|'unverified'} [options.status]
 * @returns {{dir: string, metadata: object}} Where it was written, and what was written.
 * @throws {Error} When the status is unknown or a referenced file is missing.
 */
export function documentVisual({
  project, title = 'Visual documentation', source = '', visualspec = '',
  screenshots = [], description = '', status = 'implemented',
}) {
  if (!VALID_STATUSES.includes(status)) throw new Error('Invalid status');

  const projectRoot = path.resolve(project);
  const sourceFiles = resolveSourceFiles(projectRoot, source);
  const screenshotPaths = resolveScreenshots(projectRoot, screenshots);
  const specReference = readVisualSpecReference(projectRoot, visualspec);

  const metadata = {
    schemaVersion: '1.0',
    kind: 'zanker-visual-documentation',
    title,
    description,
    status,
    generatedAt: new Date().toISOString(),
    visualSpec: {
      specification: SPEC_URL,
      role: 'Documentation and visual reference ONLY',
      reference: specReference,
    },
    implementation: {
      sourceOfTruth: 'real project code',
      sourceFiles: sourceFiles.map((file) => path.relative(projectRoot, file)),
    },
    screenshots: screenshotPaths,
    policies: POLICIES,
  };

  const documentDirectory = path.join(projectRoot, ...DOCUMENTATION_DIR, toSafeSlug(title));
  fs.mkdirSync(documentDirectory, {recursive: true});
  writeJsonFile(path.join(documentDirectory, 'document.json'), metadata);
  fs.writeFileSync(path.join(documentDirectory, 'README.md'), renderReadme(metadata));
  return {dir: documentDirectory, metadata};
}
