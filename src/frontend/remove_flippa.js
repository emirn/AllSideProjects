'use strict';
require('dotenv').config()
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
  
  console.log('removing flippa items')
  
  const items = await db.items.find();
  debugger;
  
  for (var i = 0; i < items.length; i++) {
    
      // fixing Flippa price
      if (items[i].categoryTags.includes("flippa") || items[i].siteUrl.indexOf('flippa') > -1) {
      
        console.log("removing " + items[i].title);
        // await db.items.remove( { hash: { $gt: items[i].hash } } );
        console.log('removed');
        
      }
      
  }

  db.close();
  console.log('removing finished');
};

main();


