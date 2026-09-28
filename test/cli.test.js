import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'json-diff.js');
const sample = (name, file) => path.join(root, 'samples', name, file);
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'json-diff-'));

test('writes a Markdown report to --output and a summary to stderr', () => {
  const out = path.join(tmp, 'diff.md');
  const r = run(sample('06-array-by-key', 'left.json'), sample('06-array-by-key', 'right.json'), '-k', 'id', '-o', out);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /4 differences \(1 missing in JSON 2, 2 value changed, 0 type changed, 1 only in JSON 2\)/);
  const md = fs.readFileSync(out, 'utf8');
  assert.match(md, /^# JSON Diff Report/);
  assert.match(md, /`\$\.users\[id=2\]`/);
  assert.match(md, /\*\*Generated\*\*/);
});

test('prints to stdout without --output', () => {
  const r = run(sample('02-scalar-changes', 'left.json'), sample('02-scalar-changes', 'right.json'));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /\| ✏️ Value changed \| `\$\.price` \| `1299` \| `1499` \|/);
});

test('--ignore and --max-diffs are applied', () => {
  const r = run(
    sample('09-ignore-paths', 'left.json'),
    sample('09-ignore-paths', 'right.json'),
    '-i', '$.meta.generatedAt', '-i', '$.meta.requestId', '-i', '$.items[*].updatedAt', '--max-diffs', '1',
  );
  assert.equal(r.status, 0);
  assert.match(r.stdout, /2 differences found/);
  assert.match(r.stdout, /Showing the first 1 of 2 differences/);
});

test('--fail-on-diff exits 1 on differences and 0 when identical', () => {
  assert.equal(run(sample('02-scalar-changes', 'left.json'), sample('02-scalar-changes', 'right.json'), '--fail-on-diff').status, 1);
  assert.equal(run(sample('01-identical', 'left.json'), sample('01-identical', 'right.json'), '--fail-on-diff').status, 0);
});

test('reports bad input clearly with exit code 2', () => {
  const bad = path.join(tmp, 'bad.json');
  fs.writeFileSync(bad, '{"a": 1,}');
  let r = run(bad, sample('01-identical', 'left.json'));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /invalid JSON in .*bad\.json/);

  r = run(path.join(tmp, 'nope.json'), bad);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /cannot read/);

  r = run('only-one.json');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /expected exactly 2 files/);

  r = run('a', 'b', '--max-diffs', 'zero');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--max-diffs must be a positive integer/);
});

test('--help', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage:/);
});

test('can be imported without running the CLI', async () => {
  const mod = await import(cli);
  assert.equal(typeof mod.compare, 'function');
  assert.equal(typeof mod.renderMarkdown, 'function');
});
