# json-diff

Compare two similar JSON files and get the differences as a readable **Markdown report**.
The tool is a single file with zero dependencies. It needs Node.js 20 or newer and handles large files (1M records / 229 MB per file in about 6 s).

For every path it reports:

| Label | Meaning |
|---|---|
| ➖ **Missing in JSON 2** | key (or array element) exists in JSON 1 but not in JSON 2 |
| ✏️ **Value changed** | key exists in both, same type, different value |
| 🔀 **Type changed** | key exists in both, different JSON type (`"42"` vs `42`, `null` vs `{}`) |
| ➕ **Only in JSON 2** | key exists in JSON 2 but not in JSON 1 |

Key order inside objects is ignored. Nested objects and arrays are compared all the way down.

## Usage

```bash
node json-diff.js one.json two.json -o diff.md
```

```
Options:
  -o, --output <file>         Write the report to a file (default: stdout)
  -k, --key <name>            Match array elements by this key instead of index.
                              Repeat or comma-separate to try several: -k id -k sku
  -i, --ignore <pattern>      Skip a path (and everything under it). Repeatable.
                              Wildcards: * (one key), [*] (one element), ** (any depth)
      --max-diffs <n>         Max differences listed in the report (default 5000).
                              Counts in the summary are always complete.
      --max-value-length <n>  Truncate values in the report to n chars (default 80)
      --fail-on-diff          Exit with code 1 when differences are found (for CI)
```

Examples:

```bash
# Arrays of records: match by id so reordering doesn't count as a change
node json-diff.js old.json new.json -k id -o diff.md

# Different id field per array: the first key that uniquely identifies every element wins
node json-diff.js old.json new.json -k id -k sku -o diff.md

# Ignore volatile fields
node json-diff.js a.json b.json -i '$.meta.generatedAt' -i '$.items[*].updatedAt' -i '$.**.traceId'
```

### Why `--key` matters for arrays

By default, arrays are compared **by position**. If one element is inserted near the start, every element after it shifts, and every one of them shows up as changed.
If your arrays hold records with an identifier, pass `-k <field>`. Elements are then matched by that field, paths look like `$.users[id=42].email`, and reordering is not a difference.
If the key is missing on some element, is duplicated, or is not a string/number/boolean, that array falls back to index comparison.

## Report layout

1. Header: the two files, their sizes, and the options used
2. One-line verdict: `⚠️ 9 differences found — 1 missing in JSON 2, 5 value changed, …`
3. **Summary**: counts per change type, then counts per top-level section
4. **Details**: one table per top-level section, in document order: `# | Change | Path | JSON 1 | JSON 2`

Paths use JSONPath-style notation: `$.orders[id="ORD-1001"].items[sku="KB-200"].qty`, `$["key with spaces"]`, `$.list[3]`.

## Use as a module

```js
import { compare, diff, renderMarkdown } from './json-diff.js';

const result = compare(json1, json2, { arrayKey: ['id'], ignore: ['$.meta.*'] });
result.stats;        // { removed, changed, type_changed, added, total }
result.diffs;        // [{ type, path, left, right }, ...]
renderMarkdown(result, { left: { name: 'one.json' }, right: { name: 'two.json' } });

for (const d of diff(json1, json2)) { /* lazy generator, document order */ }
```

## Large files

- The comparison uses an explicit stack instead of recursion, so very deep nesting (100k+ levels) is fine.
- Values in the report are previewed with a character budget, so a huge missing subtree does not get fully serialised.
- `--max-diffs` limits the size of the report and the memory it uses. The summary counts are always exact.
- Both files are loaded into memory: expect about 4× the combined file size in RAM. For inputs of several hundred MB, raise the heap limit:
  `node --max-old-space-size=8192 json-diff.js a.json b.json -o diff.md`
- A single file must be under about 512 MB, which is V8's maximum string length. Above that the tool stops with a clear error.

## Development (full project, not the gist)

```
json-diff.js               the tool (this is what goes in the gist)
samples/NN-*/              hand-written pairs: left.json, right.json, optional options.json, and the generated diff.md
scripts/samples.js         regenerates every samples/<name>/diff.md
scripts/generate-large.js  generates big test files with a known number of differences
test/                      node:test suites (unit, report, CLI, samples snapshot, 200k-record run)
```

```bash
npm test                                   # all tests
npm run samples                            # rebuild the sample reports after changing the output format
node scripts/generate-large.js 1000000 /tmp/big && \
  node json-diff.js /tmp/big/left.json /tmp/big/right.json -k id -o /tmp/big/diff.md
```
