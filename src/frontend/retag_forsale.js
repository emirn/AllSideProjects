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
  
  console.log('re-tagging started')
  
  const items = await db.items.find();
  debugger;
  
  var saleType = 0; // not for sale = 0, for sale = 1, pending = 2, sold = 3
  
  for (var i = 0; i < items.length; i++) {
    
      console.log('retagging item #' + i);

      var newItem = items[i];
      var j = newItem.contentTags.indexOf("for sale");
      if (j> -1){
        newItem.contentTags[j] = "$ for sale";
      }
      
      // 0 = not for sale, 1 = for sale, 2 = pending, 3 = sold
      j = newItem.contentTags.indexOf("$ for sale");
      if (j> -1){
        newItem.saleType = 3; // for sale
      }
      else 
        newItem.saleType = 0; // not for sale

      await db.items.update({ _id : items[i]._id },{ $set: { 
        contentTags: newItem.contentTags,
        saleType: newItem.saleType
      }});
      
      console.log(i + ' updated in the db');
  }

  db.close();
  console.log('re-tagging finished');
};

main();


