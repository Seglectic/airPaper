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
			const request     = require('request');           // Make http requests for thumbnail data
			const gunzip      = require('gunzip-file');       // Extractor for gzip'd thumbnails
			
// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                                    Global Vars                                                    │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

			var Version        = "1.2.0";                     // Current Version
			var updateInterval = 120000;                      // How often to check new orders (in ms)
			var activeBase     = "Work Orders";       				// Uncomment for Production: "Work Orders"
			// var activeBase     = "Paperless Work Orders";  // Uncomment for Testing:    "Paperless Work Orders"
			var debug          = false;                       // Freeze latestWO
			var httPort        = 8085;                        // Port to host HTTP server from
			var getURL         = 'http://108.189.198.147'     // Local external IP for airtable to request web data
			var serveDir       = './imgServe'                 // Local directory to host images
			
// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                            Airtable & Paperless Config                                            │
// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
			
			// File to hold most recent known paperless ID
			var latestWO = 80;     
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
			
	// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                                  Express Server                                                   │
	// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
			// ╭───────────────────────────────────────────────────────────╮
			// │  Begin Express server for hosting image files.            │
			// │    (Required for thumbnails to be sent to to Airtable)    │
			// │    Port httPort MUST be forwarded for Airtables' access.  │
			// │    Upon failure, resulting image will be blank.           │
			// ╰───────────────────────────────────────────────────────────╯
			const express = require('express');
			var app = express();
			app.use(express.static(__dirname + 	'/'));
			
			// Define the route for serving files
			app.get('imgServe/:fileName', (req, res) => {
				const fileName = req.params.fileName;
				const filePath = path.join(__dirname, fileName);
				res.sendFile(filePath, (err) => {
					if (err) {
						console.error(`Error sending file: ${err}`);
						res.status(err.status || 500).end();
					}
				});
			});
			
	// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                                Shorthand Functions                                                │
	// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
			
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
					
			// ╭─────────────────────────────╮
			// │  imgDownload                │
			// │  Downloads image at URL     │
			// │  to path and runs callback  │
			// │  upon completion            │
			// ╰─────────────────────────────╯
			function imgDownload(url, path, callback){
				request.head(url, (err, res, body) => {
						request(url)
						.pipe(fs.createWriteStream(path))
						.on('close', ()=>{gunzip(path, path+'.png', ()=>{fs.unlinkSync(path), setTimeout( ()=>{callback} ,2000)} )})
				})
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
					paperData.order_items.forEach(orderItem => {   		             													// Iterate through all actual parts in the order (Since orders can have multiple parts)
					var WObject = {																		                              			  // Create the Work Order object we'll send to Airtable to make a record
						"fields": {                                                                           // Create the fields object
							"Paperless ID#":Number(orderItem.id),                                               // Add the Paperless ID# to the 'Paperless ID#' field
							"Part":orderItem.filename.split('.').slice(0, -1).join('.'),                        // Use the filename as the part name (remove the file extension)
							"Status": "PO Received",                                                            // Default to 'PO Received' for status
							"Qty Ordered":Number(orderItem.quantity),                                           // Add the quantity to the 'Qty Ordered' field
							"Due Date": paperData.ships_on, 																										// Use the 'ships_on' date as the due date
																																																  // If the customer has a company, use it, otherwise use their name:
							"Client": paperData.customer.company ? paperData.customer.company.business_name : `${paperData.customer.first_name} ${paperData.customer.last_name}`,  
							"Purchase Orders": paperData.payment_details.purchase_order_number,                 // Add the PO number to the 'Purchase Orders' field
							"Notes": paperData.private_notes, 																								  // Add private notes to the 'Notes' field
							"Stock Status":'Not Yet Ordered',                                 									// Default to 'Not Yet Ordered' for stock status
							"Tooling Status": 'Not Yet Ordered',                              									// Default to 'Not Yet Ordered' for tooling status
							"Picture":[],                                                     									// Array for pictures
						}
					}
			
					let comp = orderItem.components[0];																												// Grab the first 'component' for the part (parts can be assemblies of multiple components)
					WObject.fields["Finish"]       = comp.finishes[0] ? comp.finishes[0] : "";							 
					WObject.fields["Material"]     = comp.material.name ? comp.material.name : ""; 					  
					WObject.fields["PP Part Link"] = `https://app.paperlessparts.com/parts/viewer/${comp.part_uuid}`; 
					WObject.fields["STEP File"]    = comp.part_url;
					let thumbURL=comp.thumbnail_url;   																											  // Grab the Thumbnail URL from Paperless
					let ITAR = orderItem.export_controlled  																									// Send to Airtable if not export controlled (ITAR is a boolean)
					if (!ITAR){																																							  // Grab the pic and send it if it's not ITAR-y
						if (thumbURL){																																		    	// If the part in the order has an attached pic
							let fileName = WObject.fields["Part"].replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, '')      // Purge weird shit from the part name
							let localThumbURL = `${getURL}:${httPort}/imgServe/${fileName}.png`;                  // Assemble the URL for where the image file is hosted locally
							WObject.fields["Picture"].push({url:localThumbURL});                                  // Pushes an object to the Picture array with our local image address
							imgDownload(thumbURL,'./imgServe/'+fileName,sendAirtableObject(WObject));					    // Download the image and send the object to Airtable once it completes
							// imgDownload(thumbURL,'./imgServe/'+fileName); 																	    // For debug: only download the image, don't send to Airtable
						}else{
							sendAirtableObject(WObject);																												  // Send it without a pic if we don't have one
						}
					}else{ 																																			 							// If we've got an ITAR part
						let ITARURL = `${getURL}:${httPort}/imgServe/ITAR.png`; 									 							// grab our local ITAR pic URL
						WObject.fields["Picture"].push({url:ITARURL});                                    			// and attach the ITAR png to the object to send
						sendAirtableObject(WObject);																							 							// then send the object per usual
					}; // End ITAR check	
				}); //End for loop of each order
			}; //End createWO()
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
					records.forEach(function (record) {timePrint(`New entry: ${record.fields.Part} ( ${record.getId()} ) added.`);});
				});
			}
			//!SECTION
		
	// ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
	// │                                                      Execute                                                      │
	// └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
			timePrint(`AirPaper ${Version}`)																													// Print startup time
			app.listen(httPort,function(){timePrint(`Server started on port ${httPort}.`);});         // Launch the webserver for hosting image files
			getNewWOs();															  																							// Check now for any new Work ORders
			setInterval(getNewWOs,updateInterval) 																										// Check again every x ms`