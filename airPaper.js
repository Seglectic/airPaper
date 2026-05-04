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

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                                    Global Vars                                                    │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

var Version = "1.2.0";                     // Current Version
var updateInterval = 120000;               // How often to check new orders (in ms)
// var activeBase = "Work Orders";            // Uncomment for Production: "Work Orders"
var activeBase = "Paperless Work Orders";  // Uncomment for Testing:    "Paperless Work Orders"
var debug = true;                          // Freeze latestWO
var airtableBaseID = "appjwkCHzyCIMJagA";
var attachmentField = "Picture";

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                            Airtable & Paperless Config                                            │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

// File to hold most recent known paperless ID
var latestWO = 80;
if (fs.existsSync('latestWO')) {
  var latestWOfile = fs.readFileSync('latestWO', "UTF8");
  latestWO = Number(latestWOfile);
}

// Check for Paperless Parts key file and load data
if (fs.existsSync('paperlessKey')) {
  var paperlessKey = fs.readFileSync('paperlessKey', "UTF8");
} else {
  console.error("Paperless Parts key not found! './paperlessKey'")
  return;
}

// Check for Paperless Parts key file and load data
if (fs.existsSync('airtableKey')) {
  var airtableKey = fs.readFileSync("airtableKey", "UTF8");
  var base = new Airtable({ apiKey: airtableKey }).base(airtableBaseID);
} else {
  console.error("Airtable key not found! './airtableKey'")
  return;
}

// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                                Shorthand Functions                                                │
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
  zlib.gunzip(buffer, (err, unzipped) => {
    callback(null, err ? buffer : unzipped);
  });
}

function loadAttachmentBuffer(attachment, callback) {
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
      "path": `/v0/${airtableBaseID}/${recordId}/${attachmentField}/uploadAttachment`,
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
// │                                                airPaper Callbacks                                                 │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

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
    var WObject = {                                                                                                                                           // Create the Work Order object we'll send to Airtable to make a record
      "fields": {                                                                                                                                             // Create the fields object
        "Paperless ID#": Number(orderItem.id),                                                                                                                // Add the Paperless ID# to the 'Paperless ID#' field
        "Part": orderItem.filename.split('.').slice(0, -1).join('.'),                                                                                         // Use the filename as the part name (remove the file extension)
        "Status": "PO Received",                                                                                                                              // Default to 'PO Received' for status
        "Qty Ordered": Number(orderItem.quantity),                                                                                                            // Add the quantity to the 'Qty Ordered' field
        "Due Date": paperData.ships_on,                                                                                                                       // Use the 'ships_on' date as the due date
        "Client": paperData.customer.company ? paperData.customer.company.business_name : `${paperData.customer.first_name} ${paperData.customer.last_name}`, // If the customer has a company, use it, otherwise use their name
        "Purchase Order": paperData.payment_details.purchase_order_number,                                                                                    // Add the PO number to the 'Purchase Order' field
        "Notes": paperData.private_notes,                                                                                                                     // Add private notes to the 'Notes' field
        "Stock Status": 'Not Yet Ordered',                                                                                                                    // Default to 'Not Yet Ordered' for stock status
        "Tooling Status": 'Not Yet Ordered',                                                                                                                  // Default to 'Not Yet Ordered' for tooling status
        "Picture": [],                                                                                                                                        // Array for pictures
      }
    }

    let comp = orderItem.components[0]; // Grab the first 'component' for the part (parts can be assemblies of multiple components)
    WObject.fields["Finish"] = comp.finishes[0] ? comp.finishes[0] : "";
    WObject.fields["Material"] = comp.material.name ? comp.material.name : "";
    WObject.fields["PP Part Link"] = `https://app.paperlessparts.com/parts/viewer/${comp.part_uuid}`;
    WObject.fields["STEP File"] = comp.part_url;

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
      timePrint(`New entry: ${record.fields.Part} ( ${record.getId()} ) added.`);
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
