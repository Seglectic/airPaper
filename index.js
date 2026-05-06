'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                                                        ┃
// ┃                        airPaper                        ┃
// ┃                                                        ┃
// ┃  Scans Paperless Parts and imports data into Airtable  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const { log } = require('./src/logger');
const config = require('./src/config');
const stateStore = require('./src/state');
const paperless = require('./src/paperless');
const { processPaperlessOrder } = require('./src/workflow-paperless');

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                               Startup                                    │
// └───────────────────────────────────────────────────────────────────────────┘

const appState = stateStore.load();

log(`AirPaper v${config.version}`);
if (config.testing) log(`Testing mode active — using table "${config.activeTable}", cursor will not advance`);
log(config.xometryApiToken
  ? 'Xometry token present — enrichment enabled'
  : 'No XOMETRY_API_TOKEN set — Xometry enrichment disabled'
);

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          Paperless poller                                 │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭────────────────────────────────────────────╮
// │   //SECTION pollPaperless()                │
// │                                            │
// │  Checks for new Paperless orders and runs  │
// │  processPaperlessOrder for each one found. │
// ╰────────────────────────────────────────────╯
async function pollPaperless() {
  try {
    const newOrders = await paperless.getNewOrders(appState.latestPaperlessOrder);
    if (!Array.isArray(newOrders) || newOrders.length === 0) return;

    const count = newOrders.length;
    log(`${count} new order${count !== 1 ? 's' : ''}!`);

    for (const orderRef of newOrders) {
      try {
        const orderData = await paperless.getOrder(orderRef);
        await processPaperlessOrder(orderData, appState);
      } catch (err) {
        log(`Order ${orderRef} failed: ${err.message}`);
      }

      if (!config.testing) {
        appState.latestPaperlessOrder++;
        stateStore.save(appState);
      }
    }
  } catch (err) {
    log(`Paperless poll error: ${err.message}`);
  }
}
//!SECTION

// ╭──────────────────────────────────────────────────────────────────╮
// │  On first run, state.latestPaperlessOrder is null. Fetch the     │
// │  current highest order number from the live API so we start      │
// │  from now rather than replaying history.                         │
// ╰──────────────────────────────────────────────────────────────────╯
async function init() {
  if (appState.latestPaperlessOrder === null) {
    try {
      appState.latestPaperlessOrder = await paperless.getCurrentOrderCursor();
      stateStore.save(appState);
      log(`Cursor initialized to order #${appState.latestPaperlessOrder}`);
    } catch (err) {
      log(`Failed to initialize order cursor: ${err.message} — will retry on next poll`);
    }
  }

  if (appState.latestPaperlessOrder !== null) {
    pollPaperless();
  }
  setInterval(pollPaperless, config.updateInterval);
}

init();
