# JSON Diff Report — 02-scalar-changes

| | |
|---|---|
| **JSON 1** | `samples/02-scalar-changes/left.json` (146 B) |
| **JSON 2** | `samples/02-scalar-changes/right.json` (151 B) |

> ⚠️ **4 differences found** — 4 value changed.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 0 |
| ✏️ Value changed | 4 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 0 |
| **Total** | **4** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.price` | 0 | 1 | 0 | 0 | **1** |
| `$.inStock` | 0 | 1 | 0 | 0 | **1** |
| `$.color` | 0 | 1 | 0 | 0 | **1** |
| `$.rating` | 0 | 1 | 0 | 0 | **1** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.price` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ✏️ Value changed | `$.price` | `1299` | `1499` |

### `$.inStock` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 2 | ✏️ Value changed | `$.inStock` | `true` | `false` |

### `$.color` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 3 | ✏️ Value changed | `$.color` | `"Black"` | `"Graphite"` |

### `$.rating` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 4 | ✏️ Value changed | `$.rating` | `4.5` | `4.55` |
