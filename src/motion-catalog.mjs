import path from 'node:path';
import {PLUGIN_ROOT, readJsonFile} from './common.mjs';
import {rankByScore, scoreTerms} from './search-score.mjs';

const CATALOG_PATH = path.join(PLUGIN_ROOT, 'references/motion-techniques.json');

export function loadMotionCatalog() {
  return readJsonFile(CATALOG_PATH);
}

/**
 * @param {string} query
 * @param {number} [limit]
 * @returns {object[]}
 */
export function searchMotionTechniques(query, limit = 3) {
  const {techniques} = loadMotionCatalog();
  return rankByScore(
    techniques,
    (item) =>
      scoreTerms(query, [
        ...(item.terms || []),
        item.name,
        item.id,
        item.category,
        ...(item.surfaces || []),
      ]),
    limit,
  );
}
