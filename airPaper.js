
 
          // ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
          // ┃                                                        ┃
          // ┃                        airPaper.js                     ┃
          // ┃                                                        ┃
          // ┃  Scans Paperless Parts and imports data into Airtable  ┃
          // ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    
           
const fs          = require('fs');                // File System I/O
const https       = require('https');             // Allows get requests to paperless API
const Airtable    = require('airtable');          // Airtable API library
const moment      = require('moment');            // Formatted time stamps


/* ------------------------------------ Global Vars ----------------------------------- */
var Version        = 1.0;                         // Current Version
var updateInterval = 120000;                      // How often to check new orders (in ms)
var activeBase     = "Work Orders"                // Production: "Work Orders" | Testing: "Paperless Work Orders"
var debug          = false                        // Freeze latestWO

/* ---------------------------- Airtable & Paperless Config --------------------------- */

// File to hold most recent known paperless ID
var latestWO = 0;                                                                     
if(fs.existsSync('latestWO')){                                                        
  var latestWOfile = fs.readFileSync('latestWO',"UTF8");
  latestWO = Number(latestWOfile);
}

// Check for Paperless Parts key file and load data 
if(fs.existsSync('paperlessKey')){                                                    
  var paperlessKey = fs.readFileSync('paperlessKey',"UTF8");
}else{
  console.error("Paperless Parts key not found! './paperlessKey'")
  return;
}

// Check for Paperless Parts key file and load data 
if(fs.existsSync('airtableKey')){                                                     
  var airtableKey   = fs.readFileSync("airtableKey","UTF8");                          
  var base          = new Airtable({apiKey: airtableKey}).base('appjwkCHzyCIMJagA');   
}else{
  console.error("Airtable key not found! './airtableKey'")
  return;
}


/* -------------------------------- Shorthand Functions ------------------------------- */

// ╭────────────────────────────────────────────────╮
// │  Log text to terminal with timestamp prefixed  │
// ╰────────────────────────────────────────────────╯
function timePrint(text){
  var tS = moment().format('Do MMM, h:mm:ss a');
  console.log(`「${tS}」 ${text}` )
}


// ╭──────────────────────────────────────────────────╮
// │  Places request for JSON data from Paperless API │
// │ Then runs callback with the data as a parameter  │
// ╰──────────────────────────────────────────────────╯
function webGet(options,callback){
  var rawData = "";
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
    res.setEncoding('utf8');
    res.on('data', (data) => { rawData += data; });
    res.on('end',  ()=>{
      callback(JSON.parse(rawData))
    })
  }).on('error', (e) => {console.error(`HTTP Error: ${e.message}`);});
}


/* -------------------------------- airPaper Callbacks -------------------------------- */

  // ╭────────────────────────────────────────╮
  // │   //SECTION getNewWOs()                │
  // │                                        │
  // │  Checks for existence of new orders    │
  // │  and runs getWO() for each new found.  │
  // ╰────────────────────────────────────────╯

  function getNewWOs(){
  var options = {
    "headers": { "Authorization": `API-Token ${paperlessKey}`},
    "method": "GET",
    "url": `https://api.paperlessparts.com/orders/public/new?last_order=${latestWO}`,
  }

  webGet(options,(paperData)=>{
    switch (Object.keys(paperData).length) {                        // Report how many new orders
      case 0:
        break;
      case 1:
        timePrint("One new order!");
        break;
      default:
        timePrint(`${Object.keys(paperData).length} new orders!`)
        break;
    }

    paperData.forEach(WO => {                                       //Get WO for each discovered
      getWO(WO); 
      latestWO++;
    });

    if(!debug){fs.writeFileSync('latestWO',latestWO.toString())}    //Save latest WO# to file if not 'debugging'
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

 function getWO(num){
  var options = {
    "headers": { "Authorization": `API-Token ${paperlessKey}`},
    "method": "GET",
    "url": `https://api.paperlessparts.com/orders/public/${num}`,
  }
  webGet(options,createWO);
}
// !SECTION




// ╭─────────────────────────────────────────╮
// │          //SECTION createWO()           │
// │                                         │
// │    Creates object with work order data  │
// │   to be sent to Airtable as a new item  │
// ╰─────────────────────────────────────────╯
function createWO(paperData){
    //Iterate through all actual parts in the order
    paperData.order_items.forEach(orderItem => {
    var WObject = {
      "fields": {
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
        timePrint(`New entry: ${record.fields.Part} ( ${record.getId()} ) added.`);
      });
    });
}
//!SECTION

/* -------------------------------------- Execute ------------------------------------- */

timePrint(`AirPaper ${Version}`)
getNewWOs();
setInterval(getNewWOs,updateInterval) //Run every x ms`