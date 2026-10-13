import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {makeStudioPage, startStudio} from '../src/studio.mjs';

// The studio is an HTTP server, so it is tested by driving it over HTTP. Every
// response it can produce is exercised here, including the ones that refuse.

const CONCEPTS = [
  {id: 'raw-html', title: 'Raw', description: 'brings its own markup', html: '<p id="mine">hi</p>', css: 'p{color:red}'},
  {id: 'light', title: 'Claro & <b>claro</b>', description: 'default knobs'},
  {id: 'dark-sharp', title: 'Escuro', description: 'dark', mode: 'dark', accent: '#087f83', radius: 'sharp', brand: 'Acme'},
  {id: 'bad-accent', title: 'Fallback', accent: 'javascript:alert(1)'},
  {id: 'bare-html', html: '<p>no css</p>'},
  {id: 'bare', mode: 'light'},
];

async function withStudio(options, body) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-studio-'));
  if (options.concepts) fs.writeFileSync(path.join(project, 'concepts.json'), JSON.stringify({concepts: options.concepts}));
  const studio = await startStudio({project, concepts: options.concepts ? 'concepts.json' : undefined, port: 0});
  const origin = studio.url.split('/?')[0];
  const session = new URL(studio.url).searchParams.get('session');
  const call = (route, init) => fetch(`${origin}${route}${route.includes('?') ? '&' : '?'}session=${session}`, init);
  const post = (payload, raw) => call('/api/events', {
    method: 'POST', headers: {'content-type': 'application/json'}, body: raw ?? JSON.stringify(payload),
  });
  try {
    return await body({studio, origin, session, call, post, project});
  } finally {
    studio.server.close();
    fs.rmSync(project, {recursive: true, force: true});
  }
}

const expectStartupError = async (concepts, pattern) => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-studio-bad-'));
  fs.writeFileSync(path.join(project, 'concepts.json'), JSON.stringify({concepts}));
  try {
    await assert.rejects(() => startStudio({project, concepts: 'concepts.json', port: 0}), pattern);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
};

test('the chooser frames every concept and escapes its text', async () => {
  await withStudio({concepts: CONCEPTS}, async ({call}) => {
    const response = await call('/');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    const page = await response.text();
    assert.equal((page.match(/sandbox=""/g) || []).length, CONCEPTS.length, 'every frame is sandboxed');
    assert.equal(CONCEPTS.length, 6);
    assert.match(page, /Claro &amp; &lt;b&gt;claro&lt;\/b&gt;/, 'a concept title cannot inject markup');
    assert.doesNotMatch(page, /<b>claro<\/b>/);
  });
});

