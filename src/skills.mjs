import fs from 'node:fs';
import path from 'node:path';
import {PLUGIN_ROOT} from './common.mjs';

/**
 * Enumerates and validates the installed skills.
 *
 * A skill is a directory under `skills/` holding a `SKILL.md`. Anything else in
 * that directory is ignored rather than reported, because a stray file there is
 * not a broken skill.
 */

/** Pulls the `description` line out of a skill's YAML front matter. */
const DESCRIPTION_LINE = /^description: (.+)$/m;

/** Front matter must open the file, declare a kebab-case name, and close again. */
const FRONT_MATTER_CHECKS = Object.freeze([
  (content) => content.startsWith('---\n'),
  (content) => /^name: [a-z0-9-]+$/m.test(content),
  (content) => /^---\n[\s\S]*?\n---\n/.test(content),
]);

/**
 * @typedef {object} InstalledSkill
 * @property {string} name Directory name, which is also the skill identifier.
 * @property {string} description Front matter description, empty when absent.
 * @property {string} path Absolute path of the skill's `SKILL.md`.
 */

/**
 * Lists every installed skill, sorted by name so output is deterministic.
 *
 * @param {string} [pluginRoot] Where to look. Defaults to the installed plugin.
 * @returns {InstalledSkill[]}
 */
export function listSkills(pluginRoot = PLUGIN_ROOT) {
  const skillsDirectory = path.join(pluginRoot, 'skills');
  return fs
    .readdirSync(skillsDirectory, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsDirectory, entry.name, 'SKILL.md')))
    .map((entry) => {
      const skillFile = path.join(skillsDirectory, entry.name, 'SKILL.md');
      const content = fs.readFileSync(skillFile, 'utf8');
      return {
        name: entry.name,
        description: DESCRIPTION_LINE.exec(content)?.[1] || '',
        path: skillFile,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * Reports which skills have unusable front matter.
 *
 * A harness discovers a skill by reading that front matter, so a skill whose
 * header is malformed is invisible rather than merely untidy.
 *
 * @param {string} [pluginRoot] Where to look. Defaults to the installed plugin.
 * @returns {{count: number, errors: string[]}} Names of the skills that failed.
 */
export function validateSkills(pluginRoot = PLUGIN_ROOT) {
  const skills = listSkills(pluginRoot);
  const errors = [];
  for (const skill of skills) {
    const content = fs.readFileSync(skill.path, 'utf8');
    const valid = Boolean(skill.description) && FRONT_MATTER_CHECKS.every((check) => check(content));
    if (!valid) errors.push(skill.name);
  }
  return {count: skills.length, errors};
}
