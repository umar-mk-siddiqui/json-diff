#!/usr/bin/env node
/**
 * json-diff — compare two similar JSON files and write the differences as Markdown.
 *
 * Single file, zero dependencies, Node.js >= 20. Works as a CLI and as a module.
 *
 *   node json-diff.js one.json two.json -o diff.md
 *   node json-diff.js one.json two.json -k id -i '$.meta.generatedAt' -o diff.md
 *
 *   import { compare, renderMarkdown } from './json-diff.js';
 *
 * Reports, for every path:
 *   ➖ Missing in JSON 2  key/element present in JSON 1 but not in JSON 2
 *   ✏️ Value changed      present in both, same type, different value
 *   🔀 Type changed       present in both, different JSON type (e.g. "42" vs 42)
 *   ➕ Only in JSON 2     present in JSON 2 but not in JSON 1
 *
 * Key order inside objects is ignored. Arrays are compared by index unless
 * --key names an identity field (then reordering is not a difference).
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

// ─── Diff engine ────────────────────────────────────────────────────────────
export const ADDED = 'added';
export const REMOVED = 'removed';
export const CHANGED = 'changed';
export const TYPE_CHANGED = 'type_changed';

export const DIFF_TYPES = [CHANGED, ADDED, REMOVED, TYPE_CHANGED];

/** JSON-aware type name: distinguishes null and array from object. */
export function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Path segment for an object key: `.name` or `["first name"]`. */
export function keySegment(key) {
  return IDENTIFIER.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}

