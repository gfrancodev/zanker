import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {URL} from 'node:url';
import {assertLoopback, createSessionToken, escapeHtml, readJsonFile, resolveWithin} from './common.mjs';

/**
 * A local design studio: it serves a few interface concepts side by side and
 * records which one the user picks.
 *
 * Three things keep it contained. It binds to loopback only. Every request must
 * carry the session token minted at startup. And a concept's own markup renders
 * inside an iframe with an empty `sandbox` attribute, with its text escaped, so
 * a mockup can neither script the page that frames it nor reach the event API.
 */

/** How many concepts can be compared at once before the page stops being useful. */
const CONCEPT_COUNT = Object.freeze({min: 1, max: 8});

/** Accent color a concept falls back to when it supplies none, or an unusable one. */
const DEFAULT_ACCENT = '#4668ef';

/** The only accent format the preview stylesheet can interpolate safely. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** A concept id has to be safe in a URL path and in an HTML attribute. */
const CONCEPT_ID = /^[a-zA-Z0-9_-]{1,40}$/;

/** Event kinds the API accepts. Anything else is rejected rather than stored. */
const EVENT_KINDS = Object.freeze(['selection', 'feedback']);

/** Bounds on what a browser may post, so the log cannot be filled from the page. */
const EVENT_LIMITS = Object.freeze({body: 16000, comment: 4000});

/** Headers every response carries. */
const BASE_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
});

/** The chooser may run its own inline script; it may not load anything remote. */
const PAGE_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'";

/** A concept preview gets no script at all, which is what makes a mockup safe to render. */
const PREVIEW_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'";

/** Shown when the caller supplies no concept file of their own. */
const FALLBACK_CONCEPTS = Object.freeze([
  {id: 'minimal', title: 'Clareza operacional', description: 'Minimalista, legível e funcional', mode: 'light', accent: '#4462ee'},
  {id: 'editorial', title: 'Direção editorial', description: 'Hierarquia marcante e contraste', mode: 'dark', accent: '#a58eff'},
  {id: 'analytical', title: 'Densidade inteligente', description: 'Dados visíveis sem poluição', mode: 'light', accent: '#087f83', radius: 'sharp'},
]);

/**
 * Renders one concept as a standalone document.
 *
 * A concept carrying its own `html` is rendered as given, which is safe only
 * because the caller serves this under {@link PREVIEW_CSP} inside a sandboxed
 * iframe. Everything else is generated from a small set of knobs, with the text
 * escaped and the accent validated.
 *
 * @param {object} concept One entry from the concept file.
 * @returns {string} A complete HTML document.
 */
