import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {pathExists, resolveWithin, toPosixPath, toSafeSlug, writeJsonFile} from './common.mjs';
import {inspectProject} from './inspect.mjs';

/**
 * Renders one component from the user's repository, on its own, against
 * scenarios that include the states a happy path never reaches.
 *
 * Preparing a sandbox only writes files. Running one can execute the project's
 * code, which is a separate decision the user has to make: React needs
 * `allowExecution`, and so does HTML that carries a script. That split is the
 * whole safety model here, so it is enforced in one place.
 *
 * A sandbox is not proof of production parity, and the metadata says so.
 */

/** Frameworks with an isolated adapter. Anything else uses the project dev server. */
const SUPPORTED_FRAMEWORKS = Object.freeze(['react', 'html']);

/** Bounds on a scenario file, so one fixture cannot make the shell unusable. */
const SCENARIO_LIMITS = Object.freeze({max: 30, id: /^[a-z0-9_-]{1,48}$/});

/** How many project stylesheets are pulled in when none are named. */
const DEFAULT_STYLE_COUNT = 3;

/** Marks a prepared HTML sandbox whose source carries a script. */
const EXECUTABLE_MARKER = 'executable-html.marker';

/** The only address a preview server binds to. */
const LOOPBACK_HOST = '127.0.0.1';

/** Files the HTML preview server is willing to serve. */
const SERVABLE_FILES = Object.freeze(['index.html', 'component.html', 'sandbox.meta.json']);

/** States a component should be shown in when the caller names no scenarios. */
const DEFAULT_SCENARIOS = Object.freeze([
  {id: 'default', label: 'Default', props: {}},
  {id: 'loading', label: 'Loading', props: {loading: true, isLoading: true}},
  {id: 'empty', label: 'Empty', props: {items: [], data: []}},
  {id: 'error', label: 'Error', props: {error: 'Unable to load data'}},
]);

/** What a sandbox cannot prove, carried in every manifest it writes. */
const SANDBOX_LIMITS = Object.freeze([
  'A sandbox is not proof of production parity',
  'Mocks and wrappers must reproduce actual context',
  'Do not expose secrets or production APIs in fixture data',
  'Only the project owner should authorize execution of repository code',
]);

/**
 * Only minimal process variables reach the optional Vite child. This is not a
 * hardened boundary: authorized project code can still read anything the user's
 * OS account can. Use a container or a VM for a repository you do not trust.
 */
const FORWARDED_ENVIRONMENT = Object.freeze([
  'PATH', 'Path', 'PATHEXT', 'HOME', 'USERPROFILE', 'SYSTEMROOT',
  'WINDIR', 'TMPDIR', 'TMP', 'TEMP', 'LANG', 'LC_ALL',
]);

/**
 * @param {string} fromFile File the import will be written into.
 * @param {string} toFile File being imported.
 * @returns {string} A relative specifier a bundler will accept.
 */
function relativeImport(fromFile, toFile) {
  const relative = toPosixPath(path.relative(path.dirname(fromFile), toFile));
  return relative.startsWith('.') ? relative : './' + relative;
}

/**
 * @param {unknown} data Parsed scenario file.
 * @returns {object[]} The scenarios, once trusted.
 * @throws {Error} When the file is not a usable list of distinct named scenarios.
 */
function validateScenarios(data) {
  if (!Array.isArray(data) || !data.length || data.length > SCENARIO_LIMITS.max) {
    throw new Error(`Scenarios must be a nonempty array up to ${SCENARIO_LIMITS.max}`);
  }
  const seen = new Set();
  for (const scenario of data) {
    const validId = typeof scenario.id === 'string' && SCENARIO_LIMITS.id.test(scenario.id) && !seen.has(scenario.id);
    const validProps = typeof scenario.props === 'object' && scenario.props && !Array.isArray(scenario.props);
    if (!validId || !validProps) throw new Error('Invalid scenario');
    seen.add(scenario.id);
  }
  return data;
}

/**
 * @typedef {object} AdapterContext
 * @property {string} projectRoot Absolute project root.
 * @property {string} outputDirectory Where the sandbox is being written.
 * @property {string} sourceFile Absolute path of the component or document.
 * @property {string} exportName Named export to render, or `default`.
 * @property {string[]} stylesheets Project-relative stylesheets to pull in.
 * @property {string|null} wrapperFile Absolute path of a wrapper component.
 */

