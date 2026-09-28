# JSON Diff Report — 04-type-changes

| | |
|---|---|
| **JSON 1** | `samples/04-type-changes/left.json` (122 B) |
| **JSON 2** | `samples/04-type-changes/right.json` (147 B) |

> ⚠️ **6 differences found** — 6 type changed.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 0 |
| ✏️ Value changed | 0 |
| 🔀 Type changed | 6 |
| ➕ Only in JSON 2 | 0 |
| **Total** | **6** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.count` | 0 | 0 | 1 | 0 | **1** |
| `$.enabled` | 0 | 0 | 1 | 0 | **1** |
| `$.tags` | 0 | 0 | 1 | 0 | **1** |
| `$.meta` | 0 | 0 | 1 | 0 | **1** |
| `$.limits` | 0 | 0 | 1 | 0 | **1** |
| `$.owner` | 0 | 0 | 1 | 0 | **1** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.count` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | 🔀 string → number | `$.count` | `"42"` | `42` |

### `$.enabled` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 2 | 🔀 string → boolean | `$.enabled` | `"true"` | `true` |

### `$.tags` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 3 | 🔀 string → array | `$.tags` | `"a,b,c"` | `["a","b","c"]` |

### `$.meta` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 4 | 🔀 null → object | `$.meta` | `null` | `{"source":"api"}` |

### `$.limits` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 5 | 🔀 array → object | `$.limits` | `[10,20]` | `{"min":10,"max":20}` |

### `$.owner` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 6 | 🔀 object → number | `$.owner` | `{"id":7}` | `7` |