function renderConceptPreview(concept) {
  if(concept.html) return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${concept.css||''}</style></head><body>${concept.html}</body></html>`;
  const title=escapeHtml(concept.title||'Nova experiência'),caption=escapeHtml(concept.description||'Prévia de conceito');
  // Validate the value the concept actually supplied, not the defaulted one:
  // testing String(accent || DEFAULT) and then using `accent` let a concept with
  // no accent through as the literal string "undefined".
  const accent = HEX_COLOR.test(concept.accent ?? '') ? concept.accent : DEFAULT_ACCENT;
  const dark=concept.mode==='dark';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  :root{font-family:Inter,ui-sans-serif,system-ui;background:${dark?'#111827':'#f5f7fa'};color:${dark?'#f1f5f9':'#172033'};--accent:${accent}}
  *{box-sizing:border-box}body{margin:0;min-height:100vh}main{max-width:1080px;margin:auto;padding:28px}header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:32px}small{letter-spacing:.09em;text-transform:uppercase;font-size:11px;opacity:.64}h1{font-size:clamp(28px,5vw,48px);letter-spacing:-.065em;line-height:1.07;margin:16px 0 12px}p{max-width:650px;line-height:1.6;opacity:.72}.brand{font-weight:800;letter-spacing:-.05em;font-size:20px}.cta{background:var(--accent);color:white;border:0;border-radius:10px;padding:11px 16px;font:inherit;font-weight:650;cursor:default}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:35px}.card{background:${dark?'#1e293b':'white'};border:1px solid ${dark?'#344258':'#e6e9f0'};border-radius:${concept.radius==='sharp'?'5px':'17px'};padding:22px;min-height:145px}.metric{font-size:29px;font-weight:750;letter-spacing:-.04em;margin:12px 0 6px}.graphic{height:130px;margin-top:16px;border-radius:12px;background:linear-gradient(120deg,transparent 10%,${accent}44,transparent 86%);display:grid;place-items:center}.bars{display:flex;align-items:end;gap:10px;height:75px}.bars span{width:25px;background:var(--accent);opacity:.4;border-radius:4px 4px 0 0}.bars span:nth-child(2){height:54px;opacity:.7}.bars span:nth-child(3){height:67px}.bars span:nth-child(4){height:42px}.bars span:nth-child(5){height:74px}.bars span:first-child{height:35px}@media(max-width:690px){.grid{grid-template-columns:1fr}main{padding:18px}header{margin-bottom:24px}}</style></head><body><main><header><div class="brand">${escapeHtml(concept.brand||'Studio')}</div><button class="cta">Explorar →</button></header><small>Conceito de interface</small><h1>${title}</h1><p>${caption}</p><section class="grid"><article class="card"><small>Atividade</small><div class="metric">84.2k</div><p>Visão geral do período</p></article><article class="card"><small>Performance</small><div class="metric">+18.6%</div><p>Comparado ao período anterior</p></article><article class="card"><small>Tendência</small><div class="graphic"><div class="bars"><span></span><span></span><span></span><span></span><span></span></div></div></article></section></main></body></html>`;
}

/**
 * Renders the chooser: every concept in a sandboxed frame, with a feedback box.
 *
 * @param {object[]} concepts Concepts to show.
 * @param {string} session Token every request must carry.
 * @returns {string} A complete HTML document.
 */
