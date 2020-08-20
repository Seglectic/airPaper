
 
          // ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
          // ┃                                                        ┃
          // ┃                        airPaper.js                     ┃
          // ┃                                                        ┃
          // ┃  Scans Paperless Parts and imports data into Airtable  ┃
          // ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    
           
// const extract     = require('extract-zip');    // Required for extracting images from Paperless
const fs          = require('fs');                // File System I/O
const https       = require('https');             // Allows get requests to paperless API
const Airtable    = require('airtable');          // Airtable API library
const moment      = require('moment');            // Formatted time stamps


/* ------------------------------------ Global Vars ----------------------------------- */
var Version        = 0.9;                         // Current Version
var updateInterval = 120000;                      // How often to check new orders (in ms)
var activeBase     = "Work Orders"                // Production: "Work Orders" | Testing: "Paperless Work Orders"

/* ---------------------------- Airtable & Paperless Config --------------------------- */

var latestWO = 0;                                                                     // File to hold most recent known paperless ID
if(fs.existsSync('latestWO')){                                                        // Check for latestWO file and load data 
  var latestWOfile = fs.readFileSync('latestWO',"UTF8");
  latestWO = Number(latestWOfile);
}

if(fs.existsSync('paperlessKey')){                                                    // Check for Paperless Parts key file and load data 
  var paperlessKey = fs.readFileSync('paperlessKey',"UTF8");
}else{
  console.error("Paperless Parts key not found! './paperlessKey'")
  return;
}

if(fs.existsSync('airtableKey')){                                                     // Check for Paperless Parts key file and load data 
  var airtableKey   = fs.readFileSync("airtableKey","UTF8");                          // Configure base object to post data with base ID (P3D ERP)
  var base          = new Airtable({apiKey: airtableKey}).base('appjwkCHzyCIMJagA');  
  
}else{
  console.error("Airtable key not found! './airtableKey'")
  return;
}


/* -------------------------------- Shorthand Functions ------------------------------- */

// ╭────────────────────────────────────────────────╮
// │  Log text to terminal with timestamp prefixed  │
// ╰────────────────────────────────────────────────╯
function timeLog(text){
  var tS = moment().format('Do MMM, h:mm:ss a');
  console.log(`「${tS}」 ${text}` )
}


