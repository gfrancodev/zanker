import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspectProject} from '../src/inspect.mjs';

function makeProject(files = {}) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-inspect-'));
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(project, relative);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
  return project;
}

function withProject(files, body) {
  const project = makeProject(files);
  try {
    return body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

const packageJson = (dependencies = {}, devDependencies = {}, extra = {}) =>
  ({name: 'fixture-app', dependencies, devDependencies, ...extra});

test('a React and Vite project is recognised, with its styling and tokens', () => {
  withProject({
    'package.json': packageJson({react: '18.3.1'}, {vite: '5.4.0', tailwindcss: '3.4.0'}, {scripts: {dev: 'vite'}}),
    'src/index.css': ':root{--brand:#333;--space-2:8px}',
    'src/Button.module.css': '.b{color:red}',
    'src/ModalCard.tsx': 'export default function ModalCard(){}',
    'src/ThemeProvider.tsx': 'export default function ThemeProvider(){}',
    'src/unrelated.tsx': 'export default function Chart(){}',
  }, (project) => {
    const manifest = inspectProject(project, false);
    assert.deepEqual(manifest.frameworks, ['react', 'vite']);
    assert.deepEqual(manifest.styling.sort(), ['css-modules', 'tailwind']);
    assert.equal(manifest.packageName, 'fixture-app');
    assert.deepEqual(manifest.scripts, {dev: 'vite'});
    assert.deepEqual(manifest.designTokens, ['--brand', '--space-2']);
    assert.deepEqual(manifest.globalStyles, ['src/index.css']);
    assert.equal(manifest.sourceFiles, 3, 'every component file is counted');
    assert.deepEqual(manifest.componentCandidates.sort(), ['src/Button.module.css', 'src/ModalCard.tsx', 'src/ThemeProvider.tsx'].filter((f) => f.endsWith('.tsx')).sort());
    assert.deepEqual(manifest.providers, ['src/ThemeProvider.tsx']);
    assert.deepEqual(manifest.dependencies, {react: '18.3.1', vite: '5.4.0', tailwindcss: '3.4.0'});
    assert.equal(manifest.limits.length, 3, 'the scan states what it cannot know');
  });
});

test('the more specific framework is reported first', () => {
  withProject({'package.json': packageJson({next: '14.0.0', react: '18.3.1'})}, (project) => {
    assert.deepEqual(inspectProject(project, false).frameworks, ['nextjs', 'react']);
  });
});

test('every framework signal is recognised, by dependency or by marker file', () => {
  const cases = [
    [{'package.json': packageJson({'@angular/core': '17.0.0'})}, ['angular']],
    [{'package.json': packageJson(), 'angular.json': {}}, ['angular']],
    [{'package.json': packageJson({vue: '3.4.0'})}, ['vue']],
    [{'package.json': packageJson({nuxt: '3.0.0', vue: '3.4.0'})}, ['vue', 'nuxt']],
    [{'package.json': packageJson({svelte: '4.0.0'})}, ['svelte']],
    [{'package.json': packageJson({'@sveltejs/kit': '2.0.0'})}, ['svelte']],
    [{'package.json': packageJson({}, {vite: '5.4.0'})}, ['vite']],
  ];
  for (const [files, expected] of cases) {
    withProject(files, (project) => assert.deepEqual(inspectProject(project, false).frameworks, expected));
  }
});

test('plain HTML is a frontend, and a project with neither reports nothing', () => {
  withProject({'index.html': '<!doctype html><p>hi</p>'}, (project) => {
    assert.deepEqual(inspectProject(project, false).frameworks, ['html'], 'no package.json is fine');
    assert.equal(inspectProject(project, false).packageName, path.basename(project), 'the directory names it');
    assert.deepEqual(inspectProject(project, false).scripts, {});
  });
  withProject({'styles.css': 'body{color:red}'}, (project) => {
    assert.deepEqual(inspectProject(project, false).frameworks, []);
  });
});

test('every styling signal is recognised', () => {
  const packages = {
    sass: 'sass', 'styled-components': 'styled-components', '@emotion/react': 'emotion',
    '@mui/material': 'mui', '@chakra-ui/react': 'chakra', '@radix-ui/react-dialog': 'radix',
    antd: 'ant-design', 'shadcn-ui': 'shadcn',
  };
  withProject({
    'package.json': packageJson(Object.fromEntries(Object.keys(packages).map((name) => [name, '1.0.0']))),
  }, (project) => {
    assert.deepEqual(inspectProject(project, false).styling.sort(), Object.values(packages).sort());
  });
});

test('a stylesheet that cannot be read does not stop the scan', (t) => {
  if (process.getuid?.() === 0) return t.skip('running as root, permissions do not apply');
  withProject({'a.css': ':root{--readable:1}', 'b.css': ':root{--unreadable:1}'}, (project) => {
    fs.chmodSync(path.join(project, 'b.css'), 0o000);
    try {
      assert.deepEqual(inspectProject(project, false).designTokens, ['--readable']);
    } finally {
      fs.chmodSync(path.join(project, 'b.css'), 0o644);
    }
  });
});

test('an oversized stylesheet is skipped rather than read into memory', () => {
  withProject({
    'small.css': ':root{--kept:1}',
    'huge.css': `:root{--skipped:1}\n${'/* padding */'.repeat(25_000)}`,
  }, (project) => {
    assert.ok(fs.statSync(path.join(project, 'huge.css')).size > 250_000, 'the fixture is actually oversized');
    assert.deepEqual(inspectProject(project, false).designTokens, ['--kept']);
  });
});

test('token collection stops at its cap', () => {
  const declarations = Array.from({length: 320}, (unused, index) => `--token-${String(index).padStart(4, '0')}:${index}`);
  withProject({'tokens.css': `:root{${declarations.join(';')}}`}, (project) => {
    assert.equal(inspectProject(project, false).designTokens.length, 200);
  });
});

test('the manifest is written into the project workspace only when asked', () => {
  withProject({'package.json': packageJson({react: '18.3.1'})}, (project) => {
    const manifestPath = path.join(project, '.zanker', 'project.manifest.json');
    inspectProject(project, false);
    assert.equal(fs.existsSync(manifestPath), false);
    const manifest = inspectProject(project);
    assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), manifest);
    assert.equal(manifest.project, path.resolve(project));
  });
});

test('a path that is not a directory is refused', () => {
  withProject({'file.txt': 'x'}, (project) => {
    assert.throws(() => inspectProject(path.join(project, 'file.txt')), /Project must be a directory/);
    assert.throws(() => inspectProject(path.join(project, 'absent')), /ENOENT/);
  });
});
