# AGENTS.md — airPaper working conventions

This file locks the conventions for code style, module structure, and operational behavior. Follow these rules when adding or modifying code in this repo.

---

## Comment and section style

Preserve the existing box-drawing comment style throughout the codebase. Use these patterns consistently:

**Top-level section separators** (file-level groupings):
```
// ┌───────────────────────────────────────────────────────────────────────────┐
// │                               Section Name                                │
// └───────────────────────────────────────────────────────────────────────────┘
```

**Startup/title banners** (top of a file or major module):
```
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃          Module Name              ┃
// ┃  Short description of purpose.   ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Function descriptions** (above non-trivial functions):
```
// ╭──────────────────────────────────────╮
// │  What this function does and why.    │
// ╰──────────────────────────────────────╯
```

**Named sections** (for collapsible regions in editors):
```javascript
// ╭────────────────────────────────────────╮
// │   //SECTION functionName()             │
// │   One-line description                 │
// ╰────────────────────────────────────────╯
function functionName() { ... }
//!SECTION
```

Only comment the **why**, not the **what** — well-named identifiers carry the what.

---

## Module structure

- Keep `src/` modules small and single-purpose. One external system per file (`paperless.js`, `xometry.js`, `airtable.js`).
- Workflows live in `src/workflow-*.js` and orchestrate across clients. They do not reach into each other except through exported functions.
- `index.js` is the entry point only — it sets up the poll loop and loads the top-level modules. No business logic here.
- `src/config.js` is loaded by every module that needs env values. It validates required vars at startup and exits immediately on failure.
- `src/state.js` owns all reads and writes to `data/state.json`. No other module should touch that file directly.

---

## Config and secrets

- All runtime configuration lives in env vars, loaded via `.env` (gitignored). Never hard-code secrets or base IDs.
- `.env.example` contains placeholder values only — no real tokens.
- Real tokens go in local `.env`, never in code, READMEs, or commit messages.
- The app fails fast at startup if required vars are missing.

---

## Polling and idempotency

- The default mode is non-mutating polling. Calls to external APIs should read or create, never mutate, unless the specific feature explicitly requires it (e.g., patching Airtable Xometry metadata).
- Every Paperless order item ID is stored in `state.processedOrderItemIds` before any side-effectful work after it. Repeated polls must never create duplicate Airtable rows.
- The order cursor advances per order, not per batch, so a crash mid-batch doesn't lose or replay an entire page of orders.

---

## Cross-system IDs

Treat cross-system identifiers as first-class data, not incidental strings.

- The canonical join key between Paperless and Xometry is `erp_code = xometry:{jobId}` on the Paperless order.
- Xometry enrichment correlations are stored in `state.xometryCorrelations` keyed by `xometry:{jobId}`.
- Never derive a cross-system ID from heuristics (name matching, date proximity, etc.) when a stored correlation is available.

---

## Dependencies

- Prefer native Node APIs (`fetch`, `fs`, `zlib`) over npm packages.
- The only runtime dependency is `dotenv`. Do not add new dependencies without a clear reason.
- Node 20 LTS is the minimum target. Node 22 is the current runtime.

---

## No browser automation

Automating browser sessions or headless browsers to submit forms is prohibited. If a desired action cannot be done through a documented HTTP API, stop at a logged, human-readable handoff record instead.
