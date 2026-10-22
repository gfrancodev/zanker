import path from 'node:path';
import {PLUGIN_ROOT, readJsonFile} from './common.mjs';
import {rankByScore, scoreTerms} from './search-score.mjs';

const CATALOG_PATH = path.join(PLUGIN_ROOT, 'references/ux-ui-sites.json');

/**
 * @returns {{schemaVersion: string, sites: object[]}}
 */
function loadCatalog() {
  return readJsonFile(CATALOG_PATH);
}

/**
 * @param {string} query
 * @param {number} [limit]
 * @returns {object[]}
 */
export function searchReferenceSites(query, limit = 3) {
  const {sites} = loadCatalog();
  return rankByScore(
    sites,
    (site) => scoreTerms(query, [...(site.terms || []), site.name, site.type]),
    limit,
  );
}
