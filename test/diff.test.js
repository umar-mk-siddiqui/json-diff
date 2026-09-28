import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diff, compare, compileIgnore, sectionOf, keySegment } from '../json-diff.js';

const all = (a, b, opts) => [...diff(a, b, opts)];
const brief = (a, b, opts) => all(a, b, opts).map((d) => `${d.type} ${d.path}`);

test('identical documents, including different key order, have no differences', () => {
  assert.deepEqual(all({ a: 1, b: { c: [1, 2] } }, { b: { c: [1, 2] }, a: 1 }), []);
  assert.equal(compare({ x: null }, { x: null }).equal, true);
});

test('key present in JSON 1 but missing in JSON 2 is reported as removed', () => {
  assert.deepEqual(all({ a: 1, gone: { deep: true } }, { a: 1 }), [
    { type: 'removed', path: '$.gone', left: { deep: true } },
  ]);
});

test('missing keys are found at any depth', () => {
  assert.deepEqual(brief({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }), ['removed $.a.b.d']);
});

test('key present in both with a different value is reported as changed', () => {
  assert.deepEqual(all({ price: 10, name: 'x', ok: true }, { price: 12, name: 'x', ok: false }), [
    { type: 'changed', path: '$.price', left: 10, right: 12 },
    { type: 'changed', path: '$.ok', left: true, right: false },
  ]);
});

test('key only in JSON 2 is reported as added', () => {
  assert.deepEqual(all({}, { fresh: [1] }), [{ type: 'added', path: '$.fresh', right: [1] }]);
});

test('type changes are distinguished from value changes', () => {
  const d = all({ n: '42', o: null, arr: [], obj: {} }, { n: 42, o: {}, arr: {}, obj: [] });
  assert.deepEqual(
    d.map((x) => `${x.path} ${x.leftType}->${x.rightType}`),
    ['$.n string->number', '$.o null->object', '$.arr array->object', '$.obj object->array'],
  );
  assert.ok(d.every((x) => x.type === 'type_changed'));
});

test('root-level scalar and type differences', () => {
  assert.deepEqual(brief(1, 2), ['changed $']);
  assert.deepEqual(brief([], {}), ['type_changed $']);
});

test('arrays compare by index by default', () => {
  assert.deepEqual(brief([1, 2, 3], [1, 9]), ['changed $[1]', 'removed $[2]']);
  assert.deepEqual(brief([1], [1, 2]), ['added $[1]']);
});

test('arrays match by key when arrayKey is given, so reordering is not a difference', () => {
  const a = [{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 3, v: 'c' }];
  const b = [{ id: 3, v: 'c' }, { id: 1, v: 'A' }, { id: 4, v: 'd' }];
  assert.deepEqual(brief(a, b, { arrayKey: 'id' }), ['changed $[id=1].v', 'removed $[id=2]', 'added $[id=4]']);
});

test('string ids are quoted in paths, and string "1" is not the same id as number 1', () => {
  assert.deepEqual(brief([{ id: 'x' }], [{ id: 'x', n: 1 }], { arrayKey: 'id' }), ['added $[id="x"].n']);
  assert.deepEqual(brief([{ id: 1 }], [{ id: '1' }], { arrayKey: 'id' }), ['removed $[id=1]', 'added $[id="1"]']);
});

test('keyed matching falls back to index when the key is missing, duplicated or not primitive', () => {
  assert.deepEqual(brief([{ id: 1 }, { x: 1 }], [{ id: 1 }, { x: 2 }], { arrayKey: 'id' }), ['changed $[1].x']);
  assert.deepEqual(brief([{ id: 1, v: 1 }, { id: 1, v: 2 }], [{ id: 1, v: 1 }, { id: 1, v: 3 }], { arrayKey: 'id' }), [
    'changed $[1].v',
  ]);
  assert.deepEqual(brief([{ id: {} }], [{ id: [] }], { arrayKey: 'id' }), ['type_changed $[0].id']);
  assert.deepEqual(brief([1, 2], [2, 1], { arrayKey: 'id' }), ['changed $[0]', 'changed $[1]']);
});

