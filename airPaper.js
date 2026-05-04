// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃                                                        ┃
// ┃                        airPaper.js                     ┃
// ┃                                                        ┃
// ┃  Scans Paperless Parts and imports data into Airtable  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const fs = require('fs');              // File System I/O
const https = require('https');        // Allows get requests to paperless API
const zlib = require('zlib');          // Extractor for gzip'd thumbnails
const Airtable = require('airtable');  // Airtable API library
const moment = require('moment');      // Formatted time stamps
const followHttps = require('follow-redirects').https;
require('dotenv').config();

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                                    Global Vars                                                    │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

var Version = "1.2.0";                     // Current Version
var updateInterval = Number(process.env.UPDATE_INTERVAL || 120000);          // How often to check new orders (in ms)
var activeBase = process.env.ACTIVE_TABLE || "Work Orders";                  // Airtable table name
var debug = process.env.DEBUG === "true";                                    // Freeze latestWO
var airtableBaseID = process.env.AIRTABLE_BASE_ID || "appjwkCHzyCIMJagA";

// Airtable attachment uploads need the field name in the URL. Keeping this as a var makes it easier to reuse
// if other attachment fields, like STEP files, get uploaded the same way later.
var pictureField = "Picture";

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                            Airtable & Paperless Config                                            │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

// File to hold most recent known paperless ID
var latestWO = 80;
if (fs.existsSync('latestWO')) {
  var latestWOfile = fs.readFileSync('latestWO', "UTF8");
  latestWO = Number(latestWOfile);
}

var paperlessKey = process.env.PAPERLESS_KEY;
var airtableKey = process.env.AIRTABLE_KEY;

// Fall back to the old key files if .env has not been set up yet.
if (!paperlessKey && fs.existsSync('paperlessKey')) {
  paperlessKey = fs.readFileSync('paperlessKey', "UTF8");
}

if (!airtableKey && fs.existsSync('airtableKey')) {
  airtableKey = fs.readFileSync("airtableKey", "UTF8");
}

if (!paperlessKey) {
  console.error("Paperless Parts key not found! Set PAPERLESS_KEY in .env or create './paperlessKey'")
  return;
}

if (!airtableKey) {
  console.error("Airtable key not found! Set AIRTABLE_KEY in .env or create './airtableKey'")
  return;
}

var base = new Airtable({ apiKey: airtableKey.trim() }).base(airtableBaseID);

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                             Helper & Mapping Functions                                            │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

// ╭────────────────────────────────────────────────╮
// │  Log text to terminal with timestamp prefixed  │
// ╰────────────────────────────────────────────────╯
function timePrint(text) {
  var tS = moment().format('Do MMM, h:mm:ss a');
  console.log(`「${tS}」 ${text}`)
}

// ╭──────────────────────────────────────────────────╮
// │  Places request for JSON data from Paperless API │
// │ Then runs callback with the data as a parameter  │
// ╰──────────────────────────────────────────────────╯
function webGet(options, callback) {
  var rawData = "";
  https.get(options.url, options, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
    let error; // Check for errors & reports it
    if (statusCode !== 200) {
      error = new Error(`Request Failed.\n + Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error(`Invalid content-type. \n Expected application/json but got ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      res.resume();
      return;
    }
    res.setEncoding('utf8');
    res.on('data', (data) => {
      rawData += data;
    });
    res.on('end', () => {
      callback(JSON.parse(rawData))
    })
  }).on('error', (e) => {
    console.error(`HTTP Error: ${e.message}`);
  });
}

function cleanFileName(fileName) {
  return fileName.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, '') || 'part';
}

function clientName(customer) {
  return customer.company ? customer.company.business_name : `${customer.first_name} ${customer.last_name}`;
}

