# JSON Diff Report — 07-deeply-nested

| | |
|---|---|
| **JSON 1** | `samples/07-deeply-nested/left.json` (465 B) |
| **JSON 2** | `samples/07-deeply-nested/right.json` (481 B) |

> ⚠️ **4 differences found** — 3 value changed, 1 only in JSON 2.

## Summary

| Change | Count |
|---|---:|
| ➖ Missing in JSON 2 | 0 |
| ✏️ Value changed | 3 |
| 🔀 Type changed | 0 |
| ➕ Only in JSON 2 | 1 |
| **Total** | **4** |

### By section

| Section | ➖ Missing | ✏️ Changed | 🔀 Type | ➕ Only in 2 | Total |
|---|---:|---:|---:|---:|---:|
| `$.app` | 0 | 3 | 0 | 1 | **4** |

## Details

_**JSON 1** = first file, **JSON 2** = second file. `—` means the key is absent on that side. Long values are truncated with `…`._

### `$.app` — 4 differences

| # | Change | Path | JSON 1 | JSON 2 |
|---:|---|---|---|---|
| 1 | ✏️ Value changed | `$.app.services.api.http.server.tls.cipher` | `"TLS_AES_128_GCM_SHA256"` | `"TLS_AES_256_GCM_SHA384"` |
| 2 | ✏️ Value changed | `$.app.services.api.http.server.tls.cert.expiresOn` | `"2026-12-31"` | `"2027-12-31"` |
| 3 | ✏️ Value changed | `$.app.services.worker.queue.retry.max` | `3` | `5` |
| 4 | ➕ Only in JSON 2 | `$.app.services.worker.queue.retry.backoff.jitter` | — | `true` |