test('several candidate keys: the first that fits each array is used', () => {
  const a = { orders: [{ id: 'o1', items: [{ sku: 'A', q: 1 }, { sku: 'B', q: 1 }] }] };
  const b = { orders: [{ id: 'o1', items: [{ sku: 'B', q: 2 }, { sku: 'A', q: 1 }] }] };
  assert.deepEqual(brief(a, b, { arrayKey: ['id', 'sku'] }), ['changed $.orders[id="o1"].items[sku="B"].q']);
  assert.deepEqual(brief(a, b, { arrayKey: 'id,sku' }), ['changed $.orders[id="o1"].items[sku="B"].q']);
});

test('ignore patterns: exact path, *, [*], ** and optional $ prefix', () => {
  const a = { meta: { at: 1, id: 1, v: 1 }, items: [{ t: 1, q: 1 }], deep: { x: { t: 1 } } };
  const b = { meta: { at: 2, id: 2, v: 2 }, items: [{ t: 2, q: 2 }], deep: { x: { t: 2 } } };
  assert.deepEqual(brief(a, b, { ignore: ['$.meta.at', 'meta.id', '$.items[*].t', '$.**.t'] }), [
    'changed $.meta.v',
    'changed $.items[0].q',
  ]);
  assert.deepEqual(brief(a, b, { ignore: '$.meta.*' }).filter((p) => p.includes('meta')), []);
  // Ignoring a parent skips the whole subtree, including missing keys.
  assert.deepEqual(brief({ cfg: { a: 1 } }, { cfg: {} }, { ignore: '$.cfg' }), []);
  assert.equal(compileIgnore([]), null);
});

test('[*] also matches keyed array segments', () => {
  const a = [{ id: 1, t: 1 }];
  const b = [{ id: 1, t: 2 }];
  assert.deepEqual(brief(a, b, { arrayKey: 'id', ignore: '[*].t' }), []);
});

test('awkward keys are quoted in paths', () => {
  assert.equal(keySegment('name'), '.name');
  assert.equal(keySegment('first name'), '["first name"]');
  assert.equal(keySegment('a.b'), '["a.b"]');
  assert.equal(keySegment(''), '[""]');
  assert.equal(keySegment('123'), '["123"]');
  assert.deepEqual(brief({ 'a.b': 1 }, { 'a.b': 2 }), ['changed $["a.b"]']);
});

test('differences are yielded in document order', () => {
  const a = { a: 1, b: { x: 1, y: 1 }, c: [1, 2], d: 1 };
  const b = { a: 2, b: { x: 2 }, c: [1, 3], e: 1 };
  assert.deepEqual(brief(a, b), [
    'changed $.a',
    'changed $.b.x',
    'removed $.b.y',
    'changed $.c[1]',
    'removed $.d',
    'added $.e',
  ]);
});

test('sectionOf groups by top-level key', () => {
  assert.equal(sectionOf('$'), '$');
  assert.equal(sectionOf('$.users[3].name'), '$.users');
  assert.equal(sectionOf('$["first name"].x'), '$["first name"]');
  assert.equal(sectionOf('$[id=1].v'), '$[id=1]');
  assert.equal(sectionOf('$[2]'), '$[2]');
});

test('compare counts every difference even when the kept list is capped', () => {
  const a = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]));
  const b = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i + 1]));
  const r = compare(a, b, { maxDiffs: 10 });
  assert.equal(r.stats.total, 50);
  assert.equal(r.stats.changed, 50);
  assert.equal(r.diffs.length, 10);
  assert.equal(r.truncated, true);
  assert.equal(r.sections.size, 50);
});

test('very deep nesting does not overflow the stack', () => {
  const build = (leaf) => {
    let root = { leaf };
    for (let i = 0; i < 100_000; i++) root = { n: root };
    return root;
  };
  const r = compare(build(1), build(2));
  assert.equal(r.stats.changed, 1);
  assert.ok(r.diffs[0].path.endsWith('.n.leaf'));
});