/** Accepts a string, comma-separated string, or array of either. */
function toList(value) {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Compile ignore patterns into a single path predicate.
 *   `*`   one object key            `$.meta.*`
 *   `[*]` one array element         `$.items[*].updatedAt`
 *   `**`  anything, any depth       `$.**.updatedAt`
 * A leading `$.` is optional. Ignoring a path also ignores everything below it.
 */
export function compileIgnore(patterns) {
  const regexes = toList(patterns).map(patternToRegex);
  if (!regexes.length) return null;
  return (path) => regexes.some((re) => re.test(path));
}

function patternToRegex(pattern) {
  let p = pattern;
  if (!p.startsWith('$')) p = (p.startsWith('[') ? '$' : '$.') + p;
  let src = '';
  for (let i = 0; i < p.length; i++) {
    if (p.startsWith('**', i)) {
      src += '.*';
      i += 1;
    } else if (p.startsWith('[*]', i)) {
      src += '\\[[^\\]]*\\]';
      i += 2;
    } else if (p[i] === '*') {
      src += '[^.\\[]+';
    } else {
      src += p[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${src}$`);
}

/**
 * Pick the first candidate key that uniquely identifies every element of both
 * arrays (each element an object with a primitive value for that key).
 * Returns null when no candidate qualifies, meaning compare by index.
 */
function pickArrayKey(a, b, candidates) {
  candidateLoop: for (const key of candidates) {
    for (const arr of [a, b]) {
      const seen = new Set();
      for (const el of arr) {
        if (typeOf(el) !== 'object' || !Object.hasOwn(el, key)) continue candidateLoop;
        const t = typeOf(el[key]);
        if (t !== 'string' && t !== 'number' && t !== 'boolean') continue candidateLoop;
        const id = `${t}:${el[key]}`;
        if (seen.has(id)) continue candidateLoop;
        seen.add(id);
      }
    }
    return key;
  }
  return null;
}

// A stack frame is { path, a, b } for a pair to compare, or has inA/inB = false
// when the value exists on only one side.
function objectChildren(path, a, b) {
  const out = [];
  for (const key of Object.keys(a)) {
    const p = path + keySegment(key);
    out.push(Object.hasOwn(b, key) ? { path: p, a: a[key], b: b[key] } : { path: p, a: a[key], inB: false });
  }
  for (const key of Object.keys(b)) {
    if (!Object.hasOwn(a, key)) out.push({ path: path + keySegment(key), b: b[key], inA: false });
  }
  return out;
}

function arrayChildren(path, a, b, keyCandidates) {
  const out = [];
  const key = keyCandidates.length ? pickArrayKey(a, b, keyCandidates) : null;

  if (key === null) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const p = `${path}[${i}]`;
      if (i >= b.length) out.push({ path: p, a: a[i], inB: false });
      else if (i >= a.length) out.push({ path: p, b: b[i], inA: false });
      else out.push({ path: p, a: a[i], b: b[i] });
    }
    return out;
  }

  const idOf = (el) => `${typeof el[key]}:${el[key]}`;
  const segment = (el) => `${path}[${key}=${JSON.stringify(el[key])}]`;
  const rightById = new Map(b.map((el) => [idOf(el), el]));
  const leftIds = new Set();
  for (const el of a) {
    const id = idOf(el);
    leftIds.add(id);
    out.push(rightById.has(id) ? { path: segment(el), a: el, b: rightById.get(id) } : { path: segment(el), a: el, inB: false });
  }
  for (const el of b) {
    if (!leftIds.has(idOf(el))) out.push({ path: segment(el), b: el, inA: false });
  }
  return out;
}

/**
 * Lazily yield every difference between `left` and `right`, in document order.
 *
 * Options:
 *   arrayKey  key name(s) used to match array elements by identity instead of
 *             by index, e.g. 'id' or ['id', 'sku'] (first one that fits wins)
 *   ignore    path pattern(s) to skip, see compileIgnore()
 *
 * Each difference is { type, path, left?, right?, leftType?, rightType? }.
 */
export function* diff(left, right, options = {}) {
  const arrayKeys = toList(options.arrayKey);
  const isIgnored = compileIgnore(options.ignore);
  const stack = [{ path: '$', a: left, b: right }];

  while (stack.length) {
    const { path, a, b, inA = true, inB = true } = stack.pop();
    if (isIgnored?.(path)) continue;
    if (!inB) {
      yield { type: REMOVED, path, left: a };
      continue;
    }
    if (!inA) {
      yield { type: ADDED, path, right: b };
      continue;
    }
    if (a === b) continue;

    const ta = typeOf(a);
    const tb = typeOf(b);
    if (ta !== tb) {
      yield { type: TYPE_CHANGED, path, left: a, right: b, leftType: ta, rightType: tb };
      continue;
    }

    let children;
    if (ta === 'object') children = objectChildren(path, a, b);
    else if (ta === 'array') children = arrayChildren(path, a, b, arrayKeys);
    else {
      yield { type: CHANGED, path, left: a, right: b };
      continue;
    }
    // Push in reverse so children pop (and are reported) in document order.
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
  }
}

/** Top-level section a path belongs to: `$.users[3].name` -> `$.users`. */
export function sectionOf(path) {
  const m = /^\$(\.[^.[]+|\[(?:"(?:[^"\\]|\\.)*"|[^\]]*)\])/.exec(path);
  return m ? `$${m[1]}` : '$';
}

function emptyCounts() {
  return { changed: 0, added: 0, removed: 0, type_changed: 0, total: 0 };
}

/**
 * Run a full comparison and aggregate the results.
 * `maxDiffs` caps how many difference records are kept (counts stay exact),
 * which bounds memory and report size for very large, very different inputs.
 */
export function compare(left, right, options = {}) {
  const maxDiffs = options.maxDiffs ?? Infinity;
  const stats = emptyCounts();
  const sections = new Map();
  const diffs = [];

  for (const d of diff(left, right, options)) {
    stats[d.type]++;
    stats.total++;
    const section = sectionOf(d.path);
    let counts = sections.get(section);
    if (!counts) sections.set(section, (counts = emptyCounts()));
    counts[d.type]++;
    counts.total++;
    if (diffs.length < maxDiffs) diffs.push(d);
  }

  return { equal: stats.total === 0, stats, sections, diffs, truncated: diffs.length < stats.total };
}

// ─── Markdown report ────────────────────────────────────────────────────────

// Order matters: the most important findings (missing keys, changed values) come first.
const ORDER = ['removed', 'changed', 'type_changed', 'added'];

const LABELS = {
  removed: '➖ Missing in JSON 2',
  changed: '✏️ Value changed',
  type_changed: '🔀 Type changed',
  added: '➕ Only in JSON 2',
};

const PHRASES = {
  removed: 'missing in JSON 2',
  changed: 'value changed',
  type_changed: 'type changed',
  added: 'only in JSON 2',
};

const EMPTY_CELL = '—';

/**
 * Compact JSON preview capped at `maxLength` characters. Stops serialising as
 * soon as the budget is spent, so previewing a huge added/removed subtree is
 * cheap, and recursion depth is bounded by `maxLength`.
 */
export function preview(value, maxLength = 80) {
  const STOP = Symbol('stop');
  let out = '';
  const write = (s) => {
    out += s;
    if (out.length > maxLength) throw STOP;
  };
  const walk = (v) => {
    const t = typeOf(v);
    if (t === 'array') {
      write('[');
      for (let i = 0; i < v.length; i++) {
        if (i) write(',');
        walk(v[i]);
      }
      write(']');
    } else if (t === 'object') {
      write('{');
      let first = true;
      for (const key of Object.keys(v)) {
        if (!first) write(',');
        first = false;
        write(`${JSON.stringify(key)}:`);
        walk(v[key]);
      }
      write('}');
    } else if (t === 'string' && v.length > maxLength) {
      write(JSON.stringify(v.slice(0, maxLength + 1)));
    } else {
      write(JSON.stringify(v));
    }
  };
  try {
    walk(value);
    return out;
  } catch (err) {
    if (err !== STOP) throw err;
    return `${out.slice(0, maxLength - 1)}…`;
  }
}

/** Inline code span that is safe inside a GFM table cell. */
export function code(text) {
  const s = String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  if (!s.includes('`')) return `\`${s}\``;
  const longestRun = Math.max(...(s.match(/`+/g) ?? ['']).map((r) => r.length));
  const fence = '`'.repeat(longestRun + 1);
  return `${fence} ${s} ${fence}`;
}

export function formatBytes(bytes) {
  if (bytes == null) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
}

function plural(n, word) {
  return `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
}

function changeLabel(d) {
  return d.type === 'type_changed' ? `🔀 ${d.leftType} → ${d.rightType}` : LABELS[d.type];
}

function sourceRow(label, source) {
  if (!source) return null;
  const size = source.size != null ? ` (${formatBytes(source.size)})` : '';
  return `| **${label}** | ${code(source.name)}${size} |`;
}

/**
 * Render a compare() result as Markdown.
 *
 * meta: { title, left: {name, size}, right: {name, size}, generatedAt,
 *         durationMs, options: {arrayKey, ignore}, maxValueLength }
 * Omit generatedAt / durationMs for deterministic output (snapshots).
 */
export function renderMarkdown(result, meta = {}) {
  const { stats, sections, diffs, truncated } = result;
  const maxValueLength = meta.maxValueLength ?? 80;
  const cell = (d, side) => (Object.hasOwn(d, side) ? code(preview(d[side], maxValueLength)) : EMPTY_CELL);
  const lines = [];

  lines.push(`# ${meta.title ?? 'JSON Diff Report'}`, '');

  const info = [
    sourceRow('JSON 1', meta.left),
    sourceRow('JSON 2', meta.right),
    meta.options?.arrayKey?.length ? `| **Match arrays by** | ${[meta.options.arrayKey].flat().map(code).join(', ')} |` : null,
    meta.options?.ignore?.length ? `| **Ignored paths** | ${[meta.options.ignore].flat().map(code).join(', ')} |` : null,
    meta.generatedAt ? `| **Generated** | ${meta.generatedAt} |` : null,
    meta.durationMs != null ? `| **Compare time** | ${(meta.durationMs / 1000).toFixed(2)} s |` : null,
  ].filter(Boolean);
  if (info.length) lines.push('| | |', '|---|---|', ...info, '');

  if (result.equal) {
    lines.push('> ✅ **No differences found.** The two documents are structurally identical.', '');
    return lines.join('\n');
  }

  const parts = ORDER.filter((t) => stats[t]).map((t) => `${stats[t].toLocaleString('en-US')} ${PHRASES[t]}`);
  lines.push(`> ⚠️ **${plural(stats.total, 'difference')} found** — ${parts.join(', ')}.`, '');

  lines.push('## Summary', '', '| Change | Count |', '|---|---:|');
  for (const t of ORDER) {
    lines.push(`| ${LABELS[t]} | ${stats[t].toLocaleString('en-US')} |`);
  }
  lines.push(`| **Total** | **${stats.total.toLocaleString('en-US')}** |`, '');

  lines.push('### By section', '', '| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |', '|---|---:|---:|---:|---:|---:|');
  for (const [section, c] of sections) {
    lines.push(`| ${code(section)} | ${c.removed} | ${c.changed} | ${c.type_changed} | ${c.added} | **${c.total}** |`);
  }
  lines.push('');

  lines.push('## Details', '');
  lines.push('_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._', '');
  if (truncated) {
    lines.push(
      `> ℹ️ Showing the first ${diffs.length.toLocaleString('en-US')} of ${stats.total.toLocaleString('en-US')} differences. ` +
        'Use `--max-diffs` to show more; the counts above are complete.',
      '',
    );
  }

  const bySection = new Map();
  for (const d of diffs) {
    const s = sectionOf(d.path);
    if (!bySection.has(s)) bySection.set(s, []);
    bySection.get(s).push(d);
  }

  let n = 0;
  for (const [section, items] of bySection) {
    const total = sections.get(section).total;
    const shown = items.length === total ? plural(total, 'difference') : `${items.length} of ${plural(total, 'difference')}`;
    lines.push(`### ${code(section)} — ${shown}`, '');
    lines.push('| # | Change | Path | JSON 1 | JSON 2 |', '|---:|---|---|---|---|');
    for (const d of items) {
      n++;
      lines.push(`| ${n} | ${changeLabel(d)} | ${code(d.path)} | ${cell(d, 'left')} | ${cell(d, 'right')} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const HELP = `Usage: node json-diff.js <json1> <json2> [options]

Compare two JSON files and write the differences as a Markdown report:
keys missing in JSON 2, values that changed, type changes, and keys only in JSON 2.

Options:
  -o, --output <file>         Write the report to a file (default: stdout)
  -k, --key <name>            Match array elements by this key instead of index.
                              Repeat or comma-separate to try several: -k id -k sku
  -i, --ignore <pattern>      Skip a path (and everything under it). Repeatable.
                              Wildcards: * (one key), [*] (one element), ** (any depth)
                              e.g. -i '$.meta.generatedAt' -i '$.items[*].updatedAt'
      --max-diffs <n>         Max differences listed in the report (default 5000).
                              Counts in the summary are always complete.
      --max-value-length <n>  Truncate values in the report to n chars (default 80)
      --fail-on-diff          Exit with code 1 when differences are found (for CI)
  -h, --help                  Show this help

Exit codes: 0 = ran successfully, 1 = differences found (only with --fail-on-diff), 2 = error
`;

function fail(message) {
  process.stderr.write(`json-diff: ${message}\n`);
  process.exit(2);
}

function positiveInt(value, flag) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) fail(`${flag} must be a positive integer, got "${value}"`);
  return n;
}

function readJson(file) {
  let size;
  let text;
  try {
    size = fs.statSync(file).size;
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ERR_STRING_TOO_LONG') {
      fail(`${file} is too large to load as a single string (V8 limit is ~512 MB of text).`);
    }
    fail(`cannot read ${file}: ${err.message}`);
  }
  try {
    return { value: JSON.parse(text), size };
  } catch (err) {
    fail(`invalid JSON in ${file}: ${err.message}`);
  }
}

export function main() {
  let args;
  try {
    args = parseArgs({
      allowPositionals: true,
      options: {
        output: { type: 'string', short: 'o' },
        key: { type: 'string', short: 'k', multiple: true },
        ignore: { type: 'string', short: 'i', multiple: true },
        'max-diffs': { type: 'string' },
        'max-value-length': { type: 'string' },
        'fail-on-diff': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (err) {
    fail(`${err.message}\n\n${HELP}`);
  }

  const { values: opts, positionals } = args;
  if (opts.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  if (positionals.length !== 2) fail(`expected exactly 2 files, got ${positionals.length}\n\n${HELP}`);

  const [leftFile, rightFile] = positionals;
  const options = {
    arrayKey: opts.key ?? [],
    ignore: opts.ignore ?? [],
    maxDiffs: opts['max-diffs'] ? positiveInt(opts['max-diffs'], '--max-diffs') : 5000,
  };
  const maxValueLength = opts['max-value-length'] ? positiveInt(opts['max-value-length'], '--max-value-length') : 80;

  const left = readJson(leftFile);
  const right = readJson(rightFile);

  const started = performance.now();
  const result = compare(left.value, right.value, options);
  const durationMs = performance.now() - started;

  const markdown = renderMarkdown(result, {
    left: { name: leftFile, size: left.size },
    right: { name: rightFile, size: right.size },
    options,
    generatedAt: new Date().toISOString(),
    durationMs,
    maxValueLength,
  });

  const { stats } = result;
  const summary = result.equal
    ? 'no differences'
    : `${stats.total} differences (${stats.removed} missing in JSON 2, ${stats.changed} value changed, ` +
      `${stats.type_changed} type changed, ${stats.added} only in JSON 2)`;

  if (opts.output) {
    fs.writeFileSync(opts.output, markdown);
    process.stderr.write(`${summary} → ${opts.output} (${(durationMs / 1000).toFixed(2)} s)\n`);
  } else {
    process.stdout.write(markdown);
  }

  process.exit(opts['fail-on-diff'] && !result.equal ? 1 : 0);
}

// Run as a CLI only when executed directly, not when imported.
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) main();
