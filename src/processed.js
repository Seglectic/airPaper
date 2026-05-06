'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                      processed.js                      ┃
// ┃                                                        ┃
// ┃  Tracks processed Paperless order item IDs to prevent  ┃
// ┃  duplicate Airtable rows across restarts.              ┃
// ┃                                                        ┃
// ┃  Persisted as NDJSON (one record per line) so the log  ┃
// ┃  is append-only and human-readable. Loaded into a Set  ┃
// ┃  at startup for O(1) duplicate checks during polling.  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const fs = require('fs');
const path = require('path');
const config = require('./config');

const FILE = './data/processed.ndjson';

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          Startup — load from disk                         │
// └───────────────────────────────────────────────────────────────────────────┘

const processedIds = new Set();

function load() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) return;

  const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      processedIds.add(JSON.parse(line).id);
    } catch { /* skip malformed lines */ }
  }
}

load();

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          Public interface                                 │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭──────────────────────────────────────────────────────╮
// │  Returns true if this order item ID has already been │
// │  processed in a previous or current run.             │
// ╰──────────────────────────────────────────────────────╯
function has(id) {
  return processedIds.has(String(id));
}

// ╭─────────────────────────────────────────────────────────────╮
// │  Marks an order item ID as processed. Updates the in-memory │
// │  set immediately and appends a line to the NDJSON log unless │
// │  running in testing mode.                                    │
// ╰─────────────────────────────────────────────────────────────╯
function add(id) {
  const strId = String(id);
  processedIds.add(strId);
  if (!config.testing) {
    const entry = JSON.stringify({ id: strId, ts: new Date().toISOString() });
    fs.appendFileSync(FILE, entry + '\n');
  }
}

module.exports = { has, add };
