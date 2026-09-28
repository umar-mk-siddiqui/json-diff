# JSON Diff Report — 06-array-by-key

| | |
|---|---|
| **JSON 1** | `samples/06-array-by-key/left.json` (289 B) |
| **JSON 2** | `samples/06-array-by-key/right.json` (288 B) |
| **Match arrays by** | `id` |

> ⚠️ **4 differences found** — 1 missing in JSON 2, 2 value changed, 1 only in JSON 2.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 1 |
| ✏️ Value changed | 2 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 1 |
| **Total** | **4** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.users` | 1 | 2 | 0 | 1 | **4** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.users` — 4 differences

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ➖ Missing in JSON 2 | `$.users[id=2]` | `{"id":2,"name":"Ravi","role":"editor","active":true}` | — |
| 2 | ✏️ Value changed | `$.users[id=3].role` | `"viewer"` | `"editor"` |
| 3 | ✏️ Value changed | `$.users[id=3].active` | `false` | `true` |
| 4 | ➕ Only in JSON 2 | `$.users[id=5]` | — | `{"id":5,"name":"Sara","role":"viewer","active":true}` |
