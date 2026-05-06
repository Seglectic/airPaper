'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                       xometry.js                       ┃
// ┃                                                        ┃
// ┃  Thin client for the Xometry supplier API.             ┃
// ┃  All functions return null / [] when no token is set   ┃
// ┃  so callers don't need to check config themselves.     ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const config = require('./config');

const BASE = 'https://api.developer.xometry.com';

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                              API calls                                    │
// └───────────────────────────────────────────────────────────────────────────┘

function authHeaders() {
  return {
    'X-Api-Key':    config.xometryApiToken,
    'Content-Type': 'application/json',
  };
}

// ╭──────────────────────────────────────────────────────────────────╮
// │  Returns a page of jobs filtered by status (default: progress).  │
// │  Returns an empty array if no Xometry token is configured.       │
// ╰──────────────────────────────────────────────────────────────────╯
async function getJobs({ statuses = 'progress', page = 1, pageSize = 50 } = {}) {
  if (!config.xometryApiToken) return [];
  const params = new URLSearchParams({ statuses, page, pageSize });
  const res = await fetch(`${BASE}/v0/jobs/?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Xometry getJobs: HTTP ${res.status}`);
  const body = await res.json();
  return body.data.jobs;
}

// ╭───────────────────────────────────────────────────────────────────╮
// │  Fetches a single Xometry job by ID or GUID.                      │
// │  Returns null if no Xometry token is configured.                  │
// ╰───────────────────────────────────────────────────────────────────╯
async function getJob(id) {
  if (!config.xometryApiToken) return null;
  const res = await fetch(`${BASE}/v0/jobs/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Xometry getJob(${id}): HTTP ${res.status}`);
  const body = await res.json();
  return body.data.job;
}

// ╭──────────────────────────────────────────────────────────╮
// │  Downloads a Xometry file by URL and returns it as a     │
// │  Buffer. Used for traveler and redacted-drawing files.   │
// ╰──────────────────────────────────────────────────────────╯
async function downloadFile(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Xometry file download: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = { getJobs, getJob, downloadFile };
