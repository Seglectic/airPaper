# airPaper Upgrade Plan

## Summary

- Current repo state as of May 5, 2026: `dev` is aligned with `master` at `ea04dce`; there is no local `main` ref. The app is a single polling script in `airPaper.js`, backed by `package.json`, `airPaper.service`, `.env.example`, and an untracked `xometry-api-reference.md`.
- Today’s app behavior: poll Paperless for new accepted orders, map each `order_item` into one Airtable record, upload a thumbnail or ITAR placeholder, and persist only the last seen Paperless order number in `latestWO`.
- Current technical issues to document in the README and fix in the upgrade: no tests, no module boundaries, legacy secret-file fallbacks, outdated dependencies (`airtable 0.8.1`, `follow-redirects 1.13.2`, `moment 2.27.0`), and many extraneous packages left over from older Express usage. (`dotenv` is in `package.json` — just run `npm install` if `node_modules` is missing locally.)
- The `imgServe/` folder has been removed; `ITAR.png` now lives in `assets/`.
- The README work should be done first and should include: project purpose, current architecture, deployment model, env/config, Airtable field expectations, known limitations, and a “Planned Upgrade” section describing the phases below.
- Add `AGENTS.md` at repo root to lock working conventions: preserve the existing box-drawing section/comment style, keep modules small, prefer env-based config over local secret files, use non-mutating polling by default, and treat cross-system IDs as first-class data.

## Implementation Parts

### Part 0: Project hygiene and documentation

- Create `README.md` for GitHub with a candid assessment of the current app, branch note (`master`, not `main`), setup steps, runtime behavior, deployment via systemd, and the new roadmap.
- Create `AGENTS.md` with code-style and repo-operating rules that match the existing heading/section style.
- Update `.env.example` to add placeholders only, not secrets: `XOMETRY_API_TOKEN=your-xometry-api-token`, plus new config for Xometry matching and file handling.
- Remove the expectation that real secrets live in git-tracked files; the provided real Xometry token should go only in local `.env`, never in `README.md`, `AGENTS.md`, or `.env.example`.

### Part 1: Refactor the runtime into a small service

- Keep the app in JavaScript, but split the single script into `src/` modules: config, logger, Paperless client, Xometry client, Airtable client, state store, Paperless-to-Airtable workflow, and Xometry-to-Paperless workflow.
- Standardize on Node 20 LTS+ and native `fetch`/`FormData` where possible; remove `moment`, minimize dependency count, and upgrade `airtable` and `follow-redirects` to current stable versions only if still needed after the refactor.
- Replace the single `latestWO` cursor with a persisted state file such as `data/state.json` that tracks:
  - last seen Paperless order number
  - processed Paperless order-item IDs
  - last seen Xometry job/offer cursor
  - Xometry-to-Paperless correlation records
  - failed handoff queue entries
- Keep the existing daemon model and `npm start` entrypoint; do not introduce public webhook infrastructure in this upgrade.

### Part 2: Harden the existing Paperless -> Airtable flow

- Preserve the current functional output, but make it idempotent: repeated polls must not create duplicate Airtable rows or duplicate attachment uploads.
- Keep the current `Picture` upload behavior, and add support for the existing `Part Documents` attachment field for non-image files where applicable.
- Validate env at startup and fail fast with clear messages instead of partial startup.
- Keep legacy Paperless/Airtable key-file fallback only as an explicitly deprecated compatibility path for one release, then remove it.
- Add structured logging around polling, record creation, attachment upload, retries, and skipped duplicates.

### Part 3: Xometry accepted job -> Paperless quote intake *(deferred)*

> Deferred until the Paperless quote-creation API surface is clarified. The Smart RFQ intake is an iframe at `rfq.digital-quote.com` and Paperless does not clearly expose quote creation in its API. This phase will be scoped once that is resolved. The cross-reference convention (`erp_code = xometry:{jobId}`) remains the target join key when the phase is implemented.

### Part 4: Paperless order -> Xometry enrichment -> Airtable

- When a new Paperless order arrives through the normal workflow, treat it as Xometry if the normalized customer/company name matches the configured heuristic set, defaulting to `Xometry`.
- Resolve the exact Xometry job via the stored correlation record first; if missing, fall back to the `quote_erp_code` convention `xometry:{jobId}` before using any looser heuristics.
- Pull the Xometry files that matter for production records and attach them to Airtable’s existing `Part Documents` field, while continuing to use `Picture` for thumbnails/previews.
- Extend Airtable field mapping to store Xometry metadata that will help operations: Xometry Job ID, source marker, material, finish, quantity, due date, and any available PO/reference values.

## Public Interfaces and Config

- Add env vars: `XOMETRY_API_TOKEN`, `XOMETRY_CUSTOMER_NAME_MATCHES`, `PART_DOCUMENTS_FIELD`, `STATE_FILE_PATH`, and optional polling interval vars separated by source.
- Keep existing env vars: `PAPERLESS_KEY`, `AIRTABLE_KEY`, `AIRTABLE_BASE_ID`, `ACTIVE_TABLE`, `UPDATE_INTERVAL`, `DEBUG`.
- Adopt a single internal correlation contract: `Paperless quote/order erp_code` or `quote_erp_code` stores `xometry:{jobId}`.
- Preserve Airtable table compatibility by defaulting to existing fields `Picture` and `Part Documents`; any new fields must be optional and documented in the README.

## Test Plan

- Unit tests for Paperless order-item mapping, Xometry job normalization, customer-name matching, and cross-system ID parsing.
- Integration tests covering:
  - new Paperless order creates one Airtable row per order item
  - rerun of the same poll creates no duplicates
  - Paperless order matched as Xometry enriches Airtable `Part Documents`
  - attachment oversize, missing files, and 4xx/5xx API errors are retried or dead-lettered correctly
- A smoke test for startup config validation and state-file resume behavior after restart.

## Assumptions and Defaults

- Default implementation stays as a headless poller/service, not a public webhook receiver.
- Default Xometry match rule is a configured name heuristic (`XOMETRY_CUSTOMER_NAME_MATCHES`). Since Xometry orders are created programmatically by this same app with a consistent customer name, a name match is reliable.
- Default no-browser rule is enforced for any future quote-submission automation.
- Sources used for the plan: the local repo files, the bundled Paperless OpenAPI in this repo, and current Xometry reference pages for jobs/offers/webhooks.
