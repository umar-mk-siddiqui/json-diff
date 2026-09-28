/**
 * Large-input test: generates ~200k-record files on disk (~50 MB each) with a
 * known number of differences, then runs the real CLI against them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORDS = 200_000;

test(`CLI handles ${RECORDS.toLocaleString()} records per file`, { timeout: 120_000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-diff-large-'));
  try {
    const gen = spawnSync(process.execPath, [path.join(root, 'scripts/generate-large.js'), String(RECORDS), dir], { encoding: 'utf8' });
    assert.equal(gen.status, 0, gen.stderr);
    const expected = JSON.parse(gen.stdout.split('Expected differences with -k id:')[1].replace(/(\w+):/g, '"$1":'));

    const out = path.join(dir, 'diff.md');
    const started = Date.now();
    const r = spawnSync(
      process.execPath,
      [path.join(root, 'json-diff.js'), path.join(dir, 'left.json'), path.join(dir, 'right.json'), '-k', 'id', '-o', out],
      { encoding: 'utf8' },
    );
    const elapsed = Date.now() - started;
    assert.equal(r.status, 0, r.stderr);

    const total = expected.changed + expected.removed + expected.type_changed + expected.added;
    assert.match(
      r.stderr,
      new RegExp(
        `^${total} differences \\(${expected.removed} missing in JSON 2, ${expected.changed} value changed, ` +
          `${expected.type_changed} type changed, ${expected.added} only in JSON 2\\)`,
      ),
    );
    const md = fs.readFileSync(out, 'utf8');
    assert.match(md, /`\$\.users\[id=1000\]\.name`/);
    assert.match(md, /`\$\.users\[id=5000\]\.email`/);
    assert.match(md, /🔀 number → string/);
    console.log(`  large compare: ${r.stderr.trim()} — ${elapsed} ms wall time incl. parse`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
