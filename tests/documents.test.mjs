import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {documentVisual} from '../src/documents.mjs';

function withProject(body) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-documents-'));
  fs.mkdirSync(path.join(project, 'src'), {recursive: true});
  fs.writeFileSync(path.join(project, 'src', 'Login.tsx'), 'export default function Login(){}\n');
  fs.writeFileSync(path.join(project, 'src', 'Form.tsx'), 'export default function Form(){}\n');
  fs.writeFileSync(path.join(project, 'shot.png'), 'png bytes');
  try {
    return body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

const readDocument = (result) => JSON.parse(fs.readFileSync(path.join(result.dir, 'document.json'), 'utf8'));
const readReadme = (result) => fs.readFileSync(path.join(result.dir, 'README.md'), 'utf8');

test('a record names the implementation as the source of truth', () => {
  withProject((project) => {
    const result = documentVisual({
      project, title: 'Tela de Login', source: 'src/Login.tsx,src/Form.tsx',
      screenshots: ['shot.png'], description: 'Fluxo principal',
    });
    assert.equal(path.basename(result.dir), 'tela-de-login', 'the directory is named from the title');
    const metadata = readDocument(result);
    assert.equal(metadata.kind, 'zanker-visual-documentation');
    assert.equal(metadata.implementation.sourceOfTruth, 'real project code');
    assert.deepEqual(metadata.implementation.sourceFiles, [path.join('src', 'Login.tsx'), path.join('src', 'Form.tsx')]);
    assert.deepEqual(metadata.screenshots, ['shot.png']);
    assert.equal(metadata.visualSpec.role, 'Documentation and visual reference ONLY');
    assert.equal(metadata.visualSpec.reference, null, 'no spec was attached');
    assert.equal(metadata.policies.length, 3);
    assert.ok(metadata.policies.some((rule) => /Never generate or reconstruct production code/.test(rule)));
  });
});

test('a Visual Spec is recorded by checksum and never read for structure', () => {
  withProject((project) => {
    const spec = {components: [{type: 'Button', props: {label: 'Entrar'}}]};
    fs.writeFileSync(path.join(project, 'screen.vspec.json'), JSON.stringify(spec));
    const result = documentVisual({project, title: 'Com spec', visualspec: 'screen.vspec.json'});
    const reference = readDocument(result).visualSpec.reference;
    assert.equal(reference.path, 'screen.vspec.json');
    assert.equal(reference.sha256, crypto.createHash('sha256').update(JSON.stringify(spec)).digest('hex'));
    assert.match(reference.format, /not transformed, parsed into components, or treated as source code/);
    assert.equal(reference.schemaConformance, 'Not automatically verified');
    assert.equal(JSON.stringify(readDocument(result)).includes('Entrar'), false,
      'no value from the spec reaches the record');
  });
});

test('an attached file that is not JSON is refused', () => {
  withProject((project) => {
    fs.writeFileSync(path.join(project, 'bad.json'), 'not json at all');
    assert.throws(() => documentVisual({project, title: 'x', visualspec: 'bad.json'}));
  });
});

test('the README repeats the rule and links the evidence', () => {
  withProject((project) => {
    const readme = readReadme(documentVisual({
      project, title: 'Tela de Login', source: 'src/Login.tsx', screenshots: ['shot.png'],
      description: 'Fluxo principal', status: 'conceptual',
    }));
    assert.match(readme, /^# Tela de Login\n/);
    assert.match(readme, /\*\*Status:\*\* conceptual/);
    assert.match(readme, /- \[shot\.png\]\(\.\.\/\.\.\/\.\.\/shot\.png\)/);
    assert.match(readme, /> \*\*Regra:\*\* este registro nunca serve de input canônico para gerar código\./);
  });
});

test('the README says plainly when nothing was attached', () => {
  withProject((project) => {
    const readme = readReadme(documentVisual({project, title: 'Vazio'}));
    assert.match(readme, /- Não informada/);
    assert.match(readme, /- Ainda não produzidas/);
    assert.match(readme, /- Documento: Ainda não anexado/);
    assert.match(readme, /- Conformidade com o schema: Não aplicável/);
  });
});

test('an unknown status is refused, and leaves nothing behind', () => {
  withProject((project) => {
    assert.throws(() => documentVisual({project, title: 'x', status: 'shipped'}), /Invalid status/);
    assert.equal(fs.existsSync(path.join(project, '.zanker')), false, 'a refused request writes nothing');
    for (const status of ['implemented', 'conceptual', 'unverified']) {
      assert.equal(readDocument(documentVisual({project, title: status, status})).status, status);
    }
  });
});

test('a record cannot cite a file that is not there', () => {
  withProject((project) => {
    assert.throws(() => documentVisual({project, title: 'x', source: 'src/Absent.tsx'}), /Source not found/);
    assert.throws(() => documentVisual({project, title: 'x', screenshots: ['absent.png']}), /Screenshot not found: absent\.png/);
    assert.throws(() => documentVisual({project, title: 'x', source: '../outside.tsx'}), /Path outside project/);
    assert.throws(() => documentVisual({project, title: 'x', screenshots: ['../outside.png']}), /Path outside project/);
  });
});
