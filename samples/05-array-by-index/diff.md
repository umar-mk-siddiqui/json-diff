# JSON Diff Report — 05-array-by-index

| | |
|---|---|
| **JSON 1** | `samples/05-array-by-index/left.json` (199 B) |
| **JSON 2** | `samples/05-array-by-index/right.json` (196 B) |

> ⚠️ **6 differences found** — 1 missing in JSON 2, 4 value changed, 1 only in JSON 2.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 1 |
| ✏️ Value changed | 4 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 1 |
| **Total** | **6** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.scores` | 0 | 1 | 0 | 1 | **2** |
| `$.matrix` | 0 | 1 | 0 | 0 | **1** |
| `$.steps` | 1 | 1 | 0 | 0 | **2** |
| `$.log` | 0 | 1 | 0 | 0 | **1** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.scores` — 2 differences

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ✏️ Value changed | `$.scores[1]` | `20` | `25` |
| 2 | ➕ Only in JSON 2 | `$.scores[4]` | — | `50` |

### `$.matrix` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 3 | ✏️ Value changed | `$.matrix[1][1]` | `4` | `5` |

### `$.steps` — 2 differences

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 4 | ✏️ Value changed | `$.steps[1]` | `"test"` | `"deploy"` |
| 5 | ➖ Missing in JSON 2 | `$.steps[2]` | `"deploy"` | — |

### `$.log` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 6 | ✏️ Value changed | `$.log[1].level` | `"warn"` | `"error"` |
