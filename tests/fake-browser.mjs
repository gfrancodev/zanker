import fs from 'node:fs';

// A stand in for Playwright's Chromium API. It records what the module under
// test asked the browser to do, so the orchestration can be asserted without a
// real browser: which contexts were opened, with what viewport and scheme, and
// which screenshots were written.

/**
 * @param {object} [behavior]
 * @param {Error} [behavior.gotoError] Thrown by every navigation.
 * @param {Error} [behavior.addScriptTagError] Thrown when a script is injected.
 * @param {object} [behavior.diagnostics] Returned for the page diagnostics probe.
 * @param {object} [behavior.axeResult] Returned for the axe probe.
 * @param {object} [behavior.elementDescription] Returned for the element probe.
 * @param {number} [behavior.elementCount] What `locator().first().count()` reports.
 * @param {string[]} [behavior.consoleErrors] Emitted as console errors on each page.
 * @param {string[]} [behavior.pageErrors] Emitted as uncaught page errors.
 */
export function makeFakeChromium(behavior = {}) {
  const calls = {launches: [], contexts: [], pages: [], screenshots: [], scripts: [], closed: 0};

  const makePage = () => {
    const listeners = {};
    const page = {
      on(event, handler) {
        listeners[event] = handler;
      },
      async goto(url, options) {
        calls.pages.push({url, options});
        for (const message of behavior.consoleErrors || []) listeners.console?.({type: () => 'error', text: () => message});
        for (const message of behavior.pageErrors || []) listeners.pageerror?.({message});
        if (behavior.gotoError) throw behavior.gotoError;
      },
      async evaluate(fn) {
        if (fn.name === 'collectPageDiagnostics') return behavior.diagnostics ?? {title: 'Fake'};
        if (fn.name === 'runAxeInPage') return behavior.axeResult ?? {violations: []};
        return undefined; // the fonts.ready probe
      },
      async screenshot({path: target}) {
        calls.screenshots.push(target);
        fs.writeFileSync(target, 'png');
      },
      async addScriptTag({content}) {
        calls.scripts.push(content.length);
        if (behavior.addScriptTagError) throw behavior.addScriptTagError;
      },
      locator() {
        return {
          first: () => ({
            async count() {
              return behavior.elementCount ?? 1;
            },
            async evaluate() {
              return behavior.elementDescription ?? {viewport: {width: 390, height: 844}, nodes: []};
            },
            async screenshot({path: target}) {
              calls.screenshots.push(target);
              fs.writeFileSync(target, 'png');
            },
          }),
        };
      },
    };
    return page;
  };

  const chromium = {
    async launch(options) {
      calls.launches.push(options);
      return {
        async newContext(options) {
          calls.contexts.push(options);
          return {
            async newPage() {
              return makePage();
            },
            async close() {},
          };
        },
        async newPage(options) {
          calls.contexts.push(options);
          return makePage();
        },
        async close() {
          calls.closed++;
        },
      };
    },
  };

  return {chromium, calls, load: async () => chromium};
}

/** Installs a stub `document` and `innerWidth` so a page probe can run in node. */
export function withStubDocument(dom, body) {
  const saved = {document: globalThis.document, innerWidth: globalThis.innerWidth, innerHeight: globalThis.innerHeight};
  globalThis.document = dom.document;
  globalThis.innerWidth = dom.innerWidth;
  globalThis.innerHeight = dom.innerHeight;
  try {
    return body();
  } finally {
    Object.assign(globalThis, saved);
  }
}
