/***********************************************************************
 * 
 *                                airPaper.js
 * 
 *          Scans Paperless Parts and imports data into Airtable
 *           
 ***********************************************************************/

const https      = require('https');
const Airtable   = require('airtable');
const fs         = require('fs');


/***************************************
 * 
 *    Airtable & Paperless config
 * 
 ***************************************/

var latestWO = 0;                                                                // File to hold most recent known paperless ID

if(fs.existsSync('latestWO')){                                                   // Check for latestWO file and load data 
  var latestWOfile = fs.readFileSync('latestWO',"UTF8");
  latestWO = Number(latestWOfile);
}

if(fs.existsSync('paperlessKey')){                                               // Check for Paperless Parts key file and load data 
  var paperlessKey = fs.readFileSync('paperlessKey',"UTF8");
}else{
  console.error("Paperless Parts key not found! './paperlessKey'")
  return;
}

if(fs.existsSync('airtableKey')){                                                // Check for Paperless Parts key file and load data 
  var airtableKey   = fs.readFileSync("airtableKey","UTF8");                    
  var base     = new Airtable({apiKey: airtableKey}).base('appjwkCHzyCIMJagA');  // Configure base object to post data with base ID (P3D ERP)
}else{
  console.error("Airtable key not found! './airtableKey'")
  return;
}


/***************************************
 * 
 *             getNewWOs()
 * 
 *  Checks for existence of new orders 
 *  and runs getWO() for each new found.
 * 
 ***************************************/
function getNewWOs(){
  console.log("Checking for new orders...")

  if(latestWO<1){latestWO=''}

  var options = {
    "headers": { "Authorization": `API-Token ${paperlessKey}`},
    "method": "GET",
    "url": `https://api.paperlessparts.com/orders/public/new?last_order=${latestWO}`,
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
    
       
    res.setEncoding('utf8');                                //Get and parse data  
    let rawData = '';
    res.on('data', (data) => { rawData += data; });
    res.on('end', () => {
      try {
        var paperData = JSON.parse(rawData);
        
        switch (Object.keys(paperData).length) {            //Report how many new orders
          case 0:
            console.log("None new.");
            break;
          case 1:
            console.log("One new order!");
            break;
          default:
            console.log(`${Object.keys(paperData).length} new orders!`)
            break;
        }
        
        paperData.forEach(WO => {                           // For every new order, send it over to Airtable
          getWO(WO);
          latestWO++;
        });

        fs.writeFileSync('latestWO',latestWO.toString());   //Save latest WO# to file

      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {console.error(`Error occurred: ${e.message}`);});
}

                                                                                 
/***************************************
 * 
 *               getWo()
 * 
 *  Fetches a Work Order of given # and
 *  runs sendAirTableObject with 
 *  returned data
 * 
 ***************************************/
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
        sendAirtableObject(num,paperData);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {console.error(`Error occurred: ${e.message}`);});
}


/***************************************
 * 
 *         sendAirtableObject()
 * 
 *  Creates object to send to Airtable
 *  from Paperless JSON data
 * 
 ***************************************/
function sendAirtableObject(WO,paperData){

  for (let i = 0; i < paperData.order_items.length; i++) {

    var name = paperData.order_items[i].filename.split('.').slice(0, -1).join('.')

    base('Paperless Work Orders').create([
    {
      "fields": {
        '#':WO,
        'ID':paperData.order_items[i].id,
        'Name':name,
        'Quantity':paperData.order_items[i].quantity,
        'Due Date': paperData.ships_on, 
        'PO#': Number(paperData.payment_details.purchase_order_number),
        'Notes': paperData.private_notes
      }
    }
    ], function(err, records) {
      if (err) {
        console.error(err);
        return;
      }
      records.forEach(function (record) {
        console.log(`New entry: ${name} ( ${record.getId()} ) added.`); 
      });
    });
  }

}


// getNewWOs();

setInterval(getNewWOs,120000) //Run ever x ms