test('a concept preview is served without any script permission', async () => {
  await withStudio({concepts: CONCEPTS}, async ({call}) => {
    const response = await call('/preview/raw-html');
    assert.equal(response.status, 200);
    const csp = response.headers.get('content-security-policy');
    assert.doesNotMatch(csp, /script-src/, 'a preview may never run a script');
    assert.match(await response.text(), /<p id="mine">hi<\/p>/, 'a concept with its own markup is rendered as given');

    assert.match(await (await call('/preview/dark-sharp')).text(), /background:#111827/, 'dark mode changes the canvas');
    assert.match(await (await call('/preview/dark-sharp')).text(), /border-radius:5px/, 'sharp radius is honoured');
    assert.match(await (await call('/preview/light')).text(), /--accent:#4668ef/, 'the default accent is used');
    assert.match(await (await call('/preview/bad-accent')).text(), /--accent:#4668ef/, 'an accent that is not a hex color falls back');
    assert.doesNotMatch(await (await call('/preview/bad-accent')).text(), /javascript:/);

    const bare = await (await call('/preview/bare')).text();
    assert.match(bare, /<h1>Nova experiência<\/h1>/, 'a concept with no title still renders');
    assert.match(bare, /<p>Prévia de conceito<\/p>/);
    assert.match(bare, /class="brand">Studio</, 'and gets a default brand');
    assert.match(await (await call('/preview/bare-html')).text(), /<style><\/style>/, 'markup without css is fine');
  });
});

test('an unknown concept and an unknown path are refused', async () => {
  await withStudio({concepts: CONCEPTS}, async ({call}) => {
    assert.equal((await call('/preview/ghost')).status, 404);
    assert.equal((await call('/whatever')).status, 404);
    assert.equal((await call('/', {method: 'DELETE'})).status, 404, 'the method is part of the route');
  });
});

test('every request must carry the session token', async () => {
  await withStudio({concepts: CONCEPTS}, async ({origin}) => {
    assert.equal((await fetch(`${origin}/`)).status, 403);
    assert.equal((await fetch(`${origin}/?session=wrong`)).status, 403);
    assert.equal((await fetch(`${origin}/preview/light`)).status, 403, 'a preview is gated too');
  });
});

test('a selection and a comment are recorded, and anything else is rejected', async () => {
  await withStudio({concepts: CONCEPTS}, async ({post, studio}) => {
    assert.equal((await post({kind: 'selection', payload: {id: 'light'}})).status, 200);
    assert.equal((await post({kind: 'feedback', payload: {comment: 'mais editorial'}})).status, 200);

    const recorded = fs.readFileSync(studio.log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.deepEqual(recorded.map((event) => event.kind), ['selection', 'feedback']);
    assert.equal(recorded[0].payload.id, 'light');
    assert.match(recorded[0].at, /^\d{4}-\d{2}-\d{2}T/);

    for (const [payload, reason] of [
      [{kind: 'selection', payload: {id: 'ghost'}}, 'Invalid selection'],
      [{kind: 'feedback', payload: {comment: 'x'.repeat(4001)}}, 'Invalid feedback'],
      [{kind: 'feedback', payload: {}}, 'Invalid feedback'],
      [{kind: 'wipe', payload: {}}, 'Invalid event'],
      [{payload: {}}, 'Invalid event'],
    ]) {
      const response = await post(payload);
      assert.equal(response.status, 400);
      assert.equal(await response.text(), reason);
    }
    assert.equal((await post({kind: 'selection'})).status, 400, 'a missing payload is still validated');
    assert.equal((await post(null, 'not json')).status, 400);
    assert.equal(fs.readFileSync(studio.log, 'utf8').trim().split('\n').length, 2, 'nothing rejected was written');
  });
});

test('a body too large to be an event is cut off', async () => {
  await withStudio({concepts: CONCEPTS}, async ({post}) => {
    const response = await post(null, 'x'.repeat(17000));
    assert.equal(response.status, 413);
    assert.equal(await response.text(), 'Too large');
  });
});

test('without a concept file the studio shows its own set', async () => {
  await withStudio({}, async ({studio, call}) => {
    assert.equal(studio.concepts, 3);
    assert.match(await (await call('/preview/editorial')).text(), /Direção editorial/);
  });
});

test('a concept file that cannot be shown is refused at startup', async () => {
  await expectStartupError([], /must contain 1-8 concepts/);
  await expectStartupError(Array.from({length: 9}, (unused, index) => ({id: `c${index}`})), /must contain 1-8 concepts/);
  await expectStartupError('not an array', /must contain 1-8 concepts/);
  await expectStartupError([{id: 'a'}, {id: 'a'}], /unique id/);
  await expectStartupError([{id: 'has space'}], /unique id/);
  await expectStartupError([{title: 'no id'}], /unique id/);
});

test('the studio refuses to listen anywhere but this machine', async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-studio-host-'));
  try {
    await assert.rejects(() => startStudio({project, port: 0, host: '0.0.0.0'}), /limited to loopback/);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
});

test('the chooser renders without a server, for a quick check', () => {
  const page = makeStudioPage([{id: 'a', title: 'A'}], 'SESSION');
  assert.match(page, /src="\/preview\/a\?session=SESSION"/);
  assert.match(page, /Zanker Design Studio/);
});
