/**
 * Semantic icon suggestions: which icon a meaning calls for, and what to watch
 * out for when using it. No third-party icon artwork is embedded here, only
 * names from icon sets the project may already depend on, so nothing in this
 * file carries another project's license.
 */

/**
 * @typedef {object} IconSuggestion
 * @property {string} intent The meaning the icon stands for.
 * @property {string[]} terms Words, in English and Portuguese, that point at this intent.
 * @property {string[]} alternatives Icon names in the form `set:icon`.
 * @property {string} guidance When this icon is the right choice, and when it is not.
 */

/** @type {readonly IconSuggestion[]} */
const ICONS=[
  {intent:'home',terms:['inicio','home','dashboard','overview'],alternatives:['lucide:house','tabler:home','ph:house'],guidance:'Home or top-level application landing; avoid on analytics tabs'},
  {intent:'analytics',terms:['dados','analytics','metricas','reports','tendencia','chart'],alternatives:['lucide:chart-no-axes-combined','tabler:chart-histogram','ph:trend-up'],guidance:'Use trend icon for trends, bar chart for comparison, pie for proportions'},
  {intent:'users',terms:['equipe','usuarios','perfil','user','people'],alternatives:['lucide:users-round','tabler:users-group','ph:users-three'],guidance:'Distinguish individual identity from team management'},
  {intent:'security',terms:['seguranca','security','privacy','proteção'],alternatives:['lucide:shield-check','tabler:shield-lock','ph:shield-check'],guidance:'Do not indicate verified status without proof'},
  {intent:'settings',terms:['configuracoes','settings','preferences'],alternatives:['lucide:sliders-horizontal','tabler:adjustments','ph:sliders-horizontal'],guidance:'Prefer sliders for adjustable parameters, gear for broad configuration'},
  {intent:'finance',terms:['financeiro','pagamento','credit','payment'],alternatives:['lucide:wallet','tabler:cash-banknote','ph:bank'],guidance:'Choose money, wallet or bank according to actual task semantics'},
  {intent:'documents',terms:['documento','arquivo','files','docs'],alternatives:['lucide:files','tabler:file-description','ph:files'],guidance:'Document icon may need differentiating status and type'},
  {intent:'notifications',terms:['alerta','notificacao','activity','updates'],alternatives:['lucide:bell-dot','tabler:notification','ph:bell-ringing'],guidance:'Bell is notifications, activity is event history'},
  {intent:'navigation',terms:['menu','navigation','sidebar'],alternatives:['lucide:panel-left','tabler:layout-sidebar-left-collapse','ph:sidebar-simple'],guidance:'Avoid ambiguous hamburger when an explicit label is needed'},
  {intent:'success',terms:['sucesso','done','completed','approved'],alternatives:['lucide:circle-check','tabler:rosette-discount-check','ph:check-circle'],guidance:'Use meaningfully with status text; not color alone'},
  {intent:'error',terms:['erro','error','failure','failed'],alternatives:['lucide:circle-alert','tabler:alert-triangle','ph:warning-circle'],guidance:'Associate with message and recovery action'},
  {intent:'search',terms:['busca','search','find','lookup'],alternatives:['lucide:search','tabler:zoom','ph:magnifying-glass'],guidance:'Search normally is conventional; novelty hurts recognition'}
];

/**
 * Ranks the suggestions whose terms appear in a query.
 *
 * Scoring is a plain term count rather than anything fuzzy: a caller asking for
 * "menu de settings" should get both intents, with the better match first, and
 * a query matching nothing should return nothing rather than a weak guess.
 *
 * @param {unknown} query Free text describing what the icon must mean.
 * @returns {(IconSuggestion & {score: number})[]} Matches, best first; empty when none match.
 */
export function searchIcons(query) {
  const text = String(query).toLowerCase();
  return ICONS
    .map((icon) => ({...icon, score: icon.terms.filter((term) => text.includes(term)).length}))
    .filter((icon) => icon.score > 0)
    .sort((left, right) => right.score - left.score);
}
