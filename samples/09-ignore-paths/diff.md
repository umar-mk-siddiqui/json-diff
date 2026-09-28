# JSON Diff Report — 09-ignore-paths

| | |
|---|---|
| **JSON 1** | `samples/09-ignore-paths/left.json` (221 B) |
| **JSON 2** | `samples/09-ignore-paths/right.json` (221 B) |
| **Match arrays by** | `id` |
| **Ignored paths** | `$.meta.generatedAt`, `$.meta.requestId`, `$.items[*].updatedAt` |

> ⚠️ **2 differences found** — 2 value changed.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 0 |
| ✏️ Value changed | 2 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 0 |
| **Total** | **2** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.meta` | 0 | 1 | 0 | 0 | **1** |
| `$.items` | 0 | 1 | 0 | 0 | **1** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.meta` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ✏️ Value changed | `$.meta.version` | `"1.0"` | `"1.1"` |

### `$.items` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 2 | ✏️ Value changed | `$.items[id=1].qty` | `2` | `3` |
