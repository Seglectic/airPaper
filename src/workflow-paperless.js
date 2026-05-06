'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                  workflow-paperless.js                 ┃
// ┃                                                        ┃
// ┃  Core Paperless → Airtable workflow. Maps each order   ┃
// ┃  item from a Paperless order into one Airtable record, ┃
// ┃  uploads its thumbnail or ITAR placeholder, and hands  ┃
// ┃  off Xometry orders for file enrichment.               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const fs = require('fs');
const { log } = require('./logger');
const config = require('./config');
const airtable = require('./airtable');
const stateStore = require('./state');
const processed = require('./processed');
const { enrichXometryRecord } = require('./workflow-xometry');

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          Helper functions                                 │
// └───────────────────────────────────────────────────────────────────────────┘

function clientName(customer) {
  return customer.company
    ? customer.company.business_name
    : `${customer.first_name} ${customer.last_name}`;
}

function cleanFileName(name) {
  return name.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, '') || 'part';
}

// ╭──────────────────────────────────────────────────────────────────╮
// │  Returns true if the Paperless order's customer name matches     │
// │  any entry in the configured Xometry name heuristic list.        │
// ╰──────────────────────────────────────────────────────────────────╯
function isXometryClient(customer) {
  const name = clientName(customer).toLowerCase();
  return config.xometryNameMatches.some(match => name.includes(match));
}

// ╭──────────────────────────────────────────────────────────────────────╮
// │  Resolves a Xometry job ID from the Paperless order. Checks the      │
// │  erp_code/quote_erp_code for an explicit "xometry:{jobId}" marker    │
// │  first, then falls back to the PO number (Xometry sends its job ID   │
// │  as the PO). Returns null if nothing is found.                        │
// ╰──────────────────────────────────────────────────────────────────────╯
function extractXometryJobId(paperData) {
  for (const field of ['erp_code', 'quote_erp_code']) {
    const val = paperData[field];
    if (typeof val === 'string' && /^xometry:/i.test(val)) {
      return val.split(':')[1];
    }
  }
  return paperData.payment_details?.purchase_order_number || null;
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Airtable field mapping                            │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭──────────────────────────────────────────────────────────────────╮
// │  Maps one Paperless order item into the field object             │
// │  Airtable expects when creating a Work Order record.             │
// ╰──────────────────────────────────────────────────────────────────╯
function buildFields(paperData, orderItem, comp) {
  return {
    'Paperless ID#':  Number(orderItem.id),
    'Part':           orderItem.filename.split('.').slice(0, -1).join('.'),
    'Status':         'PO Received',
    'Qty Ordered':    Number(orderItem.quantity),
    'Due Date':       paperData.ships_on,
    'Client':         clientName(paperData.customer),
    'Purchase Order': paperData.payment_details.purchase_order_number,
    'Notes':          paperData.private_notes,
    'Stock Status':   'Not Yet Ordered',
    'Tooling Status': 'Not Yet Ordered',
    'Picture':        [],
    'Finish':         comp.finishes[0] || '',
    'Material':       comp.material.name || '',
    'PP Part Link':   `https://app.paperlessparts.com/parts/viewer/${comp.part_uuid}`,
    'STEP File':      comp.part_url,
  };
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          Order item processing                            │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭────────────────────────────────────────────────────────────────────────╮
// │   //SECTION processOrderItem()                                         │
// │                                                                        │
// │   Creates one Airtable record for a Paperless order item.              │
// │   Guards against duplicates via processedOrderItemIds in state.        │
// │   Uploads thumbnail or ITAR placeholder, then hands off to             │
// │   Xometry enrichment if the order is from a Xometry client.            │
// ╰────────────────────────────────────────────────────────────────────────╯
async function processOrderItem(paperData, orderItem, appState) {
  const itemId = String(orderItem.id);

  if (processed.has(itemId)) {
    log(`Skipping already-processed order item ${itemId}`);
    return;
  }

  const comp = orderItem.components[0];
  const fields = buildFields(paperData, orderItem, comp);
  const partName = fields['Part'];

  let record;
  try {
    record = await airtable.createRecord(fields);
  } catch (err) {
    log(`Failed to create record for item ${itemId} (${partName}): ${err.message}`);
    if (!config.testing) {
      appState.failedQueue.push({ type: 'create', itemId, partName, error: err.message, ts: new Date().toISOString() });
      stateStore.save(appState);
    }

    return;
  }

  const recordId = record.id;
  log(`New entry: ${partName} ( ${recordId} ) added`);

  // Mark processed before attachment work so a crash here doesn't re-create the row
  processed.add(itemId);

  // ╭────────────────────────────────────────────────────────────╮
  // │  Picture attachment — ITAR placeholder or Paperless thumb  │
  // ╰────────────────────────────────────────────────────────────╯
  let attachment = null;
  if (orderItem.export_controlled && fs.existsSync('./assets/ITAR.png')) {
    attachment = { path: './assets/ITAR.png', filename: 'ITAR.png', contentType: 'image/png' };
  } else if (!orderItem.export_controlled && comp.thumbnail_url) {
    attachment = {
      url:         comp.thumbnail_url,
      filename:    `${cleanFileName(partName)}.png`,
      contentType: 'image/png',
    };
  }

  if (attachment) {
    try {
      const buf = await airtable.loadBuffer(attachment);
      await airtable.uploadAttachment(recordId, 'Picture', attachment.filename, attachment.contentType, buf);
      log(`Picture uploaded: ${attachment.filename}`);
    } catch (err) {
      log(`Picture upload failed for ${attachment.filename}: ${err.message}`);
    }
  }

  // ╭───────────────────────────────────────────────────────────────────────╮
  // │  Xometry enrichment — runs when a token is set and the client name    │
  // │  matches. Requires erp_code=xometry:{jobId} on the Paperless order    │
  // │  or a stored correlation in state to resolve the Xometry job ID.      │
  // ╰───────────────────────────────────────────────────────────────────────╯
  if (config.xometryApiToken && isXometryClient(paperData.customer)) {
    const xometryJobId = extractXometryJobId(paperData)
      ?? appState.xometryCorrelations[`paperless:${itemId}`];

    if (xometryJobId) {
      await enrichXometryRecord(recordId, xometryJobId, orderItem, appState);
    } else {
      log(`Xometry order detected (item ${itemId}) but no job ID found — no PO number on this order`);
    }
  }
}
//!SECTION

// ╭────────────────────────────────────────────────────────────────╮
// │   //SECTION processPaperlessOrder()                            │
// │                                                                │
// │   Iterates all order_items in one Paperless order response     │
// │   and processes each sequentially.                             │
// ╰────────────────────────────────────────────────────────────────╯
async function processPaperlessOrder(paperData, appState) {
  for (const orderItem of paperData.order_items) {
    await processOrderItem(paperData, orderItem, appState);
  }
}
//!SECTION

module.exports = { processPaperlessOrder };