// ╭────────────────────────────────────────────────────────╮
// │  Maps one Paperless order item into the field object   │
// │  Airtable expects when creating a Work Order record.   │
// ╰────────────────────────────────────────────────────────╯
function workOrderObject(paperData, orderItem, comp) {
  return {
    "fields": {
      "Paperless ID#": Number(orderItem.id),
      "Part": orderItem.filename.split('.').slice(0, -1).join('.'),
      "Status": "PO Received",
      "Qty Ordered": Number(orderItem.quantity),
      "Due Date": paperData.ships_on,
      "Client": clientName(paperData.customer),
      "Purchase Order": paperData.payment_details.purchase_order_number,
      "Notes": paperData.private_notes,
      "Stock Status": "Not Yet Ordered",
      "Tooling Status": "Not Yet Ordered",
      [pictureField]: [],
      "Finish": comp.finishes[0] ? comp.finishes[0] : "",
      "Material": comp.material.name ? comp.material.name : "",
      "PP Part Link": `https://app.paperlessparts.com/parts/viewer/${comp.part_uuid}`,
      "STEP File": comp.part_url,
    }
  }
}

// ╭──────────────────────────────────────────────╮
// │  Download a file into memory. Paperless      │
// │  thumbnail URLs may redirect, so use the     │
// │  follow-redirects HTTPS client here.         │
// ╰──────────────────────────────────────────────╯
function downloadBuffer(url, callback) {
  let chunks = [];

  followHttps.get(url, (res) => {
    if (res.statusCode !== 200) {
      callback(new Error(`Download failed with status ${res.statusCode}`));
      res.resume();
      return;
    }

    res.on('data', (chunk) => {
      chunks.push(chunk);
    });

    res.on('end', () => {
      callback(null, Buffer.concat(chunks));
    });
  }).on('error', callback);
}

function gunzipIfNeeded(buffer, callback) {
  // Paperless thumbnails have historically arrived gzip-compressed. If this one is not gzip, keep the original bytes.
  zlib.gunzip(buffer, (err, unzipped) => {
    callback(null, err ? buffer : unzipped);
  });
}

function loadAttachmentBuffer(attachment, callback) {
  // Attachments can come from either a remote Paperless URL or a local placeholder file such as ITAR.png.
  if (attachment.path) {
    fs.readFile(attachment.path, callback);
    return;
  }

  downloadBuffer(attachment.url, (err, buffer) => {
    if (err) {
      callback(err);
      return;
    }

    gunzipIfNeeded(buffer, callback);
  });
}

