'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                      paperless.js                      ┃
// ┃                                                        ┃
// ┃  Thin client for the Paperless Parts public API.       ┃
// ┃  All requests are read-only — no mutations.            ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const config = require('./config');

const BASE = 'https://api.paperlessparts.com';

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                              API calls                                    │
// └───────────────────────────────────────────────────────────────────────────┘

function authHeaders() {
  return { 'Authorization': `API-Token ${config.paperlessKey}` };
}

// ╭──────────────────────────────────────────────────────────────────╮
// │  Fetches all known order numbers and returns the highest one.    │
// │  Called once on first startup to initialize the cursor when no   │
// │  state file exists yet. Starting from the current max means we   │
// │  only process orders that arrive after this deployment.          │
// ╰──────────────────────────────────────────────────────────────────╯
async function getCurrentOrderCursor() {
  const res = await fetch(`${BASE}/orders/public/new`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Paperless getCurrentOrderCursor: HTTP ${res.status}`);
  const orders = await res.json();
  return orders.length ? Math.max(...orders) : 0;
}

// ╭────────────────────────────────────────────────────────────╮
// │  Returns the list of orders newer than 'cursor'.           │
// │  Each entry in the response is an order number             │
// │  passed to getOrder() for the full payload.                │
// ╰────────────────────────────────────────────────────────────╯
async function getNewOrders(cursor) {
  const res = await fetch(`${BASE}/orders/public/new?last_order=${cursor}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Paperless getNewOrders: HTTP ${res.status}`);
  return res.json();
}

// ╭──────────────────────────────────────────────────────────╮
// │  Fetches the full order payload for a given order ref.   │
// ╰──────────────────────────────────────────────────────────╯
async function getOrder(ref) {
  const res = await fetch(`${BASE}/orders/public/${ref}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Paperless getOrder(${ref}): HTTP ${res.status}`);
  return res.json();
}

module.exports = { getCurrentOrderCursor, getNewOrders, getOrder };
