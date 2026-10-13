import path from 'node:path';
import {PLUGIN_ROOT, collectFiles, readJsonFile} from './common.mjs';

/**
 * Validates the JSON knowledge packs the agent reads as reference.
 *
 * Packs are data, never evaluated. The checks here exist because a rule the
 * agent cites must be traceable: a rule with no source is an assertion with a
 * citation-shaped hole in it, and a duplicated rule id makes two different
 * rules indistinguishable in a report.
 */

/** Every pack is a JSON file under `knowledge/`, except the index itself. */
const PACK_SCAN = Object.freeze({maxDepth: 4, maxEntries: 300});

/** Fields without which a pack cannot be loaded or addressed. */
const REQUIRED_PACK_FIELDS = Object.freeze(['id', 'title', 'category']);

/**
 * @typedef {object} KnowledgePack
 * @property {string} id Stable identifier a skill names to load the pack.
 * @property {string} title Human readable name.
 * @property {string} category Folder level grouping.
 * @property {object[]} rules The rules the pack carries.
 * @property {string} _file Path relative to the plugin root, for error messages.
 */

/**
 * Reads every pack from disk, sorted by id.
 *
 * @param {string} pluginRoot Where to look.
 * @returns {KnowledgePack[]}
 */
function readAllPacks(pluginRoot) {
  return collectFiles(path.join(pluginRoot, 'knowledge'), {
    matches: (file) => file.endsWith('.json') && !file.endsWith('index.json'),
    ...PACK_SCAN,
  })
    .map((file) => ({...readJsonFile(file), _file: path.relative(pluginRoot, file)}))
    .sort((left, right) => left.id.localeCompare(right.id));
}

/**
 * Checks every pack and every rule, collecting all problems rather than
 * stopping at the first, so one run tells the author everything to fix.
 *
 * @param {string} [pluginRoot] Where to look. Defaults to the installed plugin.
 * @returns {{packs: number, rules: number, errors: string[]}}
 */
export function validateKnowledge(pluginRoot = PLUGIN_ROOT) {
  const packs = readAllPacks(pluginRoot);
  const errors = [];
  const seenRuleIds = new Set();

  for (const pack of packs) {
    if (REQUIRED_PACK_FIELDS.some((field) => !pack[field]) || !Array.isArray(pack.rules)) {
      errors.push(`Invalid pack ${pack._file}`);
    }
    for (const rule of pack.rules || []) {
      if (!rule.id || !rule.title || !rule.principles?.length || !rule.sources?.length) {
        errors.push(`Incomplete knowledge: ${pack.id}/${rule.id}`);
      }
      if (seenRuleIds.has(rule.id)) errors.push(`Duplicate rule: ${rule.id}`);
      seenRuleIds.add(rule.id);
      for (const source of rule.sources || []) {
        if (!source.url?.startsWith('https://')) errors.push(`Invalid source in ${rule.id}`);
      }
    }
  }

  return {packs: packs.length, rules: seenRuleIds.size, errors};
}
