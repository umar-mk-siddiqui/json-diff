# JSON Diff Report — 03-added-removed-keys

| | |
|---|---|
| **JSON 1** | `samples/03-added-removed-keys/left.json` (147 B) |
| **JSON 2** | `samples/03-added-removed-keys/right.json` (205 B) |

> ⚠️ **3 differences found** — 1 missing in JSON 2, 2 only in JSON 2.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 1 |
| ✏️ Value changed | 0 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 2 |
| **Total** | **3** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.phone` | 1 | 0 | 0 | 0 | **1** |
| `$.address` | 0 | 0 | 0 | 1 | **1** |
| `$.preferences` | 0 | 0 | 0 | 1 | **1** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.phone` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ➖ Missing in JSON 2 | `$.phone` | `"+91-9000000001"` | — |

### `$.address` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 2 | ➕ Only in JSON 2 | `$.address.landmark` | — | `"Near MG Road"` |

### `$.preferences` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 3 | ➕ Only in JSON 2 | `$.preferences` | — | `{"newsletter":true,"language":"en"}` |
