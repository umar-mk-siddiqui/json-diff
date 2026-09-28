/**
 * Generates a large pair of similar JSON files with a known set of differences,
 * for benchmarking and for manually checking the tool against big inputs.
 *
 *   node scripts/generate-large.js [records=200000] [outDir=samples/large]
 *   node bin/json-diff.js samples/large/left.json samples/large/right.json -k id -o samples/large/diff.md
 *
 * Files are written record by record, so generation itself never builds one huge string.
 */
import fs from 'node:fs';
import path from 'node:path';

const records = Number(process.argv[2] ?? 200_000);
const outDir = process.argv[3] ?? 'samples/large';
fs.mkdirSync(outDir, { recursive: true });

// Deterministic PRNG so the same arguments always give the same files.
let seed = 42;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

const CITIES = ['Bengaluru', 'Chennai', 'Pune', 'Delhi', 'Mumbai', 'Hyderabad'];
const makeRecord = (id) => ({
  id,
  name: `User ${id}`,
  email: `user${id}@example.com`,
  active: rand() > 0.2,
  score: Math.round(rand() * 10000) / 100,
  profile: { city: CITIES[id % CITIES.length], age: 18 + (id % 60), tags: ['alpha', 'beta'].slice(0, 1 + (id % 2)) },
  history: [{ event: 'signup', at: '2026-01-01' }, { event: 'login', at: '2026-09-01' }],
});

// Every 1000th record: value changed; every 5000th: key removed in right;
// every 7000th: type changed; last 1% of ids missing in right; 500 new ids in right.
const expected = { changed: 0, removed: 0, type_changed: 0, added: 0 };
const missingFrom = Math.floor(records * 0.99);

function writeArray(file, build) {
  const fd = fs.openSync(file, 'w');
  fs.writeSync(fd, '{"meta":{"source":"generate-large","records":' + records + '},"users":[\n');
  let first = true;
  build((rec) => {
    fs.writeSync(fd, (first ? '' : ',\n') + JSON.stringify(rec));
    first = false;
  });
  fs.writeSync(fd, '\n]}\n');
  fs.closeSync(fd);
}

writeArray(path.join(outDir, 'left.json'), (emit) => {
  seed = 42;
  for (let id = 1; id <= records; id++) emit(makeRecord(id));
});

writeArray(path.join(outDir, 'right.json'), (emit) => {
  seed = 42;
  for (let id = 1; id <= records; id++) {
    const rec = makeRecord(id);
    if (id > missingFrom) {
      expected.removed++;
      continue;
    }
    if (id % 1000 === 0) {
      rec.name += ' (renamed)';
      expected.changed++;
    }
    if (id % 5000 === 0) {
      delete rec.email;
      expected.removed++;
    }
    if (id % 7000 === 0) {
      rec.score = String(rec.score);
      expected.type_changed++;
    }
    emit(rec);
  }
  for (let i = 1; i <= 500; i++) {
    emit(makeRecord(records + i));
    expected.added++;
  }
});

const size = (f) => (fs.statSync(path.join(outDir, f)).size / 1024 / 1024).toFixed(1);
console.log(`Wrote ${outDir}/left.json (${size('left.json')} MB) and right.json (${size('right.json')} MB)`);
console.log('Expected differences with -k id:', expected);
