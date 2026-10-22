/**
 * Shared term scoring for local reference catalogs (sites, components).
 *
 * @param {string} query
 * @param {readonly string[]} terms
 * @returns {number}
 */
export function scoreTerms(query, terms) {
  const text = String(query).toLowerCase();
  return terms.filter((term) => text.includes(term.toLowerCase())).length;
}

/**
 * @template T
 * @param {T[]} items
 * @param {(item: T) => number} scoreOf
 * @param {number} [limit]
 * @returns {(T & {score: number})[]}
 */
export function rankByScore(items, scoreOf, limit = 3) {
  return items
    .map((item) => ({...item, score: scoreOf(item)}))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
