'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                        config.js                       ┃
// ┃                                                        ┃
// ┃  Loads env vars, validates required ones at startup,   ┃
// ┃  and exports a single frozen config object.            ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

require('dotenv').config();

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Startup validation                                │
// └───────────────────────────────────────────────────────────────────────────┘

const REQUIRED = ['PAPERLESS_KEY', 'AIRTABLE_KEY', 'AIRTABLE_BASE_ID'];

const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Startup failed — missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                              Config export                                │
// └───────────────────────────────────────────────────────────────────────────┘

module.exports = {
  version:             '2.0.0',
  paperlessKey:        process.env.PAPERLESS_KEY,
  airtableKey:         process.env.AIRTABLE_KEY,
  airtableBaseId:      process.env.AIRTABLE_BASE_ID,
  testing:             process.env.TESTING === 'true',
  activeTable:         process.env.TESTING === 'true'
                         ? (process.env.TEST_TABLE || 'Paperless Work Orders')
                         : (process.env.ACTIVE_TABLE || 'Work Orders'),
  updateInterval:      Number(process.env.UPDATE_INTERVAL || 120000),
  xometryApiToken:     process.env.XOMETRY_API_TOKEN || null,
  xometryNameMatches:  (process.env.XOMETRY_CUSTOMER_NAME_MATCHES || 'Xometry')
                         .split(',').map(s => s.trim().toLowerCase()),
  partDocumentsField:  process.env.PART_DOCUMENTS_FIELD || 'Part Documents',
  stateFilePath:       process.env.STATE_FILE_PATH || './data/state.json',
};
