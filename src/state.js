'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                        state.js                        ┃
// ┃                                                        ┃
// ┃  Loads and saves persistent state from data/state.json ┃
// ┃  Migrates the legacy single-cursor 'latestWO' file     ┃
// ┃  on first run if the new state file doesn't exist.     ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const fs = require('fs');
const path = require('path');
const config = require('./config');

const STATE_FILE = config.stateFilePath;

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                           Default state shape                             │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭─────────────────────────────────────────────────────────────────╮
// │  Returns a fresh default state object.                          │
// │  latestPaperlessOrder starts as null — index.js will call the  │
// │  Paperless API to initialize it on the very first run.         │
// ╰─────────────────────────────────────────────────────────────────╯
function defaultState() {
  return {
    latestPaperlessOrder: null,  // Initialized from live API on first run
    xometryCorrelations:  {},    // { 'xometry:{jobId}': { airtableRecordId, paperlessOrderItemId } }
    failedQueue:          [],    // Items that errored and were not retried
  };
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          Load / Save                                      │
// └───────────────────────────────────────────────────────────────────────────┘

function ensureDir() {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ╭──────────────────────────────────────────────────────────╮
// │  Reads state.json and merges it over the default shape.  │
// │  Falls back to defaults if the file is missing or bad.   │
// ╰──────────────────────────────────────────────────────────╯
function load() {
  ensureDir();
  try {
    if (fs.existsSync(STATE_FILE)) {
      return { ...defaultState(), ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
    }
  } catch (e) {
    console.error(`State file read error: ${e.message} — using defaults`);
  }
  return defaultState();
}

// ╭─────────────────────────────────────────────────────────╮
// │  Writes the current state object to disk as JSON.       │
// │  Errors are logged but never thrown — a failed save     │
// │  should not crash the poller loop.                      │
// ╰─────────────────────────────────────────────────────────╯
function save(appState) {
  ensureDir();
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(appState, null, 2));
  } catch (e) {
    console.error(`State file write error: ${e.message}`);
  }
}

module.exports = { load, save };
