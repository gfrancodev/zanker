import path from 'node:path';
import {PLUGIN_ROOT, readJsonFile} from './common.mjs';
import {rankByScore, scoreTerms} from './search-score.mjs';

const CATALOG_PATH = path.join(PLUGIN_ROOT, 'references/components.json');

/** @returns {readonly string[]} */
export function listComponentNames() {
  const {components} = readJsonFile(CATALOG_PATH);
  return components.map((c) => c.name);
}

/**
 * @param {string} query
 * @param {number} [limit]
 * @returns {object[]}
 */
export function searchComponents(query, limit = 5) {
  const {components} = readJsonFile(CATALOG_PATH);
  return rankByScore(
    components,
    (item) => scoreTerms(query, [...(item.terms || []), item.name, item.group]),
    limit,
  );
}