// ╭────────────────────────────────────────────────────╮
// │  Airtable's direct attachment endpoint expects     │
// │  Base64 in JSON and uploads into an existing       │
// │  record, so this runs after record creation.       │
// ╰────────────────────────────────────────────────────╯
function uploadAirtableAttachment(recordId, attachment) {
  loadAttachmentBuffer(attachment, (err, buffer) => {
    if (err) {
      console.error(`Attachment load failed for ${attachment.filename}: ${err.message}`);
      return;
    }

    if (buffer.length > 5 * 1024 * 1024) {
      console.error(`Attachment ${attachment.filename} is larger than Airtable's 5 MB direct upload limit.`);
      return;
    }

    let postData = JSON.stringify({
      "contentType": attachment.contentType,
      "filename": attachment.filename,
      "file": buffer.toString('base64'),
    });

    let options = {
      "hostname": "content.airtable.com",
      "method": "POST",
      "path": `/v0/${airtableBaseID}/${recordId}/${pictureField}/uploadAttachment`,
      "headers": {
        "Authorization": `Bearer ${airtableKey.trim()}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      }
    }

    let req = https.request(options, (res) => {
      let rawData = "";

      res.setEncoding('utf8');
      res.on('data', (data) => {
        rawData += data;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`Attachment upload failed for ${attachment.filename}: ${res.statusCode} ${rawData}`);
          return;
        }

        timePrint(`Picture uploaded: ${attachment.filename}`);
      });
    });

    req.on('error', (err) => {
      console.error(`Attachment upload failed for ${attachment.filename}: ${err.message}`);
    });

    req.write(postData);
    req.end();
  });
}

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                                airPaper Workflow                                                  │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

// Flow: poll Paperless for new order numbers, fetch each order, map each ordered part into an Airtable record,
// create that record, then upload its picture attachment after Airtable returns the new record ID.

// ╭────────────────────────────────────────╮
// │   //SECTION getNewWOs()                │
// │                                        │
// │  Checks for existence of new orders    │
// │  and runs getWO() for each new found.  │
// ╰────────────────────────────────────────╯
function getNewWOs() {
  var options = {
    "headers": { "Authorization": `API-Token ${paperlessKey}` },
    "method": "GET",
    "url": `https://api.paperlessparts.com/orders/public/new?last_order=${latestWO}`,
  }

  webGet(options, (paperData) => {
    switch (Object.keys(paperData).length) { // Report how many new orders
      case 0:
        break;
      case 1:
        timePrint("One new order!");
        break;
      default:
        timePrint(`${Object.keys(paperData).length} new orders!`)
        break;
    }

    paperData.forEach(WO => { // Get WO for each discovered
      getWO(WO);
      latestWO++;
    });

    if (!debug) {
      fs.writeFileSync('latestWO', latestWO.toString())
    } // Save latest WO# to file if not 'debugging'
  })
}
//!SECTION

// ╭───────────────────────────────────────╮
// │     //SECTION getWO()                 │
// │                                       │
// │  Fetches a Work Order of given # and  │
// │  runs sendAirTableObject with         │
// │  returned data                        │
// ╰───────────────────────────────────────╯
function getWO(num) {
  var options = {
    "headers": { "Authorization": `API-Token ${paperlessKey}` },
    "method": "GET",
    "url": `https://api.paperlessparts.com/orders/public/${num}`,
  }
  webGet(options, createWO);
}
// !SECTION

// ╭─────────────────────────────────────────╮
// │          //SECTION createWO()           │
// │                                         │
// │    Creates object with work order data  │
// │   to be sent to Airtable as a new item  │
// ╰─────────────────────────────────────────╯
function createWO(paperData) {
  paperData.order_items.forEach(orderItem => {                                                                                                                // Iterate through all actual parts in the order (Since orders can have multiple parts)
    let comp = orderItem.components[0]; // Grab the first 'component' for the part (parts can be assemblies of multiple components)
    var WObject = workOrderObject(paperData, orderItem, comp);

    // Airtable creates the record first; the direct attachment API uploads the image afterward using that record ID.
    let attachment = null;
    let ITAR = orderItem.export_controlled;
    if (ITAR && fs.existsSync('./imgServe/ITAR.png')) {
      attachment = {
        "path": "./imgServe/ITAR.png",
        "filename": "ITAR.png",
        "contentType": "image/png",
      }
    } else if (!ITAR && comp.thumbnail_url) {
      attachment = {
        "url": comp.thumbnail_url,
        "filename": `${cleanFileName(WObject.fields["Part"])}.png`,
        "contentType": "image/png",
      }
    }

    sendAirtableObject(WObject, attachment);
  }); // End for loop of each order
}; // End createWO()
//!SECTION

// ╭──────────────────────────────────────╮
// │   //SECTION sendAirtableObject()     │
// │                                      │
// │  Sends created objects into airtable │
// │  at 'activeBase'                     │
// ╰──────────────────────────────────────╯
function sendAirtableObject(WObject, attachment) {
  base(activeBase).create([WObject], (err, records) => {
    if (err) {
      console.error(err);
      return;
    }
    records.forEach(function (record) {
      timePrint(`New entry: ${record.fields["Part"]} ( ${record.getId()} ) added.`);
      if (attachment) {
        uploadAirtableAttachment(record.getId(), attachment);
      }
    });
  });
}
//!SECTION

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                                      Execute                                                      │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
timePrint(`AirPaper ${Version}`) // Print startup time
getNewWOs(); // Check now for any new Work ORders
setInterval(getNewWOs, updateInterval) // Check again every x ms`