/**
 * One adapter per framework with an isolated host.
 *
 * `requires` states what the project must already have, and is checked before
 * anything is written, so an unsupported project fails with a reason instead of
 * with a half built sandbox.
 *
 * @type {readonly {name: string, detects: (sourceFile: string, frameworks: string[]) => boolean, requires: (context: {frameworks: string[], sourceFile: string}) => string|null, emit: (context: AdapterContext) => void}[]}
 */
const FRAMEWORK_ADAPTERS = Object.freeze([
  {
    name: 'html',
    detects: (sourceFile) => /\.html?$/.test(sourceFile),
    requires: ({sourceFile}) => (/\.html?$/.test(sourceFile) ? null : 'HTML sandbox requires an HTML document'),
    emit: ({outputDirectory, sourceFile}) => {
      const markup = fs.readFileSync(sourceFile, 'utf8');
      fs.writeFileSync(path.join(outputDirectory, 'component.html'), markup);
      // Running this later needs explicit consent, so record now that it would execute something.
      if (/<script\b/i.test(markup)) {
        fs.writeFileSync(
          path.join(outputDirectory, EXECUTABLE_MARKER),
          'Original HTML includes JavaScript; requires explicit execution approval.\n',
        );
      }
    },
  },
  {
    name: 'react',
    detects: (sourceFile, frameworks) => frameworks.includes('react'),
    requires: ({frameworks, sourceFile}) => {
      if (!frameworks.includes('react')) return 'React mode requires react installed in the target project';
      if (!frameworks.includes('vite')) {
        return 'Isolated React adapter requires Vite installed in the target project; Next/Angular: use native dev preview and audit until an adapter is available.';
      }
      if (!/\.(jsx|tsx|js|ts)$/.test(sourceFile)) return 'React entry must be .tsx/.jsx/.ts/.js';
      return null;
    },
    emit: ({projectRoot, outputDirectory, sourceFile, exportName, stylesheets, wrapperFile}) => {
      const entryFile = path.join(outputDirectory, 'main.jsx');
      const stylesheetImports = stylesheets
        .map((sheet) => `import ${JSON.stringify(relativeImport(entryFile, resolveWithin(projectRoot, sheet)))};`)
        .join('\n');
      const componentImport = relativeImport(entryFile, sourceFile);
      let wrapperImports = '';
      let wrapExpr = 'rendered';
      if (wrapperFile) {
        wrapperImports = `import * as WrapperModule from ${JSON.stringify(relativeImport(entryFile, wrapperFile))};\n`
          + `const Wrapper = WrapperModule.default || WrapperModule.Wrapper;`;
        wrapExpr = 'React.createElement(Wrapper,{scenario:chosen},rendered)';
      }
      const out = outputDirectory;
      const root = projectRoot;
      fs.writeFileSync(entryFile, `import * as React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport * as ComponentModule from ${JSON.stringify(componentImport)};\nimport scenarios from './scenarios.json';\n${wrapperImports}\n${stylesheetImports}\nconst Component=${exportName==='default'?'ComponentModule.default':`ComponentModule[${JSON.stringify(exportName)}]`};\nif(!Component)throw Error('Missing component export ${exportName}');\nconst params=new URLSearchParams(location.search);\nconst theme=params.get('theme')||'light';\ndocument.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');\nconst id=params.get('scenario')||'default';\nconst chosen=scenarios.find(s=>s.id===id)||scenarios[0];\nconst rendered=React.createElement(Component,chosen.props);\ncreateRoot(document.getElementById('root')).render(${wrapExpr});\n`);
      fs.writeFileSync(path.join(out, 'component.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Component preview</title></head><body style="margin:0"><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>`);
      fs.writeFileSync(path.join(out, 'vite.config.mjs'), `import {defineConfig} from 'vite';\nexport default defineConfig({root:${JSON.stringify(out)},esbuild:{jsx:'automatic'},server:{host:'127.0.0.1',fs:{allow:[${JSON.stringify(root)}]},strictPort:false},appType:'mpa'});\n`);
    },
  },
]);

/**
 * Picks the adapter for a source file, or reports why none fits.
 *
 * @param {string} requested Framework asked for, or `auto`.
 * @param {string} sourceFile Absolute path of the entry.
 * @param {string[]} frameworks Frameworks detected in the project.
 * @returns {object} The chosen adapter.
 * @throws {Error} When no adapter handles the request, or the project lacks what one needs.
 */
function selectAdapter(requested, sourceFile, frameworks) {
  const name = requested === 'auto'
    ? FRAMEWORK_ADAPTERS.find((adapter) => adapter.detects(sourceFile, frameworks))?.name ?? 'unsupported'
    : requested;
  const adapter = FRAMEWORK_ADAPTERS.find((candidate) => candidate.name === name);
  if (!adapter || !SUPPORTED_FRAMEWORKS.includes(name)) {
    throw new Error(`Framework ${name} has no isolated adapter yet. Use the project's dev server and 'zanker audit --url ...' or extend adapters/.`);
  }
  const problem = adapter.requires({frameworks, sourceFile});
  if (problem) throw new Error(problem);
  return adapter;
}

/**
 * Writes an isolated host for one component or document.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} options.entry Component or document, inside the project.
 * @param {string} [options.exportName] Named export to render.
 * @param {string} [options.styles] Comma separated stylesheets to pull in.
 * @param {string} [options.wrapper] Component to wrap the subject in.
 * @param {string} [options.scenarios] Scenario file inside the project.
 * @param {string} [options.id] Name for the sandbox directory.
 * @param {string} [options.framework] Force an adapter instead of detecting one.
 * @returns {object} The sandbox manifest, also written to disk.
 * @throws {Error} When the entry is missing, or no adapter fits the project.
 */
export function prepareSandbox({project, entry, exportName = 'default', styles = '', wrapper = '', scenarios = '', id = '', framework = 'auto'}) {
  const projectRoot = path.resolve(project);
  const manifest = inspectProject(projectRoot, false);
  const sourceFile = resolveWithin(projectRoot, entry);
  if (!pathExists(sourceFile) || !fs.statSync(sourceFile).isFile()) throw new Error(`Source entry not found: ${entry}`);

  const adapter = selectAdapter(framework, sourceFile, manifest.frameworks);

  const name = toSafeSlug(id || path.basename(entry, path.extname(entry)));
  const outputDirectory = resolveWithin(projectRoot, path.join('.zanker', 'sandboxes', name));
  fs.mkdirSync(outputDirectory, {recursive: true});

  const scenarioList = scenarios
    ? validateScenarios(JSON.parse(fs.readFileSync(resolveWithin(projectRoot, scenarios), 'utf8')))
    : DEFAULT_SCENARIOS;
  writeJsonFile(path.join(outputDirectory, 'scenarios.json'), scenarioList);

  const stylesheets = styles
    ? styles.split(',').map((sheet) => sheet.trim()).filter(Boolean)
    : manifest.globalStyles.filter((sheet) => sheet.endsWith('.css')).slice(0, DEFAULT_STYLE_COUNT);

  adapter.emit({
    projectRoot,
    outputDirectory,
    sourceFile,
    exportName,
    stylesheets,
    wrapperFile: wrapper ? resolveWithin(projectRoot, wrapper) : null,
  });

  const meta = {
    createdAt: new Date().toISOString(),
    project: projectRoot,
    entry: path.relative(projectRoot, sourceFile),
    framework: adapter.name,
    exportName,
    styles: stylesheets,
    wrapper: wrapper || null,
    scenarios: scenarioList.map((scenario) => scenario.id),
    sandboxDir: outputDirectory,
    limits: SANDBOX_LIMITS,
  };
  writeJsonFile(path.join(outputDirectory, 'sandbox.meta.json'), meta);

  const data = scenarioList;
  const fw = adapter.name;
  const source = sourceFile;
  fs.writeFileSync(path.join(outputDirectory, 'index.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Zanker Component Sandbox</title><style>
  *{box-sizing:border-box}body{margin:0;background:#0e141d;color:#e7edf4;font:14px system-ui,sans-serif}.top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:14px 20px;border-bottom:1px solid #2b3543}.logo{font-weight:800;letter-spacing:-.04em}.controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}select,button{border:1px solid #344259;border-radius:8px;background:#1b2736;color:#f1f5f9;padding:8px;font:inherit;cursor:pointer}.stage{display:grid;place-items:center;min-height:calc(100vh - 75px);padding:24px}.device{width:100%;height:73vh;background:white;border:1px solid #334155;border-radius:11px;overflow:hidden;transition:width .15s ease}.device iframe{border:0;width:100%;height:100%;background:white}.info{font-size:11px;color:#97a8bf}</style></head><body><header class="top"><span class="logo">Zanker · Stack Sandbox</span><div class="controls"><select id="scenario">${data.map(s=>`<option value="${s.id}">${s.label||s.id}</option>`).join('')}</select><button data-width="375">Mobile</button><button data-width="768">Tablet</button><button data-width="100%">Desktop</button><label>Theme <select id="theme"><option value="light">Light</option><option value="dark">Dark</option></select></label></div><span class="info">${fw.toUpperCase()} · ${path.basename(source)}</span></header><section class="stage"><div class="device" id="device"><iframe title="Component sandbox" id="frame" src="/component.html?scenario=default"></iframe></div></section><script>
  const frame=document.getElementById('frame'),device=document.getElementById('device'),s=document.getElementById('scenario'),theme=document.getElementById('theme');
  function update(){frame.src='/component.html?scenario='+encodeURIComponent(s.value)+'&theme='+theme.value} s.addEventListener('change',update);theme.addEventListener('change',update);document.querySelectorAll('[data-width]').forEach(b=>b.addEventListener('click',()=>{device.style.width=b.dataset.width==='100%'?'100%':b.dataset.width+'px'}));
  </script></body></html>`);
  return meta;
}

/**
 * Serves a prepared HTML sandbox from loopback.
 *
 * Only the three files the shell needs are servable, by basename, so a crafted
 * path cannot read the rest of the project through this server.
 *
 * The bind address is a constant rather than an option, because no caller ever
 * needed to choose one and a constant cannot be given a wrong value.
 *
 * @param {object} meta A manifest from {@link prepareSandbox}.
 * @param {number} port Port to bind, 0 for any free one.
 * @returns {Promise<{server: import('node:http').Server, url: string}>}
 */
function serveHTML(meta, port) {
  const host = LOOPBACK_HOST;
  const base = meta.sandboxDir;
  const server = http.createServer((request, response) => {
    const {pathname} = new URL(request.url, `http://${host}`);
    const target = pathname === '/' ? path.join(base, 'index.html') : resolveWithin(base, '.' + decodeURIComponent(pathname));
    if (!SERVABLE_FILES.includes(path.basename(target)) || !pathExists(target)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': target.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(fs.readFileSync(target));
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(port), host, () => resolve({server, url: `http://${host}:${server.address().port}/`}));
  });
}

/**
 * Serves a prepared sandbox, executing project code only with explicit consent.
 *
 * @param {object} meta A manifest from {@link prepareSandbox}.
 * @param {object} [options]
 * @param {number} [options.port] Port for the Vite dev server.
 * @param {boolean} [options.allowExecution] Consent to run the project's own code.
 * @param {(command: string, args: string[], options: object) => object} [options.spawnProcess]
 *   Seam for tests. Defaults to spawning a real child process.
 * @returns {Promise<object>} A running server, or the spawned child and its URL.
 * @throws {Error} Without consent, or when Vite is not installed in the project.
 */
export async function runSandbox(meta, {port = 5174, allowExecution = false, spawnProcess = spawn} = {}) {
  if (meta.framework === 'html') {
    if (pathExists(path.join(meta.sandboxDir, EXECUTABLE_MARKER)) && !allowExecution) {
      throw new Error('HTML includes executable scripts; pass --allow-execution only after review.');
    }
    return serveHTML(meta, port);
  }

  if (!allowExecution) {
    throw new Error('Running target project code requires explicit --allow-execution. Inspect the project first.');
  }
  const viteBinary = path.join(meta.project, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!pathExists(viteBinary)) {
    throw new Error('Vite is not installed in project/node_modules. Install project dependencies using your normal trusted workflow first.');
  }

  const childEnvironment = Object.fromEntries(
    FORWARDED_ENVIRONMENT
      .filter((name) => Object.prototype.hasOwnProperty.call(process.env, name))
      .map((name) => [name, process.env[name]]),
  );
  childEnvironment.BROWSER = 'none';
  childEnvironment.ZANKER_SANDBOX = '1';

  const child = spawnProcess(
    process.execPath,
    [viteBinary, '--config', path.join(meta.sandboxDir, 'vite.config.mjs'), '--host', '127.0.0.1', '--port', String(port)],
    {cwd: meta.project, stdio: 'inherit', env: childEnvironment},
  );
  return {child, url: `http://${LOOPBACK_HOST}:${port}/`, notes: 'If Vite selects another port, use the URL reported by Vite.'};
}
