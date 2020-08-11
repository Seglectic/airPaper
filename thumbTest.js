/***********************************************************************
 * 
 *                                thumbTest.js
 * 
 *          Literally just for testing thumbnail sending to airtable
 *           
 ***********************************************************************/

const https      = require('https');
const Airtable   = require('airtable');
const fs         = require('fs');
PNG = require("pngjs").PNG;



/***************************************
 * 
 *         sendAirtableObject()
 * 
 *  Creates object to send to Airtable
 *  from Paperless JSON data
 * 
 ***************************************/

if(fs.existsSync('airtableKey')){                                                     // Check for Paperless Parts key file and load data 
    var airtableKey = fs.readFileSync("airtableKey","UTF8");                    
    var base        = new Airtable({apiKey: airtableKey}).base('appjwkCHzyCIMJagA');  // Configure base object to post data with base ID (P3D ERP)
  }else{
    console.error("Airtable key not found! './airtableKey'")
    return;
  }



var imgurLink = "https://i.imgur.com/Lf9cDUK.jpg"
var paperLink = "https://s3-fips.us-gov-west-1.amazonaws.com/parts.app.digitalmfg/762d485e2145a283b4bef5a81eaeab74c58590b3.png"

function testThumb(){

      base('Paperless Work Orders').create([
      {
        "fields": {
          '#':123,
          'ID':-1,
          'Name':"Thumbnail Test",
          'Quantity':8,
          'Due Date':"July 21, 2020", 
          'PO#': 0,
          'Notes': "I'm just a test to see whether or not thumbnails will upload programmatically.",
          'Picture': [
            {
              "url":paperLink,
            }
          ]
        }
      }
      ], function(err, records) {
        if (err) {
          console.error(err);
          return;
        }

  
  
      });  
  }


//   testThumb();


const http = require('http');

function grabFile(url){

    const file = fs.createWriteStream("file.png");
    const request = https.get(url, function(response) {
      response.pipe(file);
    });

}

grabFile(paperLink)

// fs.createReadStream("file.png")
//   .pipe(
//     new PNG({
//       filterType: 4,
//     })
//   )
//   .on("parsed", function () {
//     for (var y = 0; y < this.height; y++) {
//       for (var x = 0; x < this.width; x++) {
//         var idx = (this.width * y + x) << 2;

//       }
//     }
 
//     this.pack().pipe(fs.createWriteStream("out.png"));
//   });

// grabFile()

testThumb();