/* -------------------------------- airPaper Callbacks -------------------------------- */

  // ╭────────────────────────────────────────╮
  // │   //SECTION getNewWOs()                │
  // │                                        │
  // │  Checks for existence of new orders    │
  // │  and runs getWO() for each new found.  │
  // ╰────────────────────────────────────────╯

  function getNewWOs(){

  if(latestWO<1){latestWO=''}

  var options = {
    "headers": { "Authorization": `API-Token ${paperlessKey}`},
    "method": "GET",
    "url": `https://api.paperlessparts.com/orders/public/new?last_order=${latestWO}`,
  }

  https.get(options.url,options,(res)=>{                    // Make Request
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
    let error; // Check for errors & reports it
    if (statusCode !== 200) { error = new Error(`Request Failed.\n + Status Code: ${statusCode}`); } 
      else if (!/^application\/json/.test(contentType)) {error = new Error(`Invalid content-type. \n Expected application/json but got ${contentType}`);}
    if (error) {
      console.error(error.message);
      res.resume();
      return;
    }
    
    res.setEncoding('utf8');                              
    let rawData = '';
    res.on('data', (data) => { rawData += data; });
    res.on('end', () => {
      try {
        var paperData = JSON.parse(rawData);                // Set parse http data into paperData
        switch (Object.keys(paperData).length) {            // Report how many new orders
          case 0:
            break;
          case 1:
            timeLog("One new order!");
            break;
          default:
            timeLog(`${Object.keys(paperData).length} new orders!`)
            break;
        }
        
        paperData.forEach(WO => {                            // For every new order, do a thing with it
          getWO(WO); 
          latestWO++;
        });

        fs.writeFileSync('latestWO',latestWO.toString());    //Save latest WO# to file
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {console.error(`Error retrieving new orders: ${e.message}`);});
}
//!SECTION

         


 // ╭───────────────────────────────────────╮
 // │     //SECTION getWO()                 │
 // │                                       │
 // │  Fetches a Work Order of given # and  │
 // │  runs sendAirTableObject with         │
 // │  returned data                        │
 // ╰───────────────────────────────────────╯

function getWO(num){
  var options = {
    "headers": { "Authorization": `API-Token ${paperlessKey}`},
    "method": "GET",
    "url": `https://api.paperlessparts.com/orders/public/${num}`,
  }

  https.get(options.url,options,(res)=>{
    const { statusCode } = res;
    const contentType = res.headers['content-type'];
      
    let error; // Check for errors & reports it
    if (statusCode !== 200) { error = new Error(`Request Failed.\n + Status Code: ${statusCode}`); } 
      else if (!/^application\/json/.test(contentType)) {error = new Error(`Invalid content-type. \n Expected application/json but got ${contentType}`);}
    if (error) {
      console.error(error.message);
      res.resume();
      return;
    }
    
    //Get and parse data      
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (data) => { rawData += data; });
    res.on('end', () => {
      try {
        var paperData = JSON.parse(rawData);
        // sendAirtableObject(num,paperData);
        createWO(num,paperData);
      } catch (e) {
        console.error(e.message);
      }

    });
  }).on('error', (e) => {console.error(`Error occurred: ${e.message}`);});
}
// !SECTION




// ╭─────────────────────────────────────────╮
// │          //SECTION createWO()           │
// │                                         │
// │    Creates object with work order data  │
// │   to be sent to Airtable as a new item  │
// ╰─────────────────────────────────────────╯
function createWO(WO,paperData){
    //Iterate through all actual parts in the order
    console.log(paperData)
    paperData.order_items.forEach(orderItem => {
    var WObject = {
      "fields": {
        "Paperless Entry #":Number(WO),
        "Paperless ID#":Number(orderItem.id),
        "Part":orderItem.filename.split('.').slice(0, -1).join('.'),
        "Status": "PO Received",
        "Qty Ordered":Number(orderItem.quantity),
        "Due Date": paperData.ships_on, 
        "Client": paperData.customer.company ? paperData.customer.company.business_name : `${paperData.customer.first_name} ${paperData.customer.last_name}`, 
        "Purchase Orders": paperData.payment_details.purchase_order_number,
        "Notes": paperData.private_notes,
        "Stock Status":'Not Yet Ordered',
        "Tooling Status": 'Not Yet Ordered',
      }
    }

    //Iterate 'components' subsection for each part
    orderItem.components.forEach(comp => {
      WObject.fields["Finish"]       = comp.finishes[0] ? comp.finishes[0] : "";
      WObject.fields["Material"]     = comp.material.name ? comp.material.name : "";
      WObject.fields["PP Part Link"] = `https://app.paperlessparts.com/parts/viewer/${comp.part_uuid}`;
      WObject.fields["STEP File"]    = comp.part_url;
    });

    sendAirtableObject(WObject);
    // console.log(WObject);
  });

}
//!SECTION




 // ╭──────────────────────────────────────╮
 // │   //SECTION sendAirtableObject()     │
 // │                                      │
 // │  Sends created objects into airtable │
 // │  at 'activeBase'                     │
 // ╰──────────────────────────────────────╯
function sendAirtableObject(WObject){
    base(activeBase).create([WObject], (err, records)=>{
      if (err) {console.error(err);return;}
      records.forEach(function (record) {
        timeLog(`New entry: ${record.fields.Part} ( ${record.getId()} ) added.`);
      });
    });
}
//!SECTION

/* -------------------------------------- Execute ------------------------------------- */

timeLog(`AirPaper ${Version}`)
getNewWOs();
setInterval(getNewWOs,updateInterval) //Run every x ms`