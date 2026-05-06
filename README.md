# airPaper

Polls [Paperless Parts](https://www.paperlessparts.com/) for accepted orders and creates a work order record in Airtable for each order line item. Optionally enriches Xometry-sourced orders with job files and metadata from the Xometry API.

> **Branch note:** the default branch is `master`, not `main`.

---

## How it works

1. On a configurable interval, airPaper calls the Paperless Parts API for orders newer than the last seen cursor.
2. Each `order_item` in a new order becomes one Airtable record with mapped fields (part name, client, PO, due date, material, finish, etc.).
3. A thumbnail is fetched from Paperless and uploaded to the `Picture` field. ITAR-flagged parts get a local placeholder image instead.
4. If `XOMETRY_API_TOKEN` is set and the customer name matches the configured heuristic, airPaper fetches the corresponding Xometry job (resolved via `erp_code`) and uploads the traveler and redacted drawings to the `Part Documents` field.
5. A state file (`data/state.json`) tracks the order cursor and processed item IDs, so repeated polls never create duplicates.

---

## Setup

### Prerequisites

- Node 20 LTS or later (tested on Node 22)
- A Paperless Parts API token
- An Airtable personal access token and base ID
- (Optional) A Xometry API token with `job:read` scope

### Install

```bash
git clone https://github.com/Seglectic/airPaper
cd airPaper
cp .env.example .env   # fill in your real values
npm install
npm start
```

### Airtable table requirements

The target table (default: `Work Orders`) must have these fields:

| Field            | Type        | Notes                                  |
|------------------|-------------|----------------------------------------|
| Paperless ID#    | Number      | Used as the idempotency key            |
| Part             | Single line |                                        |
| Status           | Single line | Set to "PO Received" on creation       |
| Qty Ordered      | Number      |                                        |
| Due Date         | Date        |                                        |
| Client           | Single line |                                        |
| Purchase Order   | Single line |                                        |
| Notes            | Long text   |                                        |
| Stock Status     | Single line |                                        |
| Tooling Status   | Single line |                                        |
| Picture          | Attachment  |                                        |
| Finish           | Single line |                                        |
| Material         | Single line |                                        |
| PP Part Link     | URL         |                                        |
| STEP File        | URL         |                                        |
| Part Documents   | Attachment  | Optional — Xometry files uploaded here |

Optional Xometry metadata fields (create these if you use Xometry enrichment):

| Field          | Type        |
|----------------|-------------|
| Xometry Job ID | Single line |
| Source         | Single line |

---

## Configuration

All config is via environment variables. See `.env.example` for the full list with descriptions.

| Variable                       | Required | Default          | Description                                             |
|--------------------------------|----------|------------------|---------------------------------------------------------|
| `PAPERLESS_KEY`                | Yes      |                  | Paperless Parts API token                               |
| `AIRTABLE_KEY`                 | Yes      |                  | Airtable personal access token                          |
| `AIRTABLE_BASE_ID`             | Yes      |                  | Airtable base ID (starts with `app`)                    |
| `ACTIVE_TABLE`                 | No       | `Work Orders`    | Airtable table name                                     |
| `PART_DOCUMENTS_FIELD`         | No       | `Part Documents` | Attachment field for production files                   |
| `UPDATE_INTERVAL`              | No       | `120000`         | Poll interval in milliseconds                           |
| `DEBUG`                        | No       | `false`          | Freeze the order cursor (don't advance)                 |
| `XOMETRY_API_TOKEN`            | No       |                  | Enables Xometry enrichment when set                     |
| `XOMETRY_CUSTOMER_NAME_MATCHES`| No       | `Xometry`        | Comma-separated client name substrings for Xometry match|
| `STATE_FILE_PATH`              | No       | `./data/state.json` | State file location                                  |

---

## Deployment (systemd)

A `airPaper.service` unit file is included. Copy it to `/etc/systemd/system/`, put the app at `/opt/airPaper`, copy your `.env` there, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now airPaper
journalctl -u airPaper -f
```

---

## Known limitations

- Single-threaded poller — errors on one order don't block subsequent orders, but the poll interval must complete before the next run starts.
- Airtable direct-upload API caps attachments at 5 MB. Xometry STEP files larger than that are skipped with a log message.
- Xometry enrichment requires the Paperless order's `erp_code` field to contain `xometry:{jobId}` — this is set manually or programmatically after quote creation (see roadmap below).
- No retry backoff — transient API errors are logged but not retried until the next poll interval.

---

## Roadmap

### Part 3: Xometry job → Paperless quote intake *(deferred)*

Automatically create a Paperless Parts quote from an accepted Xometry job. Blocked on clarifying whether the Paperless quote-creation endpoint is available via API. The canonical join key (`erp_code = xometry:{jobId}`) is already in place for when this ships.

### Tests

Unit and integration tests for the order-item mapper, state store, and idempotency guard are planned but not yet implemented.