export function makeStudioPage(concepts, session) {
  const cards=concepts.map(c=>`<article class="concept"><iframe title="${escapeHtml(c.title)}" sandbox="" loading="lazy" src="/preview/${encodeURIComponent(c.id)}?session=${session}"></iframe><div class="desc"><div><strong>${escapeHtml(c.title)}</strong><p>${escapeHtml(c.description||'')}</p></div><button data-choice="${escapeHtml(c.id)}">Selecionar</button></div></article>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zanker Design Studio</title><style>
  :root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#10131b;color:#f5f7fb}*{box-sizing:border-box}body{margin:0}.app{padding:24px;max-width:1540px;margin:auto}header{display:flex;align-items:center;gap:16px;justify-content:space-between;margin-bottom:20px}h1{font-size:20px;margin:0;letter-spacing:-.04em}.eyebrow{color:#8ea1be;font-size:11px;text-transform:uppercase;letter-spacing:.13em}.pill{border:1px solid #324057;color:#9abcf7;border-radius:100px;padding:7px 11px;font-size:11px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:18px}.concept{border:1px solid #2b3241;border-radius:16px;overflow:hidden;background:#1b202b}.concept iframe{width:100%;height:420px;background:white;border:0;display:block}.desc{padding:15px;display:flex;justify-content:space-between;gap:12px;align-items:start}p{margin:7px 0;color:#adb8c9;font-size:13px;line-height:1.55}button{border:0;border-radius:9px;background:#597ee9;color:white;padding:9px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}button:hover{background:#7395f9}.feedback{padding:18px;background:#1b202b;border:1px solid #2b3241;border-radius:14px;margin-top:20px;max-width:850px}textarea{width:100%;height:95px;background:#10151d;color:white;border:1px solid #3a4459;border-radius:10px;padding:11px;font:inherit;resize:vertical;margin:8px 0}#status{font-size:12px;color:#83c1ab;margin-left:10px}.help{color:#95a0ae;font-size:12px;margin-top:16px}@media(max-width:500px){.app{padding:12px}.grid{grid-template-columns:1fr}}</style></head><body><main class="app"><header><div><div class="eyebrow">Zanker · Visual Brainstorm</div><h1>Design Studio</h1></div><span class="pill">Preview local</span></header><div class="grid">${cards}</div><div class="feedback"><strong>Feedback sobre as propostas</strong><p>Selecione uma alternativa ou descreva ajustes. Os eventos são salvos localmente para o agente consultar.</p><textarea id="feedback" placeholder="Ex.: Gostei da composição B, mas quero uma tipografia mais editorial e menos bordas..."></textarea><button id="submit">Enviar feedback</button><span id="status" role="status"></span></div><p class="help">Prévia isolada; não modifica o código do projeto. Para recarregar novas alternativas, atualize a página.</p></main><script>
  const session=${JSON.stringify(session)};let chosen=null;const status=document.getElementById('status');
  async function send(kind,payload){const res=await fetch('/api/events?session='+session,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind,payload,at:new Date().toISOString()})});if(!res.ok)throw Error('Falha ao gravar');status.textContent='Feedback registrado localmente';}
  document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',async()=>{chosen=b.dataset.choice;try{await send('selection',{id:chosen});document.querySelectorAll('[data-choice]').forEach(x=>x.textContent=x===b?'Selecionado ✓':'Selecionar')}catch(e){status.textContent=e.message}}));
  document.getElementById('submit').addEventListener('click',async()=>{const comment=document.getElementById('feedback').value.trim();if(!comment)return;try{await send('feedback',{choice:chosen,comment});document.getElementById('feedback').value=''}catch(e){status.textContent=e.message}});
  </script></body></html>`;
}

/**
 * Loads and validates the concepts to show.
 *
 * @param {string} project Absolute path of the project.
 * @param {string} [conceptFile] Path inside the project. Falls back to a built in set.
 * @returns {object[]} Between one and eight concepts with unique, safe ids.
 * @throws {Error} When the file holds the wrong number of concepts, or an id is
 *   unusable in a URL or duplicated.
 */
function loadConcepts(project, conceptFile) {
  const input = conceptFile ? readJsonFile(resolveWithin(project, conceptFile)) : {concepts: FALLBACK_CONCEPTS};
  const concepts = input.concepts;
  if (!Array.isArray(concepts) || concepts.length < CONCEPT_COUNT.min || concepts.length > CONCEPT_COUNT.max) {
    throw new Error(`Concept file must contain ${CONCEPT_COUNT.min}-${CONCEPT_COUNT.max} concepts`);
  }
  const seen = new Set();
  for (const concept of concepts) {
    if (!CONCEPT_ID.test(concept.id || '') || seen.has(concept.id)) {
      throw new Error('Each concept needs unique id [a-zA-Z0-9_-]{1,40}');
    }
    seen.add(concept.id);
  }
  return concepts;
}

/**
 * Reads a request body, refusing one too large to be a legitimate event.
 *
 * @param {import('node:http').IncomingMessage} request
 * @returns {Promise<string|null>} The body, or null when it exceeded the limit.
 */
async function readRequestBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > EVENT_LIMITS.body) return null;
  }
  return body;
}

/**
 * Validates one posted event against the concepts actually on the page.
 *
 * @param {object} event Parsed request body.
 * @param {object[]} concepts Concepts currently served.
 * @returns {{kind: string, payload: object}} The event, once trusted.
 * @throws {Error} When the kind is unknown, the selection names no real concept,
 *   or the comment is not a string of acceptable length.
 */
function validateEvent(event, concepts) {
  if (!EVENT_KINDS.includes(event.kind)) throw new Error('Invalid event');
  const payload = event.payload || {};
  if (event.kind === 'selection' && !concepts.some((concept) => concept.id === payload.id)) {
    throw new Error('Invalid selection');
  }
  if (event.kind === 'feedback' && (typeof payload.comment !== 'string' || payload.comment.length > EVENT_LIMITS.comment)) {
    throw new Error('Invalid feedback');
  }
  return {kind: event.kind, payload};
}

