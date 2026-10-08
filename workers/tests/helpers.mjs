// Loads a Worker source file exactly as deployed (single file, no extra exports),
// appending an `export { ... }` line only inside the test process so internals can be unit-tested.
import { readFileSync } from 'node:fs';

export async function loadWorker(file, internals = []) {
  const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const code = internals.length ? `${src}\nexport { ${internals.join(', ')} };\n` : src;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}

/** Replace global fetch with a router: (url, init|Request) => Response. Returns a restore function. */
export function mockFetch(handler) {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => handler(input instanceof Request ? input : new Request(input, init));
  return () => { globalThis.fetch = original; };
}
