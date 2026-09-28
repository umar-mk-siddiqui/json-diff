# JSON Diff Report — 10-realistic-api-response

| | |
|---|---|
| **JSON 1** | `samples/10-realistic-api-response/left.json` (887 B) |
| **JSON 2** | `samples/10-realistic-api-response/right.json` (948 B) |
| **Match arrays by** | `id`, `sku` |

> ⚠️ **9 differences found** — 1 missing in JSON 2, 5 value changed, 3 only in JSON 2.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 1 |
| ✏️ Value changed | 5 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 3 |
| **Total** | **9** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.page` | 0 | 1 | 0 | 0 | **1** |
| `$.orders` | 1 | 4 | 0 | 3 | **8** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.page` — 1 difference

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ✏️ Value changed | `$.page.total` | `42` | `43` |

### `$.orders` — 8 differences

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 2 | ✏️ Value changed | `$.orders[id="ORD-1001"].items[sku="KB-200"].qty` | `1` | `2` |
| 3 | ✏️ Value changed | `$.orders[id="ORD-1001"].total` | `3798` | `6297` |
| 4 | ➕ Only in JSON 2 | `$.orders[id="ORD-1001"].tags[1]` | — | `"gift"` |
| 5 | ✏️ Value changed | `$.orders[id="ORD-1002"].customer.tier` | `"silver"` | `"gold"` |
| 6 | ✏️ Value changed | `$.orders[id="ORD-1002"].status` | `"processing"` | `"shipped"` |
| 7 | ➕ Only in JSON 2 | `$.orders[id="ORD-1002"].shipping` | — | `{"carrier":"BlueDart","awb":"BD123456"}` |
| 8 | ➖ Missing in JSON 2 | `$.orders[id="ORD-1003"]` | `{"id":"ORD-1003","customer":{"id":503,"name":"Meera N","tier":"bronze"},"items"…` | — |
| 9 | ➕ Only in JSON 2 | `$.orders[id="ORD-1004"]` | — | `{"id":"ORD-1004","customer":{"id":504,"name":"John D","tier":"silver"},"items":…` |