/**
 * @typedef {object} StudioRequestContext
 * @property {import('node:http').IncomingMessage} request
 * @property {import('node:http').ServerResponse} response
 * @property {URL} url Parsed request URL.
 * @property {object[]} concepts Concepts being served.
 * @property {string} session Token minted at startup.
 * @property {string} logPath Where accepted events are appended.
 */

/**
 * The three things this server does, as data.
 *
 * A route array rather than a chain of ifs: each entry states its own method and
 * path, and an unmatched request falls through to one 404 instead of to whatever
 * the last if happened to leave behind.
 *
 * @type {readonly {method: string, matches: (pathname: string) => boolean, handle: (context: StudioRequestContext) => void|Promise<void>}[]}
 */
const ROUTES = Object.freeze([
  {
    method: 'GET',
    matches: (pathname) => pathname === '/',
    handle: ({response, concepts, session}) => {
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': PAGE_CSP});
      response.end(makeStudioPage(concepts, session));
    },
  },
  {
    method: 'GET',
    matches: (pathname) => pathname.startsWith('/preview/'),
    handle: ({response, url, concepts}) => {
      const id = decodeURIComponent(url.pathname.slice('/preview/'.length));
      const concept = concepts.find((candidate) => candidate.id === id);
      if (!concept) {
        response.writeHead(404);
        response.end('Unknown concept');
        return;
      }
      response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': PREVIEW_CSP});
      response.end(renderConceptPreview(concept));
    },
  },
  {
    method: 'POST',
    matches: (pathname) => pathname === '/api/events',
    handle: async ({request, response, concepts, logPath}) => {
      const body = await readRequestBody(request);
      if (body === null) {
        response.writeHead(413);
        response.end('Too large');
        return;
      }
      try {
        const event = validateEvent(JSON.parse(body), concepts);
        fs.appendFileSync(logPath, JSON.stringify({...event, at: new Date().toISOString()}) + '\n');
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end('{"saved":true}');
      } catch (error) {
        response.writeHead(400);
        response.end(String(error.message));
      }
    },
  },
]);

/**
 * Starts the studio on a loopback port.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} [options.concepts] Concept file inside the project.
 * @param {number} [options.port] Port to bind, 0 for any free one.
 * @param {string} [options.host] Bind address. Loopback only.
 * @returns {Promise<{server: import('node:http').Server, url: string, log: string, concepts: number}>}
 * @throws {Error} When the host is not loopback or the concept file is unusable.
 */
export async function startStudio({project, concepts: conceptFile, port = 0, host = '127.0.0.1'}) {
  assertLoopback(host);
  const concepts = loadConcepts(project, conceptFile);
  const session = createSessionToken();

  const studioDirectory = path.join(project, '.zanker', 'studio');
  fs.mkdirSync(studioDirectory, {recursive: true});
  const logPath = path.join(studioDirectory, 'events-' + new Date().toISOString().replace(/[:.]/g, '-') + '.jsonl');

  const server = http.createServer(async (request, response) => {
    // node always sets url on an incoming server request, so there is nothing to default.
    const url = new URL(request.url, `http://${host}`);
    for (const [header, value] of Object.entries(BASE_HEADERS)) response.setHeader(header, value);

    if (url.searchParams.get('session') !== session) {
      response.writeHead(403);
      response.end('Access denied');
      return;
    }

    const route = ROUTES.find((candidate) => candidate.method === request.method && candidate.matches(url.pathname));
    if (!route) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    await route.handle({request, response, url, concepts, session, logPath});
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(port), host, resolve);
  });
  return {server, url: `http://${host}:${server.address().port}/?session=${session}`, log: logPath, concepts: concepts.length};
}
