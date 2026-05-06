'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                      airtable.js                       ┃
// ┃                                                        ┃
// ┃  Airtable REST client — record creation, patching,     ┃
// ┃  lookup, and the direct attachment upload API.         ┃
// ┃  Uses native fetch; no airtable npm package needed.    ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const fs = require('fs');
const zlib = require('zlib');
const config = require('./config');

const API_BASE     = `https://api.airtable.com/v0/${config.airtableBaseId}`;
const CONTENT_BASE = `https://content.airtable.com/v0/${config.airtableBaseId}`;

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Helper functions                                  │
// └───────────────────────────────────────────────────────────────────────────┘

function authHeaders() {
  return {
    'Authorization': `Bearer ${config.airtableKey}`,
    'Content-Type':  'application/json',
  };
}

function tableUrl() {
  return `${API_BASE}/${encodeURIComponent(config.activeTable)}`;
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          Record operations                                │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭──────────────────────────────────────────────────────────────╮
// │  Creates a new Airtable record and returns the raw record    │
// │  response (includes .id for follow-up attachment uploads).   │
// ╰──────────────────────────────────────────────────────────────╯
async function createRecord(fields) {
  const res = await fetch(tableUrl(), {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable createRecord: ${res.status} ${text}`);
  }
  return res.json();
}

// ╭──────────────────────────────────────────────────────────╮
// │  Patches an existing record with a partial fields object. │
// │  Used to attach Xometry metadata after record creation.  │
// ╰──────────────────────────────────────────────────────────╯
async function patchRecord(recordId, fields) {
  const res = await fetch(`${tableUrl()}/${recordId}`, {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable patchRecord(${recordId}): ${res.status} ${text}`);
  }
  return res.json();
}

// ╭────────────────────────────────────────────────────────────╮
// │  Looks up a record by its Paperless order item ID.         │
// │  Returns the first matching record or null.                │
// ╰────────────────────────────────────────────────────────────╯
async function findByPaperlessItemId(itemId) {
  const formula = encodeURIComponent(`{Paperless ID#}=${itemId}`);
  const res = await fetch(`${tableUrl()}?filterByFormula=${formula}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Airtable findByPaperlessItemId: ${res.status}`);
  const body = await res.json();
  return body.records[0] || null;
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                        Attachment handling                                │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭──────────────────────────────────────────────────────────────────╮
// │  Loads an attachment into memory as a Buffer.                    │
// │  Accepts either a local path (ITAR placeholder) or a remote URL  │
// │  (Paperless thumbnail). Decompresses gzip if present, since      │
// │  Paperless thumbnails have historically arrived compressed.      │
// ╰──────────────────────────────────────────────────────────────────╯
async function loadBuffer(attachment) {
  if (attachment.path) {
    return fs.readFileSync(attachment.path);
  }
  const res = await fetch(attachment.url);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());
  return new Promise(resolve => {
    zlib.gunzip(raw, (err, unzipped) => resolve(err ? raw : unzipped));
  });
}

// ╭──────────────────────────────────────────────────────────────────────╮
// │  Uploads a buffer to Airtable's direct attachment API.               │
// │  Works for any attachment field — pass the field name in fieldName.  │
// │  Airtable's direct upload cap is 5 MB; throws for larger buffers.   │
// ╰──────────────────────────────────────────────────────────────────────╯
async function uploadAttachment(recordId, fieldName, filename, contentType, buffer) {
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error(`${filename} exceeds the 5 MB Airtable direct-upload limit`);
  }
  const res = await fetch(
    `${CONTENT_BASE}/${recordId}/${encodeURIComponent(fieldName)}/uploadAttachment`,
    {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ contentType, filename, file: buffer.toString('base64') }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable uploadAttachment(${filename}): ${res.status} ${text}`);
  }
}

module.exports = { createRecord, patchRecord, findByPaperlessItemId, uploadAttachment, loadBuffer };
