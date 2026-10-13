import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * An append-only log of design decisions inside the project's `.zanker/`
 * workspace, so a later session can see what was already settled and why.
 *
 * The file is JSON Lines rather than one JSON document: appending a line is
 * atomic enough for this purpose and cannot corrupt earlier records.
 */

/** Where the log lives, relative to the project root. */
const DECISION_LOG = Object.freeze(['.zanker', 'decisions.jsonl']);

/** States a decision can be in. */
const VALID_STATUSES = Object.freeze(['proposed', 'approved', 'rejected']);

/** Bounds, so one oversized record cannot make the log unreadable. */
const LIMITS = Object.freeze({title: 200, decision: 6000, evidence: 30});

/**
 * Honest provenance. These records come from a command line, so they are a note
 * that an agent was told something, not proof that a human agreed to it.
 */
const PROVENANCE = 'CLI input; not proof of real user consent';

/**
 * @typedef {object} DecisionRecord
 * @property {string} id Random UUID.
 * @property {string} at ISO timestamp.
 * @property {string} title Short name of the decision.
 * @property {string} decision What was decided, and why.
 * @property {'proposed'|'approved'|'rejected'} status
 * @property {string|null} approvedBy Who approved it, null unless approved.
 * @property {string[]} evidence Paths or links backing the decision.
 * @property {string} source How much this record actually proves.
 */

/**
 * Appends one decision to the project's log.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} options.title Short name of the decision.
 * @param {string} options.decision What was decided, and why.
 * @param {'proposed'|'approved'|'rejected'} [options.status]
 * @param {string[]} [options.evidence] Paths or links backing the decision.
 * @param {string} [options.approvedBy] Required when the status is approved.
 * @returns {DecisionRecord} The record as written.
 * @throws {Error} When the record is incomplete, the status is unknown, or an
 *   approval names nobody.
 */
export function recordDecision({project, title, decision, status = 'proposed', evidence = [], approvedBy = ''}) {
  if (!title?.trim() || !decision?.trim()) throw new Error('Decision title and body are required');
  if (!VALID_STATUSES.includes(status)) throw new Error('Invalid status');
  if (status === 'approved' && !approvedBy?.trim()) {
    throw new Error('Approval must identify the actual approving human; agent cannot self-approve');
  }

  const record = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    title: title.slice(0, LIMITS.title),
    decision: decision.slice(0, LIMITS.decision),
    status,
    approvedBy: status === 'approved' ? approvedBy : null,
    evidence: evidence.slice(0, LIMITS.evidence),
    source: PROVENANCE,
  };

  const logPath = path.join(project, ...DECISION_LOG);
  fs.mkdirSync(path.dirname(logPath), {recursive: true});
  fs.appendFileSync(logPath, JSON.stringify(record) + '\n');
  return record;
}

/**
 * Reads the project's decision log.
 *
 * @param {string} project Absolute path of the project.
 * @returns {DecisionRecord[]} Every record in the order written, empty when there is no log.
 */
export function listDecisions(project) {
  const logPath = path.join(project, ...DECISION_LOG);
  if (!fs.existsSync(logPath)) return [];
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
