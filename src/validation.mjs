import fs from 'node:fs';
import path from 'node:path';
import {PLUGIN_ROOT, readJsonFile} from './common.mjs';
import {validateKnowledge} from './knowledge.mjs';
import {listSkills, validateSkills} from './skills.mjs';

/**
 * The single entry point behind `scripts/validate.sh`: everything shipped in the
 * plugin that can be checked without a browser.
 */

/** Schemas that must stay parseable, since the tools validate user data against them. */
const SCHEMA_FILES = Object.freeze([
  'schemas/knowledge.schema.json',
  'schemas/project.schema.json',
  'schemas/scenario.schema.json',
  'schemas/concept.schema.json',
  'schemas/design-review.schema.json',
]);

/**
 * @param {string} pluginRoot Where to look.
 * @returns {string[]} One message per schema that will not parse.
 */
function checkSchemasParse(pluginRoot) {
  const errors = [];
  for (const file of SCHEMA_FILES) {
    try {
      readJsonFile(path.join(pluginRoot, file));
    } catch (error) {
      errors.push(`Invalid JSON schema ${file}: ${error.message}`);
    }
  }
  return errors;
}

/**
 * @param {string} pluginRoot Where to look.
 * @returns {string[]} One message per skill missing its manifest.
 */
function checkSkillManifests(pluginRoot) {
  const errors = [];
  for (const skill of listSkills(pluginRoot)) {
    if (!fs.existsSync(path.join(pluginRoot, 'skills', skill.name, 'manifest.json'))) {
      errors.push(`Missing manifest in ${skill.name}`);
    }
  }
  return errors;
}

/**
 * @typedef {object} ValidationReport
 * @property {{packs: number, rules: number, errors: string[]}} knowledge
 * @property {{count: number, errors: string[]}} skills
 * @property {string[]} errors Every problem found, across all checks.
 * @property {boolean} ok True when nothing failed.
 */

/**
 * Runs every check and reports all failures at once.
 *
 * @param {string} [pluginRoot] Where to look. Defaults to the installed plugin.
 * @returns {ValidationReport}
 */
export function validateAll(pluginRoot = PLUGIN_ROOT) {
  const knowledge = validateKnowledge(pluginRoot);
  const skills = validateSkills(pluginRoot);
  const errors = [
    ...knowledge.errors,
    ...skills.errors,
    ...checkSchemasParse(pluginRoot),
    ...checkSkillManifests(pluginRoot),
  ];
  return {knowledge, skills, errors, ok: errors.length === 0};
}
