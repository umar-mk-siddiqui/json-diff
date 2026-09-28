/**
 * Runs every hand-written pair in samples/ and checks:
 *   1. the exact counts we expect (written out below, so they double as a spec)
 *   2. the rendered report matches the committed samples/<name>/diff.md
 * Regenerate the reports after an intentional change with `npm run samples`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { listSamples, runSample } from '../scripts/samples.js';

// [missing in JSON 2, value changed, type changed, only in JSON 2]
const EXPECTED = {
  '01-identical': [0, 0, 0, 0],
  '02-scalar-changes': [0, 4, 0, 0],
  '03-added-removed-keys': [1, 0, 0, 2],
  '04-type-changes': [0, 0, 6, 0],
  '05-array-by-index': [1, 4, 0, 1],
  '06-array-by-key': [1, 2, 0, 1],
  '07-deeply-nested': [0, 3, 0, 1],
  '08-special-keys': [0, 9, 0, 0],
  '09-ignore-paths': [0, 2, 0, 0],
  '10-realistic-api-response': [1, 5, 0, 3],
};

// The specific paths a reviewer should see, per sample.
const EXPECTED_PATHS = {
  '03-added-removed-keys': ['removed $.phone', 'added $.address.landmark', 'added $.preferences'],
  '06-array-by-key': [
    'changed $.users[id=3].role',
    'changed $.users[id=3].active',
    'removed $.users[id=2]',
    'added $.users[id=5]',
  ],
  '09-ignore-paths': ['changed $.meta.version', 'changed $.items[id=1].qty'],
};

test('every sample directory has an expectation', () => {
  assert.deepEqual(listSamples(), Object.keys(EXPECTED).sort());
});

for (const name of listSamples()) {
  test(`sample ${name}`, () => {
    const { result, markdown, dir } = runSample(name);
    const { removed, changed, type_changed, added } = result.stats;
    assert.deepEqual([removed, changed, type_changed, added], EXPECTED[name], 'difference counts');

    if (EXPECTED_PATHS[name]) {
      assert.deepEqual(
        result.diffs.map((d) => `${d.type} ${d.path}`).sort(),
        [...EXPECTED_PATHS[name]].sort(),
      );
    }

    const snapshot = path.join(dir, 'diff.md');
    assert.ok(fs.existsSync(snapshot), `missing ${snapshot} — run \`npm run samples\``);
    assert.equal(markdown, fs.readFileSync(snapshot, 'utf8'), `${snapshot} is stale — run \`npm run samples\``);
  });
}
