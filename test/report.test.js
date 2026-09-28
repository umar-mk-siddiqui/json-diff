import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare, renderMarkdown, preview, code, formatBytes } from '../json-diff.js';

test('identical documents render a success message and no tables of changes', () => {
  const md = renderMarkdown(compare({ a: 1 }, { a: 1 }), { left: { name: 'a.json' }, right: { name: 'b.json' } });
  assert.match(md, /✅ \*\*No differences found/);
  assert.doesNotMatch(md, /## Details/);
});

test('report lists missing keys and changed values with both sides', () => {
  const md = renderMarkdown(compare({ keep: 1, gone: 'x', price: 10 }, { keep: 1, price: 12 }));
  assert.match(md, /\| ➖ Missing in JSON 2 \| `\$\.gone` \| `"x"` \| — \|/);
  assert.match(md, /\| ✏️ Value changed \| `\$\.price` \| `10` \| `12` \|/);
  assert.match(md, /2 differences found\*\* — 1 missing in JSON 2, 1 value changed\./);
  assert.match(md, /\| ➖ Missing in JSON 2 \| 1 \|/);
});

test('type changes show both types', () => {
  const md = renderMarkdown(compare({ n: '1' }, { n: 1 }));
  assert.match(md, /🔀 string → number/);
});

test('details are grouped by top-level section', () => {
  const md = renderMarkdown(compare({ a: { x: 1 }, b: { y: 1, z: 1 } }, { a: { x: 2 }, b: { y: 2, z: 2 } }));
  assert.match(md, /### `\$\.a` — 1 difference\n/);
  assert.match(md, /### `\$\.b` — 2 differences\n/);
});

test('truncation note appears when maxDiffs caps the list', () => {
  const a = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, i]));
  const b = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, -i - 1]));
  const md = renderMarkdown(compare(a, b, { maxDiffs: 5 }));
  assert.match(md, /Showing the first 5 of 20 differences/);
  assert.equal((md.match(/^\| \d+ \| ✏️/gm) ?? []).length, 5);
});

test('preview truncates long values and big subtrees without serialising them fully', () => {
  assert.equal(preview({ a: 1 }), '{"a":1}');
  const huge = Array.from({ length: 1_000_000 }, (_, i) => i);
  const p = preview(huge, 30);
  assert.equal(p.length, 30);
  assert.ok(p.endsWith('…'));
  assert.equal(preview('x'.repeat(10_000), 20).length, 20);
});

test('table cells escape pipes, newlines and backticks', () => {
  assert.equal(code('a|b'), '`a\\|b`');
  assert.equal(code('use `x`'), '`` use `x` ``');
  assert.equal(code('a\nb'), '`a b`');
  const md = renderMarkdown(compare({ 'p|k': 'a|b' }, { 'p|k': 'c' }));
  const row = md.split('\n').find((l) => l.startsWith('| 1 |'));
  // Unescaped pipes would add columns: expect exactly 6 cell separators.
  assert.equal(row.replace(/\\\|/g, '').split('|').length - 1, 6);
});

test('header shows file names, sizes and options', () => {
  const md = renderMarkdown(compare({ a: 1 }, { a: 2 }), {
    left: { name: 'one.json', size: 2048 },
    right: { name: 'two.json', size: 10 },
    options: { arrayKey: ['id'], ignore: ['$.meta'] },
    generatedAt: '2026-09-28T00:00:00.000Z',
    durationMs: 1234,
  });
  assert.match(md, /\| \*\*JSON 1\*\* \| `one\.json` \(2\.0 KB\) \|/);
  assert.match(md, /\| \*\*JSON 2\*\* \| `two\.json` \(10 B\) \|/);
  assert.match(md, /Match arrays by\*\* \| `id`/);
  assert.match(md, /Ignored paths\*\* \| `\$\.meta`/);
  assert.match(md, /Compare time\*\* \| 1\.23 s/);
});

test('formatBytes', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB');
});
