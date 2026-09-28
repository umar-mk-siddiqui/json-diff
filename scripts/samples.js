/**
 * Builds diff.md for every sample pair in samples/ so they can be reviewed by hand.
 * The same function backs the snapshot tests in test/samples.test.js.
 *
 *   npm run samples      # regenerate every samples/<name>/diff.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compare, renderMarkdown } from '../json-diff.js';

export const SAMPLES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'samples');

export function listSamples() {
  return fs
    .readdirSync(SAMPLES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(SAMPLES_DIR, e.name, 'left.json')))
    .map((e) => e.name)
    .sort();
}

export function runSample(name) {
  const dir = path.join(SAMPLES_DIR, name);
  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  const optionsFile = path.join(dir, 'options.json');
  const options = fs.existsSync(optionsFile) ? JSON.parse(read('options.json')) : {};
  const result = compare(JSON.parse(read('left.json')), JSON.parse(read('right.json')), options);
  // No timestamp or timing, so the output is deterministic.
  const markdown = renderMarkdown(result, {
    title: `JSON Diff Report — ${name}`,
    left: { name: `samples/${name}/left.json`, size: fs.statSync(path.join(dir, 'left.json')).size },
    right: { name: `samples/${name}/right.json`, size: fs.statSync(path.join(dir, 'right.json')).size },
    options,
  });
  return { result, markdown, dir };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const name of listSamples()) {
    const { result, markdown, dir } = runSample(name);
    fs.writeFileSync(path.join(dir, 'diff.md'), markdown);
    console.log(`${name.padEnd(28)} ${String(result.stats.total).padStart(3)} differences → samples/${name}/diff.md`);
  }
}
