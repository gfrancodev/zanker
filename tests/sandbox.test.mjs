import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareSandbox, runSandbox} from '../src/sandbox.mjs';

// Preparing a sandbox only writes files. Running one can execute the project's
// own code, and that split is the safety model, so both sides are covered here.

function makeProject({react = true, vite = true, viteInstalled = false} = {}) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-sandbox-'));
  const write = (relative, content) => {
    const target = path.join(project, relative);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, content);
  };
  write('package.json', JSON.stringify({
    name: 'app',
    dependencies: react ? {react: '18.3.1'} : {},
    devDependencies: vite ? {vite: '5.4.0'} : {},
  }));
  write('src/index.css', ':root{--a:1}');
  write('src/theme.css', '.t{}');
  write('src/Card.tsx', 'export default function Card(){}');
  write('src/Wrapper.tsx', 'export default function Wrapper(){}');
  write('page.html', '<!doctype html><p>plain</p>');
  write('script.html', '<!doctype html><script>alert(1)</script>');
  if (viteInstalled) write('node_modules/vite/bin/vite.js', '// pretend');
  return project;
}

async function withProject(options, body) {
  const project = makeProject(options);
  try {
    return await body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

const read = (meta, name) => fs.readFileSync(path.join(meta.sandboxDir, name), 'utf8');

test('an HTML document is copied, and the manifest says what a sandbox cannot prove', async () => {
  await withProject({}, (project) => {
    const meta = prepareSandbox({project, entry: 'page.html'});
    assert.equal(meta.framework, 'html');
    assert.equal(meta.entry, 'page.html');
    assert.equal(read(meta, 'component.html'), '<!doctype html><p>plain</p>');
    assert.deepEqual(meta.scenarios, ['default', 'loading', 'empty', 'error']);
    assert.ok(meta.limits.includes('A sandbox is not proof of production parity'));
    assert.equal(fs.existsSync(path.join(meta.sandboxDir, 'executable-html.marker')), false);
    assert.match(read(meta, 'index.html'), /HTML · page\.html/);
  });
});

test('HTML carrying a script is marked, so running it later needs consent', async () => {
  await withProject({}, (project) => {
    const meta = prepareSandbox({project, entry: 'script.html', id: 'scripted'});
    assert.equal(fs.existsSync(path.join(meta.sandboxDir, 'executable-html.marker')), true);
  });
});

test('a React component gets an entry, a host page and a Vite config', async () => {
  await withProject({}, (project) => {
    const meta = prepareSandbox({project, entry: 'src/Card.tsx', id: 'card'});
    assert.equal(meta.framework, 'react');
    assert.deepEqual(meta.styles, ['src/index.css'], 'global stylesheets are pulled in by default');
    assert.equal(meta.wrapper, null);
    const entry = read(meta, 'main.jsx');
    assert.match(entry, /import \* as ComponentModule from "\.\.\/\.\.\/\.\.\/src\/Card\.tsx"/);
    assert.match(entry, /const Component=ComponentModule\.default;/);
    assert.match(entry, /import "\.\.\/\.\.\/\.\.\/src\/index\.css";/);
    assert.doesNotMatch(entry, /Wrapper/);
    assert.match(read(meta, 'component.html'), /<script type="module" src="\/main\.jsx">/);
    assert.match(read(meta, 'vite.config.mjs'), /esbuild:\{jsx:'automatic'\}/);
  });
});

test('a named export, a wrapper and explicit stylesheets all reach the entry', async () => {
  await withProject({}, (project) => {
    const meta = prepareSandbox({
      project, entry: 'src/Card.tsx', id: 'full', exportName: 'Card',
      wrapper: 'src/Wrapper.tsx', styles: 'src/index.css, src/theme.css',
    });
    assert.equal(meta.exportName, 'Card');
    assert.equal(meta.wrapper, 'src/Wrapper.tsx');
    assert.deepEqual(meta.styles, ['src/index.css', 'src/theme.css']);
    const entry = read(meta, 'main.jsx');
    assert.match(entry, /const Component=ComponentModule\["Card"\];/);
    assert.match(entry, /const Wrapper = WrapperModule\.default \|\| WrapperModule\.Wrapper;/);
    assert.match(entry, /React\.createElement\(Wrapper,\{scenario:chosen\},rendered\)/);
    assert.match(entry, /theme\.css/);
  });
});

test('a scenario file replaces the defaults, and a bad one is refused', async () => {
  await withProject({}, (project) => {
    fs.writeFileSync(path.join(project, 'ok.json'), JSON.stringify([{id: 'one', label: 'One', props: {a: 1}}, {id: 'two', props: {}}]));
    const meta = prepareSandbox({project, entry: 'page.html', id: 'scoped', scenarios: 'ok.json'});
    assert.deepEqual(meta.scenarios, ['one', 'two']);
    assert.match(read(meta, 'index.html'), /<option value="one">One<\/option>/);
    assert.match(read(meta, 'index.html'), /<option value="two">two<\/option>/, 'a scenario with no label uses its id');

    const refuse = (scenarios, pattern) => {
      fs.writeFileSync(path.join(project, 'bad.json'), JSON.stringify(scenarios));
      assert.throws(() => prepareSandbox({project, entry: 'page.html', id: 'bad', scenarios: 'bad.json'}), pattern);
    };
    refuse([], /nonempty array up to 30/);
    refuse({}, /nonempty array up to 30/);
    refuse(Array.from({length: 31}, (unused, index) => ({id: `s${index}`, props: {}})), /nonempty array up to 30/);
    refuse([{id: 'HAS CAPS', props: {}}], /Invalid scenario/);
    refuse([{id: 1, props: {}}], /Invalid scenario/);
    refuse([{id: 'a', props: {}}, {id: 'a', props: {}}], /Invalid scenario/);
    refuse([{id: 'a'}], /Invalid scenario/);
    refuse([{id: 'a', props: []}], /Invalid scenario/);
    refuse([{id: 'a', props: null}], /Invalid scenario/);
  });
});

test('an entry that is not a usable file is refused', async () => {
  await withProject({}, (project) => {
    assert.throws(() => prepareSandbox({project, entry: 'absent.tsx'}), /Source entry not found: absent\.tsx/);
    assert.throws(() => prepareSandbox({project, entry: 'src'}), /Source entry not found: src/);
    assert.throws(() => prepareSandbox({project, entry: '../outside.tsx'}), /Path outside project/);
  });
});

test('a project with no adapter is told to use its own dev server', async () => {
  await withProject({}, (project) => {
    assert.throws(() => prepareSandbox({project, entry: 'page.html', framework: 'vue'}), /Framework vue has no isolated adapter yet/);
  });
  await withProject({react: false}, (project) => {
    assert.throws(() => prepareSandbox({project, entry: 'src/Card.tsx'}), /Framework unsupported has no isolated adapter yet/);
    assert.throws(() => prepareSandbox({project, entry: 'src/Card.tsx', framework: 'react'}), /requires react installed/);
  });
  await withProject({vite: false}, (project) => {
    assert.throws(() => prepareSandbox({project, entry: 'src/Card.tsx'}), /requires Vite installed/);
  });
  await withProject({}, (project) => {
    assert.throws(() => prepareSandbox({project, entry: 'src/index.css', framework: 'react'}), /React entry must be \.tsx\/\.jsx\/\.ts\/\.js/);
    assert.throws(() => prepareSandbox({project, entry: 'src/Card.tsx', framework: 'html'}), /HTML sandbox requires an HTML document/);
  });
});

test('the HTML preview serves three files and nothing else', async () => {
  await withProject({}, async (project) => {
    const meta = prepareSandbox({project, entry: 'page.html'});
    const {server, url} = await runSandbox(meta, {port: 0});
    const origin = url.replace(/\/$/, '');
    try {
      const index = await fetch(`${origin}/`);
      assert.equal(index.status, 200);
      assert.equal(index.headers.get('x-content-type-options'), 'nosniff');
      assert.match(index.headers.get('content-type'), /text\/html/);

      assert.equal((await fetch(`${origin}/component.html`)).status, 200);
      const metaResponse = await fetch(`${origin}/sandbox.meta.json`);
      assert.match(metaResponse.headers.get('content-type'), /application\/json/);

      assert.equal((await fetch(`${origin}/scenarios.json`)).status, 404, 'a prepared file is not automatically servable');
      assert.equal((await fetch(`${origin}/absent.html`)).status, 404);
      assert.equal((await fetch(`${origin}/../../package.json`)).status, 404);
    } finally {
      server.close();
    }
  });
});

test('running project code always needs explicit consent', async () => {
  await withProject({}, async (project) => {
    const scripted = prepareSandbox({project, entry: 'script.html', id: 'scripted'});
    await assert.rejects(() => runSandbox(scripted, {port: 0}), /pass --allow-execution only after review/);
    const served = await runSandbox(scripted, {port: 0, allowExecution: true});
    served.server.close();

    const react = prepareSandbox({project, entry: 'src/Card.tsx', id: 'card'});
    await assert.rejects(() => runSandbox(react), /requires explicit --allow-execution/);
    await assert.rejects(() => runSandbox(react, {allowExecution: true}), /Vite is not installed in project\/node_modules/);
  });
});

test('the Vite child is spawned with a minimal environment', async () => {
  await withProject({viteInstalled: true}, async (project) => {
    const meta = prepareSandbox({project, entry: 'src/Card.tsx', id: 'card'});
    const calls = [];
    const result = await runSandbox(meta, {
      allowExecution: true,
      spawnProcess: (command, args, options) => {
        calls.push({command, args, options});
        return {pid: 1234};
      },
    });

    assert.equal(result.url, 'http://127.0.0.1:5174/');
    assert.match(result.notes, /If Vite selects another port/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].command, process.execPath);
    assert.deepEqual(calls[0].args.slice(1), [
      '--config', path.join(meta.sandboxDir, 'vite.config.mjs'), '--host', '127.0.0.1', '--port', '5174',
    ]);
    assert.equal(calls[0].options.cwd, path.resolve(project));
    assert.equal(calls[0].options.env.ZANKER_SANDBOX, '1');
    assert.equal(calls[0].options.env.BROWSER, 'none');
    assert.equal('npm_config_registry' in calls[0].options.env, false, 'only an allow list is forwarded');
    assert.equal(Object.keys(calls[0].options.env).some((name) => name.startsWith('AWS_')), false);
  });
});

test('without an injected spawner it really starts a child process', async () => {
  await withProject({viteInstalled: true}, async (project) => {
    // The stand in for vite exits immediately, so this proves the default
    // spawner runs without leaving a dev server behind.
    fs.writeFileSync(path.join(project, 'node_modules', 'vite', 'bin', 'vite.js'), 'process.exit(0);\n');
    const meta = prepareSandbox({project, entry: 'src/Card.tsx', id: 'card'});
    const {child, url} = await runSandbox(meta, {allowExecution: true, port: 5199});
    try {
      assert.ok(child.pid > 0, 'a real child process was started');
      assert.equal(url, 'http://127.0.0.1:5199/');
      await new Promise((resolve) => child.once('exit', resolve));
    } finally {
      child.kill();
    }
  });
});

test('an import specifier is always relative, even for a source beside the entry', async () => {
  await withProject({}, (project) => {
    // A bundler reads a bare "Inner.tsx" as a package name, so the "./" matters.
    const first = prepareSandbox({project, entry: 'src/Card.tsx', id: 'self'});
    fs.writeFileSync(path.join(first.sandboxDir, 'Inner.tsx'), 'export default function Inner(){}');
    const relativeEntry = path.relative(project, path.join(first.sandboxDir, 'Inner.tsx'));

    const meta = prepareSandbox({project, entry: relativeEntry, id: 'self'});
    assert.match(read(meta, 'main.jsx'), /import \* as ComponentModule from "\.\/Inner\.tsx"/);
  });
});
