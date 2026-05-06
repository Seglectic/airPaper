'use strict';

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                   workflow-xometry.js                  ┃
// ┃                                                        ┃
// ┃  Enriches an existing Airtable record with files and   ┃
// ┃  metadata fetched from a matched Xometry job.          ┃
// ┃  Called from workflow-paperless when a Xometry job ID  ┃
// ┃  can be resolved from the Paperless order erp_code.    ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const { log } = require('./logger');
const config = require('./config');
const airtable = require('./airtable');
const xometry = require('./xometry');
const stateStore = require('./state');

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                          File upload helpers                              │
// └───────────────────────────────────────────────────────────────────────────┘

// File types from a Xometry line item to pull into Airtable Part Documents
const PART_DOC_TYPES = ['traveler', 'redactedDrawings'];

// ╭──────────────────────────────────────────────────────────────────╮
// │  Downloads one Xometry file entry and uploads it to the          │
// │  configured Part Documents field in Airtable.                    │
// │  Logs and returns without throwing on any single-file failure    │
// │  so a bad file doesn't abort the rest of the enrichment run.     │
// ╰──────────────────────────────────────────────────────────────────╯
async function uploadXometryFile(recordId, fileEntry, fallbackName) {
  const filename = fileEntry.constructedName || fileEntry.name || fallbackName;
  let buf;
  try {
    buf = await xometry.downloadFile(fileEntry.href);
  } catch (err) {
    log(`Xometry file download failed (${filename}): ${err.message}`);
    return;
  }
  try {
    await airtable.uploadAttachment(recordId, config.partDocumentsField, filename, fileEntry.type, buf);
    log(`Part document uploaded: ${filename}`);
  } catch (err) {
    log(`Part document upload failed (${filename}): ${err.message}`);
  }
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Enrichment workflow                               │
// └───────────────────────────────────────────────────────────────────────────┘

// ╭──────────────────────────────────────────────────────────────────────╮
// │   //SECTION enrichXometryRecord()                                    │
// │                                                                      │
// │   Fetches the Xometry job, patches the Airtable record with job      │
// │   metadata, and uploads traveler + redacted drawings to Part Docs.   │
// │   Stores the correlation in state so future lookups skip erp_code.   │
// ╰──────────────────────────────────────────────────────────────────────╯
async function enrichXometryRecord(recordId, xometryJobId, orderItem, appState) {
  log(`Enriching record ${recordId} with Xometry job ${xometryJobId}`);

  let job;
  try {
    job = await xometry.getJob(xometryJobId);
  } catch (err) {
    log(`Xometry getJob(${xometryJobId}) failed: ${err.message}`);
    return;
  }

  // Match line item by traveler filename prefix (e.g. "4A525F8" from "4A525F8_step_conversion_r_0.stp").
  // Falls back to quantity match, then first item.
  const partPrefix = orderItem.filename.split('.')[0].split('_')[0];
  const lineItem =
    job.lineItems.find(li => li.files?.traveler?.[0]?.constructedName?.startsWith(partPrefix)) ??
    job.lineItems.find(li => li.quantity === orderItem.quantity) ??
    job.lineItems[0];

  // ╭──────────────────────────────────────────────────────────────────────╮
  // │  Xometry metadata fields are optional in the Airtable table.         │
  // │  If they don't exist, the patch will error and we log and continue.  │
  // ╰──────────────────────────────────────────────────────────────────────╯
  const patch = {};
  if (lineItem?.material?.name) patch['Material']    = lineItem.material.name;
  if (lineItem?.finish?.name)   patch['Finish']      = lineItem.finish.name;
  if (lineItem?.quantity)       patch['Qty Ordered'] = lineItem.quantity;
  if (job.dates?.shipBy)        patch['Due Date']    = job.dates.shipBy.split('T')[0];

  try {
    await airtable.patchRecord(recordId, patch);
    log(`Xometry metadata applied to ${recordId}`);
  } catch (err) {
    log(`Xometry metadata patch failed for ${recordId}: ${err.message}`);
  }

  // Upload traveler and redacted drawings as Part Documents
  if (lineItem?.files) {
    for (const docType of PART_DOC_TYPES) {
      const files = lineItem.files[docType] || [];
      for (let i = 0; i < files.length; i++) {
        await uploadXometryFile(recordId, files[i], `${docType}-${xometryJobId}-${i}`);
      }
    }
  }

  // Store correlation so future lookups don't depend on erp_code being present
  if (!config.testing) {
    appState.xometryCorrelations[`xometry:${xometryJobId}`] = {
      airtableRecordId:     recordId,
      paperlessOrderItemId: String(orderItem.id),
    };
    stateStore.save(appState);
  }
}
//!SECTION

module.exports = { enrichXometryRecord };
