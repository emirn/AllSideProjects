'use strict';
require('dotenv').config();
const retry = require('async-retry')
const fetch = require('node-fetch')
const MD5 = require("crypto-js/md5");
const mongoist = require('mongoist');
const fs = require('fs');

const tagger = require('./tags/tagger.js');

var db_connection = process.env.DB_CONNECTION;

if(!db_connection)
{
  console.log('no db connection!');
  return -1;
}


const db = mongoist(db_connection, {
  useNewUrlParser: true
});

async function main() {
  
  const debug = false;
  
  console.log(' debug: ' + debug); //json file with parserfolder
  console.log(' Json parser rule for siteUrl ' + process.argv[2]); //json file with parserfolder
  console.log(' AWS Lambda parser endpoint : ' + process.argv[3]); //awsendpoint
  var parserConfig = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  
  var items = await retry(async () => {
    const res = await fetch(process.argv[3], {
      method: 'POST',
      headers: {
        'Accept': 'application/jsons',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parserConfig)
    });
    
    var response = await res.json()
    if (response.items && response.items.length > 0) {
      return response.items;
    } else {
      throw new Error('Parser is unavailable');
    }
  }, {
    retries: 5,
    minTimeout: 25000
  });
  
  for (var i = 0; i < items.length; i++) {
    /*
    db.items.findOne({
      hash: MD5(items[i].sourceUrl + items[i].url + items[i].title + items[i].description)
    },
      function(err,result){
        debugger;
        if (result === null) {
          items[i] = tagger.addTags(items[i]);
          items[i].hash = MD5(items[i].sourceUrl + items[i].url + items[i].title + items[i].description);
          db.items.insert(items[i]);
        }
      }
    );
    */
    
    debugger;
    var isSold = tagger.isSold(items[i]);

    // skip out sold items (like on borderline.biz)
    if (isSold){
      console.log('-SOLD item detected!:' + items[i].url + ", " + items[i].title);
    }
    
    console.log('new item: ' + items[i].price + ", "+ items[i].title + ', ' + items[i].url);
    
    var itemHash = MD5(items[i].sourceUrl + items[i].url + items[i].title).toString();
    
    // searching if it already exists in the database
    let result = await db.items.findOne({
      hash: itemHash
    });
    
    if (result)
    {
      
      if (isSold){
        
        // existing item is sold so need to mark as sold
        console.log('SOLD item: will mark existing item as sold');
        
        if(debug){
          console.log('SOLD item fake removal (debug mode)');
          continue;
        }
        
        // udpate item with "$ sold" marker
        // remove item - commented! we don't want to remove items from database anymore!
        //await db.items.remove( { hash: { $gt: itemHash } } );
        
        var newContentTags = result.contentTags;
        
        // finally update this item
        await db.items.update({ _id : result._id },
        { 
          $set: { 
            saleType: 3, 
            contentTags: newContentTags
          }
        });        
        
        console.log('SOLD item ' + result.hash + ' is marked as sold, skipping to next result now');
        continue;
      }
      
      console.log('-DUPLICATED - skipping');
      
    }
    else if (result === null || debug) {
      
      console.log('adding new item');
      // generate hash to make sure we have unique item
      items[i].hash = MD5(items[i].sourceUrl + items[i].url + items[i].title).toString();
      
      // convert and parse price
      if (items[i].price)
      {
        items[i].price =tagger.parsePriceFromString(items[i].price);
      }
      else 
        items[i].price = 0; // else force to zero!
        
      // now adding tags. IMPORTANT: call it only after we have parsed price
      items[i] = tagger.addTags(items[i]);   
        
      if (!debug) 
        await db.items.insert(items[i]);
        
      console.log('+ADDED, price: '+ items[i].price + ', contentTags: ' + items[i].contentTags);
    }
    else 
      console.log('SKIPPED (duplicate)!');
    
  }
  db.close();
  console.log(' Scraping finished');
};
main();


