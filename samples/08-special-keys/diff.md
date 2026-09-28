# JSON Diff Report — 08-special-keys

| | |
|---|---|
| **JSON 1** | `samples/08-special-keys/left.json` (194 B) |
| **JSON 2** | `samples/08-special-keys/right.json` (206 B) |

> ⚠️ **9 differences found** — 9 value changed.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 0 |
| ✏️ Value changed | 9 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 0 |
| **Total** | **9** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$["123"]` | 0 | 1 | 0 | 0 | **1** |
| `$["first name"]` | 0 | 1 | 0 | 0 | **1** |
| `$["a.b"]` | 0 | 1 | 0 | 0 | **1** |
| `$[""]` | 0 | 1 | 0 | 0 | **1** |
| `$["naïve"]` | 0 | 1 | 0 | 0 | **1** |
| `$["pipe\|key"]` | 0 | 1 | 0 | 0 | **1** |
| `$["quote\"key"]` | 0 | 1 | 0 | 0 | **1** |
| `$.tick` | 0 | 1 | 0 | 0 | **1** |
| `$.multi` | 0 | 1 | 0 | 0 | **1** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$["123"]` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ✏️ Value changed | `$["123"]` | `"numeric key"` | `"changed"` |

### `$["first name"]` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 2 | ✏️ Value changed | `$["first name"]` | `"Asha"` | `"Asha K"` |

### `$["a.b"]` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 3 | ✏️ Value changed | `$["a.b"]` | `1` | `2` |

### `$[""]` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 4 | ✏️ Value changed | `$[""]` | `"empty key"` | `"still empty"` |

### `$["naïve"]` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 5 | ✏️ Value changed | `$["naïve"]` | `"x"` | `"y"` |

### `$["pipe\|key"]` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 6 | ✏️ Value changed | `$["pipe\|key"]` | `"a\|b"` | `"a\|b\|c"` |

### `$["quote\"key"]` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 7 | ✏️ Value changed | `$["quote\"key"]` | `1` | `2` |

### `$.tick` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 8 | ✏️ Value changed | `$.tick` | `` "use `npm test`" `` | `` "use `node --test`" `` |

### `$.multi` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 9 | ✏️ Value changed | `$.multi` | `"line1\nline2"` | `"line1\nline2\nline3"` |
